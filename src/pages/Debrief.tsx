import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, X, Loader2 } from "lucide-react";
import { getReferenceForTopic, getCitationForArea } from "@/lib/clinical-references";

interface DebriefData {
  runId: string;
  caseId: string;
  studentId: string;
  score: number;
  maxScore: number;
  percent: number;
  grade: string;
  timeTakenSec: number;
  rubric: any[];
  missedChecklist: any[];
  stepwiseReasoning: string[];
  learningPearls: any[];
  mcqs: any[];
  audit: any;
}

const Debrief = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [debriefData, setDebriefData] = useState<DebriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [selectedMCQ, setSelectedMCQ] = useState<Record<number, number>>({});
  const [expandedMissed, setExpandedMissed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadDebriefData();
  }, [runId]);

  const retryScoring = async () => {
    setRetrying(true);
    try {
      if (!runId) throw new Error("No run ID");

      toast({
        title: "Rescoring assessment...",
        description: "This may take a moment",
      });

      // Fetch run data
      const { data: run, error: runError } = await supabase
        .from("simulation_runs")
        .select(`
          id,
          transcript,
          actions,
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

      if (runError) throw runError;

      const clinicalCase = run.assignments?.cases?.clinical_json;

      // Call scoring function
      const { data: scoreResult, error: scoreError } = await supabase.functions.invoke("score_case", {
        body: {
          run_id: runId,
          transcript: run.transcript || [],
          actions: run.actions || [],
          caseData: clinicalCase,
        },
      });

      if (scoreError) throw scoreError;

      // Update simulation run with new score
      const { error: updateError } = await supabase
        .from("simulation_runs")
        .update({
          score_json: scoreResult,
        })
        .eq("id", runId);

      if (updateError) throw updateError;

      toast({
        title: "Rescoring complete",
        description: "Your assessment has been updated",
      });

      // Reload debrief data
      await loadDebriefData();
    } catch (error: any) {
      console.error("Error retrying scoring:", error);
      toast({
        title: "Rescoring failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setRetrying(false);
    }
  };

  const loadDebriefData = async () => {
    try {
      if (!runId) {
        throw new Error("No run ID provided");
      }

      // Fetch simulation run data
      const { data: run, error: runError } = await supabase
        .from("simulation_runs")
        .select(`
          id,
          student_id,
          score_json,
          created_at,
          start_at,
          end_at,
          transcript,
          actions,
          assignment_id,
          assignments (
            case_id,
            cases (
              id,
              title,
              subject,
              clinical_json,
              cbdc_tags
            )
          )
        `)
        .eq("id", runId)
        .single();

      if (runError) throw runError;
      if (!run) throw new Error("Run not found");

      const scoreData = (run.score_json as any) || {};
      const clinicalData = run.assignments?.cases?.clinical_json as any;
      const timeTaken =
        run.start_at && run.end_at
          ? Math.floor(
              (new Date(run.end_at).getTime() - new Date(run.start_at).getTime()) / 1000
            )
          : 0;

      console.log("Debrief data:", { scoreData, clinicalData, run });

      // Normalize score fields from different backends
      const score = scoreData?.score ?? scoreData?.totalPoints ?? 0;
      const maxScore = scoreData?.maxScore ?? scoreData?.maxPoints ?? 0;
      const percent = scoreData?.percent ?? scoreData?.percentage ?? (maxScore > 0 ? Math.round((score / maxScore) * 100) : 0);
      const rubric = scoreData?.rubric ?? scoreData?.sections ?? [];
      const missedChecklist = scoreData?.missedChecklist ?? scoreData?.missedItems ?? [];
      const stepwiseReasoning = scoreData?.stepwiseReasoning ?? scoreData?.reasoning ?? [
        "Review the clinical approach for this case type",
        "Practice systematic history taking and examination",
        "Study relevant Ayurvedic principles and modern correlations",
      ];
      const learningPearls = scoreData?.learningPearls ?? scoreData?.pearls ?? [
        {
          text: "Review case competencies and clinical reasoning pathways",
          ref: "Clinical Methods in Ayurveda",
        },
      ];

      // Get remediation MCQs
      const { data: mcqsData } = await supabase
        .from("mcqs")
        .select("question_json")
        .eq("case_id", run.assignments?.case_id)
        .limit(3);

      const mcqs =
        mcqsData?.map((m) => {
          const q = m.question_json as any;
          return {
            id: q.id,
            stem: q.stem || q.question,
            choices: q.choices || q.options,
            correctIndex: q.correctIndex || q.correct,
            explanation: q.explanation || q.rationale,
          };
        }) || [];

      const grade =
        scoreData?.grade ||
        (percent >= 85
          ? "Distinction"
          : percent >= 70
          ? "Pass"
          : percent >= 50
          ? "Borderline"
          : "Fail");

      const debriefData: DebriefData = {
        runId: run.id,
        caseId: run.assignments?.case_id || "",
        studentId: run.student_id,
        score,
        maxScore,
        percent,
        grade,
        timeTakenSec: timeTaken,
        rubric,
        missedChecklist,
        stepwiseReasoning,
        learningPearls,
        mcqs,
        audit: scoreData?.audit || { modelMatches: scoreData?.llmMatches || [] },
      };

      console.log("Final debrief data:", debriefData);
      setDebriefData(debriefData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load debrief data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMCQAnswer = (mcqIndex: number, choiceIndex: number) => {
    setSelectedMCQ({
      ...selectedMCQ,
      [mcqIndex]: choiceIndex,
    });
  };

  const toggleMissedItem = (index: number) => {
    setExpandedMissed({
      ...expandedMissed,
      [index]: !expandedMissed[index],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!debriefData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No debrief data found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopMicroHeader
        title="OSCE Debrief"
        subtitle="रोगी परीक्षण फीडबैक"
        onBack={() => navigate("/student")}
      />

      <div className="p-4 space-y-4">
        {/* Header - Single Line */}
        <Card className="p-3 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="text-sm font-semibold">
            Score: {debriefData.score}/{debriefData.maxScore} — {debriefData.percent}% • {debriefData.grade}
          </div>
        </Card>

        {/* 1) OSCE Feedback — per rubric section */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">1) OSCE feedback — per rubric section</h3>
          {debriefData.rubric.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rubric data available</p>
          ) : (
            <div className="space-y-3">
              {debriefData.rubric.map((section, idx) => (
                <div key={idx} className="border-l-2 border-primary/30 pl-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold">{section.section}</p>
                    <Badge variant="outline" className="text-xs">
                      {section.score}/{section.max}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Missed:{" "}
                    {section.items.filter((item: any) => !item.achieved).length === 0
                      ? "All items completed"
                      : `${section.items.filter((item: any) => !item.achieved).length} item(s)`}
                  </p>
                  {section.items.filter((item: any) => !item.achieved).length > 0 && (
                    <div className="space-y-1">
                      {section.items
                        .filter((item: any) => !item.achieved)
                        .map((item: any, itemIdx: number) => (
                          <div key={itemIdx} className="flex items-start gap-2">
                            <X className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                            <p className="text-xs">
                              {item.id} — {item.text}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 2) Missed-item checklist (tappable items) */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">2) Missed-item checklist</h3>
          {debriefData.missedChecklist.length === 0 ? (
            <p className="text-sm text-muted-foreground">No missed items — excellent work!</p>
          ) : (
            <div className="space-y-2">
              {debriefData.missedChecklist.map((item: any, idx: number) => (
                <Card
                  key={idx}
                  className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleMissedItem(idx)}
                >
                  <div className="flex items-start gap-2">
                    <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">{item.text}</p>
                      {expandedMissed[idx] && (
                        <div className="mt-2 pt-2 border-t space-y-1">
                          <p className="text-xs text-muted-foreground">💡 Tip: {item.tip}</p>
                          <p className="text-xs text-primary">📖 Read: {item.resource}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* 3) Stepwise clinical reasoning (numbered, short) */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">3) Stepwise clinical reasoning</h3>
          <div className="space-y-2">
            {debriefData.stepwiseReasoning.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="shrink-0 text-xs font-bold text-primary">{idx + 1}.</span>
                <p className="text-sm">{step}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* 4) 3 short learning pearls (1-line each) + single-line reading citation */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">4) Learning pearls (1-line each)</h3>
          <div className="space-y-2">
            {debriefData.learningPearls
              .filter((pearl) => !pearl.ref?.includes("NCISM CBDC"))
              .slice(0, 3)
              .map((pearl, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium">Pearl {idx + 1}:</span> {pearl.text}
                  {pearl.ref && (
                    <span className="text-xs text-primary"> — (Read: {pearl.ref})</span>
                  )}
                </div>
              ))}
          </div>
        </Card>

        {/* 5) 3 remediation MCQs (short) — include correct answer + 1-line rationale */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">5) Remediation MCQs</h3>
          {debriefData.mcqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No remediation questions available</p>
          ) : (
            <div className="space-y-4">
              {debriefData.mcqs.slice(0, 3).map((mcq, mcqIdx) => (
                <div key={mcqIdx} className="space-y-2">
                  <p className="text-sm font-medium">
                    Q{mcqIdx + 1}: {mcq.stem}
                  </p>
                  <div className="space-y-1">
                    {mcq.choices.map((choice: string, choiceIdx: number) => {
                      const isCorrect = choiceIdx === mcq.correctIndex;

                      return (
                        <div
                          key={choiceIdx}
                          className={`p-2 rounded text-sm ${
                            isCorrect
                              ? "bg-green-100 border border-green-300"
                              : "bg-accent/30"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isCorrect && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                            <span className="font-medium">
                              {String.fromCharCode(65 + choiceIdx)})
                            </span>
                            <span className={isCorrect ? "font-semibold" : ""}>{choice}</span>
                            {isCorrect && (
                              <span className="ml-auto text-xs text-green-700">— Correct</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 pl-2 border-l-2 border-primary/30">
                    <span className="font-medium">Rationale:</span> {mcq.explanation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={retryScoring}
            disabled={retrying}
          >
            {retrying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rescoring...
              </>
            ) : (
              "Retry Scoring"
            )}
          </Button>
          <Button className="flex-1" onClick={() => navigate("/student")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Debrief;
