import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, AlertTriangle, Stethoscope, FlaskConical, Building2, Loader2 } from "lucide-react";

interface ManagementOption {
  id: string;
  text: string;
  section: "immediate" | "investigations" | "definitive";
  hint?: string;
}

const ManagementPlan = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [managementOptions, setManagementOptions] = useState<{
    immediate: ManagementOption[];
    investigations: ManagementOption[];
    definitive: ManagementOption[];
  }>({
    immediate: [],
    investigations: [],
    definitive: [],
  });
  const [selectedImmediate, setSelectedImmediate] = useState<string[]>([]);
  const [selectedInvestigations, setSelectedInvestigations] = useState<string[]>([]);
  const [selectedDefinitive, setSelectedDefinitive] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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

      // Set management options from case data (support both flat and sectioned shapes), with safe fallbacks
      let immediate: ManagementOption[] = [];
      let investigations: ManagementOption[] = [];
      let definitive: ManagementOption[] = [];

      const mgmt = clinical?.managementOptions;
      if (Array.isArray(mgmt)) {
        immediate = mgmt as ManagementOption[];
      } else if (mgmt && typeof mgmt === "object") {
        immediate = (mgmt.immediate as ManagementOption[]) || [];
        investigations = (mgmt.investigations as ManagementOption[]) || [];
        definitive = (mgmt.definitive as ManagementOption[]) || [];
      }

      if (!immediate.length) {
        immediate = [
          { id: "A1", text: "Start initial stabilization measures", section: "immediate", hint: "First-line intervention" },
          { id: "A2", text: "Start supportive care", section: "immediate", hint: "Symptomatic relief" },
          { id: "A3", text: "Monitor vital signs", section: "immediate", hint: "Ongoing assessment" },
        ];
      }
      
      if (!investigations.length) {
        investigations = [
          { id: "B1", text: "Order relevant investigations", section: "investigations" },
          { id: "B2", text: "Perform targeted examination", section: "investigations" },
        ];
      }
      
      if (!definitive.length) {
        definitive = [
          { id: "C1", text: "Outpatient care with follow-up", section: "definitive" },
          { id: "C2", text: "Admit for observation and treatment", section: "definitive" },
          { id: "C3", text: "Refer to specialist/tertiary center", section: "definitive" },
        ];
      }

      setManagementOptions({ immediate, investigations, definitive });
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

  const toggleImmediate = (optionId: string) => {
    setSelectedImmediate((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    );
  };

  const toggleInvestigation = (optionId: string) => {
    setSelectedInvestigations((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    );
  };

  const canProceed = () => {
    return (selectedImmediate.length > 0 || selectedDefinitive !== null);
  };

  const handleConfirmClick = () => {
    if (!canProceed()) {
      toast({
        title: "Incomplete selection",
        description: "Please select at least one immediate action or definitive plan",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleFinalSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    try {
      const payload = {
        run_id: runId,
        immediate: selectedImmediate,
        investigations: selectedInvestigations,
        definitive: selectedDefinitive,
        freeText: freeText.trim() || null,
      };

      trackEvent({
        event: "management_submitted",
        actor_id: "student-demo",
        actor_role: "student",
        case_id: caseData.id,
        run_id: runId || "mock",
        extra: { 
          immediate_count: selectedImmediate.length,
          investigations_count: selectedInvestigations.length,
        },
      });

      const { data, error } = await supabase.functions.invoke("submit_management", {
        body: payload,
      });

      if (error) throw error;

      toast({
        title: "Management plan recorded",
        description: "Submitting for scoring...",
      });

      // Now submit the entire run for scoring
      const { data: submitData, error: submitError } = await supabase.functions.invoke("submit_run", {
        body: {
          run_id: runId,
          student_id: "student-demo",
        },
      });

      if (submitError) throw submitError;

      // Navigate to debrief
      setTimeout(() => {
        navigate(`/debrief/${runId}`);
      }, 1500);
    } catch (error) {
      console.error("Error submitting management:", error);
      toast({
        title: "Error",
        description: "Failed to submit management plan. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const getSummaryText = () => {
    const parts = [];
    
    if (selectedImmediate.length > 0) {
      const immediateTexts = managementOptions.immediate
        .filter((opt) => selectedImmediate.includes(opt.id))
        .map((opt) => opt.text);
      parts.push(`Immediate: ${immediateTexts.join(", ")}`);
    }
    
    if (selectedInvestigations.length > 0) {
      parts.push(`Investigations: ${selectedInvestigations.length} test(s)`);
    }
    
    if (selectedDefinitive) {
      const definitiveText = managementOptions.definitive.find((opt) => opt.id === selectedDefinitive)?.text;
      parts.push(`Disposition: ${definitiveText}`);
    }

    return parts.join(" | ");
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
        title="Management Plan"
        subtitle="प्रबंधन योजना"
        onBack={() => navigate(`/diagnosis/${runId}`)}
        rightAction={
          <Badge variant="outline" className="rounded-full">
            <Clock className="mr-1 h-3 w-3" />
            8:22
          </Badge>
        }
      />

      <div className="p-4 space-y-6">
        {/* Selected Diagnosis Display */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <p className="text-xs text-muted-foreground">Your diagnosis</p>
          <p className="text-sm font-semibold mt-1">Pittaja Jwara (Pitta predominant fever)</p>
        </Card>

        {/* Section A: Immediate Actions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <Label className="text-sm font-semibold">Section A — Immediate / Stabilizing Actions</Label>
          </div>
          <p className="text-xs text-muted-foreground">Select primary immediate actions (multi-select)</p>
          <div className="space-y-2">
            {managementOptions.immediate.map((option) => (
              <Card
                key={option.id}
                className={`p-3 cursor-pointer transition-all ${
                  selectedImmediate.includes(option.id)
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => toggleImmediate(option.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedImmediate.includes(option.id)}
                    onCheckedChange={() => toggleImmediate(option.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm">{option.text}</p>
                    {option.hint && (
                      <p className="text-xs text-muted-foreground mt-1">{option.hint}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Section B: Investigations */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-blue-600" />
            <Label className="text-sm font-semibold">Section B — Investigations to Order</Label>
          </div>
          <p className="text-xs text-muted-foreground">Select relevant tests (multi-select)</p>
          <div className="space-y-2">
            {managementOptions.investigations.map((option) => (
              <Card
                key={option.id}
                className={`p-3 cursor-pointer transition-all ${
                  selectedInvestigations.includes(option.id)
                    ? "border-blue-500 bg-blue-50/50"
                    : "hover:border-blue-500/50"
                }`}
                onClick={() => toggleInvestigation(option.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedInvestigations.includes(option.id)}
                    onCheckedChange={() => toggleInvestigation(option.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm">{option.text}</p>
                    {option.hint && (
                      <p className="text-xs text-muted-foreground mt-1">{option.hint}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Section C: Definitive Management */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            <Label className="text-sm font-semibold">Section C — Definitive Management / Disposition</Label>
          </div>
          <p className="text-xs text-muted-foreground">Select disposition (single-select)</p>
          <div className="space-y-2">
            {managementOptions.definitive.map((option) => (
              <Card
                key={option.id}
                className={`p-3 cursor-pointer transition-all ${
                  selectedDefinitive === option.id
                    ? "border-green-500 bg-green-50/50"
                    : "hover:border-green-500/50"
                }`}
                onClick={() => setSelectedDefinitive(option.id)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedDefinitive === option.id
                        ? "border-green-500 bg-green-500"
                        : "border-muted-foreground"
                    }`}
                  >
                    {selectedDefinitive === option.id && (
                      <div className="h-2 w-2 bg-white rounded-full" />
                    )}
                  </div>
                  <p className="text-sm flex-1">{option.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Optional Free Text Plan */}
        <div className="space-y-2">
          <Label htmlFor="plan-text" className="text-sm">
            Brief reasoning (optional, max 400 chars)
          </Label>
          <Textarea
            id="plan-text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value.slice(0, 400))}
            placeholder="Brief management rationale..."
            className="min-h-[100px]"
            maxLength={400}
          />
          <p className="text-xs text-muted-foreground text-right">
            {freeText.length}/400 characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/diagnosis/${runId}`)}
          >
            Back to Diagnosis
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirmClick}
            disabled={!canProceed() || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Confirm Management"}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You selected:</p>
              <p className="text-sm font-medium text-foreground">{getSummaryText()}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Confirm to submit — this will be scored.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalSubmit}>
              Confirm & Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManagementPlan;
