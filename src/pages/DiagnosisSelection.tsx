import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { CheckCircle2, Clock, Info, Loader2 } from "lucide-react";

interface DiagnosisOption {
  id: string;
  text: string;
  hint?: string;
  sloIds?: string[];
  isCorrect?: boolean;
}

const DiagnosisSelection = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [diagnosisOptions, setDiagnosisOptions] = useState<DiagnosisOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const [justification, setJustification] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCaseData();
  }, [runId]);

  const loadCaseData = async () => {
    try {
      if (!runId) throw new Error("No run ID");

      const { data: run, error } = await supabase
        .from("simulation_runs")
        .select(`
          id,
          assignment_id,
          assignments (
            case_id,
            cases (
              clinical_json
            )
          )
        `)
        .eq("id", runId)
        .single();

      if (error) throw error;

      const clinical = run.assignments?.cases?.clinical_json as any;
      setCaseData(clinical);

      // Extract diagnosis options from case data - show actual diagnosis names
      const options: DiagnosisOption[] = clinical?.diagnosisOptions || [];

      setDiagnosisOptions(options);
    } catch (error: any) {
      console.error("Error loading case data:", error);
      toast({
        title: "Error loading case",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionId: string) => {
    setSelectedOption(optionId);
    if (optionId !== "D4") {
      setFreeText("");
    }
    setConfirmed(false);
  };

  const canProceed = () => {
    if (!confirmed) return false;
    if (selectedOption === "D4") {
      return freeText.trim().length > 0;
    }
    return selectedOption !== null;
  };

  const handleConfirm = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        run_id: runId,
        selectedOptionId: selectedOption === "D4" ? null : selectedOption,
        freeText: selectedOption === "D4" ? freeText.trim() : null,
        justification: justification.trim() || null,
      };

      trackEvent({
        event: "diagnosis_submitted",
        actor_id: "student",
        actor_role: "student",
        case_id: caseData?.id || "unknown",
        run_id: runId || "mock",
        extra: { diagnosis_id: selectedOption },
      });

      const { data, error } = await supabase.functions.invoke("submit_diagnosis", {
        body: payload,
      });

      if (error) throw error;

      toast({
        title: "Diagnosis recorded",
        description: "Proceeding to management plan",
      });

      // Navigate to management plan
      setTimeout(() => {
        navigate(`/management/${runId}`);
      }, 800);
    } catch (error) {
      console.error("Error submitting diagnosis:", error);
      toast({
        title: "Error",
        description: "Failed to submit diagnosis. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <TopMicroHeader
        title="Diagnosis Selection"
        subtitle="निदान चयन"
        onBack={() => navigate(`/simulation/${runId}`)}
        rightAction={
          <Badge variant="outline" className="rounded-full">
            <Clock className="mr-1 h-3 w-3" />
            10:45
          </Badge>
        }
      />

      <div className="p-4 space-y-4">
        {/* Instructions */}
        <Card className="p-4 bg-blue-50/50 border-blue-200">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Select the most likely diagnosis</p>
              <p className="text-xs text-blue-700 mt-1">
                Choose one option and optionally provide justification (max 250 characters)
              </p>
            </div>
          </div>
        </Card>

        {/* Diagnosis Options */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Diagnosis Options</Label>
          {diagnosisOptions.map((option) => (
            <Card
              key={option.id}
              className={`p-4 cursor-pointer transition-all ${
                selectedOption === option.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "hover:border-primary/50"
              }`}
              onClick={() => handleSelectOption(option.id)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    selectedOption === option.id
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {selectedOption === option.id && (
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{option.text}</p>
                  {option.hint && (
                    <p className="text-xs text-muted-foreground mt-1">{option.hint}</p>
                  )}
                  {option.sloIds && option.sloIds.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {option.sloIds.map((slo) => (
                        <Badge key={slo} variant="outline" className="text-xs">
                          {slo}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Free Text Input (for "Other") */}
        {selectedOption === "D4" && (
          <div className="space-y-2">
            <Label htmlFor="free-diagnosis" className="text-sm">
              Enter your diagnosis
            </Label>
            <Textarea
              id="free-diagnosis"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value.slice(0, 250))}
              placeholder="Type your provisional diagnosis..."
              className="min-h-[80px]"
              maxLength={250}
            />
            <p className="text-xs text-muted-foreground text-right">
              {freeText.length}/250 characters
            </p>
          </div>
        )}

        {/* Justification (Optional) */}
        {selectedOption && selectedOption !== "D4" && (
          <div className="space-y-2">
            <Label htmlFor="justification" className="text-sm">
              Justification (optional but encouraged)
            </Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value.slice(0, 250))}
              placeholder="One-line reason (e.g., pattern recognition: Pittaja features - intense thirst, red tongue)"
              className="min-h-[80px]"
              maxLength={250}
            />
            <p className="text-xs text-muted-foreground text-right">
              {justification.length}/250 characters
            </p>
          </div>
        )}

        {/* Confirmation Checkbox */}
        {selectedOption && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <Label
              htmlFor="confirm"
              className="text-sm text-yellow-900 cursor-pointer leading-tight"
            >
              I confirm this is my final diagnosis
            </Label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/simulation/${runId}`)}
          >
            Back
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={!canProceed() || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Confirm Diagnosis"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisSelection;
