import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap } from "lucide-react";
import kayaLogo from "@/assets/kaya-logo.png";
import { COHORTS } from "@/constants/cohorts";

interface StudentOnboardingProps {
  isOpen: boolean;
  userId: string;
  userName: string;
}

export const StudentOnboarding = ({ isOpen, userId, userName }: StudentOnboardingProps) => {
  const cohorts = COHORTS;
  const [selectedCohort, setSelectedCohort] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleComplete = async () => {
    if (!selectedCohort) {
      toast({
        title: "Cohort required",
        description: "Please select your cohort to continue",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update profile with cohort metadata
      const { error } = await supabase
        .from('profiles')
        .update({
          metadata: { cohort_id: selectedCohort }
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Profile completed!",
        description: "Welcome to Kaya CBDC V-OSCE",
      });

      // Navigate to student dashboard
      navigate("/student");
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-4">
          <div className="flex justify-center">
            <img src={kayaLogo} alt="Kaya Logo" className="h-16 w-auto" />
          </div>
          <DialogTitle className="text-2xl text-center">
            स्वागतम् Welcome, {userName}!
          </DialogTitle>
          <DialogDescription className="text-center" lang="hi">
            Complete your profile to get started with virtual OSCEs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-accent/10 p-4 rounded-xl flex items-start gap-3">
            <GraduationCap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">Select Your Cohort</p>
              <p className="text-muted-foreground text-xs">
                Your cohort determines which OSCE cases are assigned to you by faculty.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboarding-cohort">Cohort / समूह *</Label>
            <Select value={selectedCohort} onValueChange={setSelectedCohort}>
              <SelectTrigger id="onboarding-cohort" className="rounded-xl">
                <SelectValue placeholder="Select your cohort" />
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

          <Button
            onClick={handleComplete}
            disabled={!selectedCohort || isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-primary to-[#7AA86E]"
            size="lg"
          >
            {isSubmitting ? "Setting up..." : "Complete Profile"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
