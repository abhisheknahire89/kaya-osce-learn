import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrimaryCTA } from "@/components/ui/primary-cta";
import { Button } from "@/components/ui/button";
import { X, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { COHORTS } from "@/constants/cohorts";

interface AssignCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  onAssignComplete: () => void;
}

export const AssignCohortModal = ({
  isOpen,
  onClose,
  caseId,
  onAssignComplete,
}: AssignCohortModalProps) => {
  const { toast } = useToast();
  const cohorts = COHORTS;
  const [selectedCohort, setSelectedCohort] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeLimit, setTimeLimit] = useState(12);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set default dates
      const now = new Date();
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      setStartDate(now.toISOString().split('T')[0]);
      setEndDate(weekLater.toISOString().split('T')[0]);
      
      // Auto-select "3rd year"
      setSelectedCohort("3rd-year");
    }
  }, [isOpen]);

  const handleAssign = async () => {
    if (!selectedCohort) {
      toast({
        title: "Missing cohort",
        description: "Please select a cohort to assign",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);

    try {
      const { data, error } = await supabase.functions.invoke("assign_case", {
        body: {
          case_id: caseId,
          cohort_id: selectedCohort,
          start_at: new Date(startDate).toISOString(),
          end_at: new Date(endDate + "T23:59:59").toISOString(),
          time_limit: timeLimit,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Case assigned successfully",
        description: "Students in the cohort will be notified",
      });

      onAssignComplete();
      onClose();
    } catch (error: any) {
      console.error("Error assigning case:", error);
      toast({
        title: "Assignment failed",
        description: error.message || "Failed to assign case. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Assign to Cohort
            <span className="block text-sm font-normal text-muted-foreground ml-2" lang="hi">
              कोहॉर्ट असाइन करें
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cohort Selection */}
          <div className="space-y-2">
            <Label htmlFor="cohort">Select Cohort *</Label>
            <Select value={selectedCohort} onValueChange={setSelectedCohort}>
              <SelectTrigger id="cohort">
                <SelectValue placeholder="Choose a cohort" />
              </SelectTrigger>
              <SelectContent>
                {cohorts.map((cohort) => (
                  <SelectItem key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date *</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
            />
          </div>

          {/* Time Limit */}
          <div className="space-y-2">
            <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
            <Input
              id="timeLimit"
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value) || 12)}
              min={5}
              max={60}
            />
          </div>

          {/* Info Note */}
          <div className="bg-accent/20 p-3 rounded-lg text-sm text-muted-foreground">
            Students in the selected cohort will be able to start this assessment between the specified dates.
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAssigning}
            className="flex-1 rounded-xl"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <PrimaryCTA
            onClick={handleAssign}
            disabled={!selectedCohort || isAssigning}
            className="flex-1"
          >
            {isAssigning ? "Assigning..." : "Assign"}
          </PrimaryCTA>
        </div>
      </DialogContent>
    </Dialog>
  );
};
