import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  onSuccess: () => void;
}

export const AssignmentModal = ({
  isOpen,
  onClose,
  caseId,
  onSuccess,
}: AssignmentModalProps) => {
  const { toast } = useToast();
  const [isAssigning, setIsAssigning] = useState(false);
  const [deadline, setDeadline] = useState("");

  const handleAssign = async () => {
    if (!deadline) {
      toast({
        title: "Deadline required",
        description: "Please set a deadline for this assignment",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);

    try {
      const { data, error } = await supabase.functions.invoke("assign_case", {
        body: {
          case_id: caseId,
          deadline_at: new Date(deadline).toISOString(),
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Case assigned successfully",
        description: "Students can now access this case",
      });

      onSuccess();
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
          <DialogTitle className="text-xl font-bold">
            Assign Case to Students
            <span className="block text-sm font-normal text-muted-foreground mt-1" lang="hi">
              केस असाइनमेंट
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Students must complete the case before this deadline
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isAssigning}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isAssigning || !deadline}
              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-[#7AA86E] text-white"
            >
              {isAssigning ? "Assigning..." : "Assign Case"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
