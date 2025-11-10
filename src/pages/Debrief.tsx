import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  Download,
  Share2,
  BookOpen,
  TrendingUp,
  Award,
  AlertCircle,
} from "lucide-react";

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
  const [selectedMCQ, setSelectedMCQ] = useState<Record<number, number>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadDebriefData();
  }, [runId]);

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

      const scoreData = run.score_json as any;
      const clinicalData = run.assignments?.cases?.clinical_json as any;
      const timeTaken = run.start_at && run.end_at 
        ? Math.floor((new Date(run.end_at).getTime() - new Date(run.start_at).getTime()) / 1000)
        : 0;

      // Process rubric data
      const rubric = scoreData?.rubric || [];
      const missedItems = rubric.flatMap((section: any) => 
        section.items?.filter((item: any) => !item.achieved).map((item: any) => ({
          id: item.id,
          text: item.text,
          tip: item.tip || "Review this competency",
          resource: item.reference || "Clinical Methods in Ayurveda",
        })) || []
      );

      // Extract learning pearls and reasoning (filter out NCISM CBDC citations)
      const learningPearls = (clinicalData?.learningPearls || [])
        .filter((pearl: any) => !pearl.ref?.includes("NCISM CBDC"));

      const stepwiseReasoning = scoreData?.reasoning || [
        "Review the clinical approach for this case type",
        "Practice systematic history taking and examination",
        "Study relevant Ayurvedic principles and modern correlations",
      ];

      // Get remediation MCQs
      const { data: mcqsData } = await supabase
        .from("mcqs")
        .select("question_json")
        .eq("case_id", run.assignments?.case_id)
        .limit(3);

      const mcqs = mcqsData?.map(m => {
        const q = m.question_json as any;
        return {
          id: q.id,
          stem: q.stem || q.question,
          choices: q.choices || q.options,
          correctIndex: q.correctIndex || q.correct,
          explanation: q.explanation || q.rationale,
        };
      }) || [];

      const grade = scoreData?.grade || 
        (scoreData?.percent >= 85 ? "Distinction" : 
         scoreData?.percent >= 70 ? "Pass" :
         scoreData?.percent >= 50 ? "Borderline" : "Fail");

      const debriefData: DebriefData = {
        runId: run.id,
        caseId: run.assignments?.case_id || "",
        studentId: run.student_id,
        score: scoreData?.score || 0,
        maxScore: scoreData?.maxScore || 0,
        percent: scoreData?.percent || 0,
        grade,
        timeTakenSec: timeTaken,
        rubric,
        missedChecklist: missedItems,
        stepwiseReasoning,
        learningPearls,
        mcqs,
        audit: scoreData?.audit || {},
      };

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

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "Distinction": return "text-green-600";
      case "Pass": return "text-blue-600";
      case "Borderline": return "text-yellow-600";
      case "Fail": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleMCQAnswer = (mcqIndex: number, choiceIndex: number) => {
    setSelectedMCQ({ ...selectedMCQ, [mcqIndex]: choiceIndex });
  };

  const handleDownloadPDF = () => {
    toast({
      title: "Download started",
      description: "Your debrief PDF will download shortly",
    });
  };

  const handleShare = () => {
    toast({
      title: "Shared with faculty",
      description: "Your debrief has been sent to your instructor",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading debrief...</p>
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
        title="Performance Debrief"
        subtitle="रोगी परीक्षण फीडबैक"
        onBack={() => navigate("/student")}
      />

      <div className="p-4 space-y-4">
        {/* Score Summary Card */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-3xl font-bold ${getGradeColor(debriefData.grade)}`}>
                {debriefData.percent}%
              </h2>
              <p className="text-lg font-semibold">{debriefData.grade}</p>
            </div>
            <div className="text-right">
              <Award className={`h-12 w-12 ${getGradeColor(debriefData.grade)}`} />
            </div>
          </div>
          <Progress value={debriefData.percent} className="h-3 mb-3" />
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">
              {debriefData.score}/{debriefData.maxScore} points
            </Badge>
            <Badge variant="outline">Time: {formatTime(debriefData.timeTakenSec)}</Badge>
          </div>
        </Card>

        {/* Rubric Breakdown */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Rubric Breakdown
          </h3>
          <div className="space-y-2">
            {debriefData.rubric.map((section, idx) => (
              <Collapsible
                key={idx}
                open={openSections[section.section]}
                onOpenChange={(open) => setOpenSections({ ...openSections, [section.section]: open })}
              >
                <Card className="p-3">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{section.section}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={(section.score / section.max) * 100}
                            className="h-2 flex-1"
                          />
                          <span className="text-xs text-muted-foreground">
                            {section.score}/{section.max}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 ml-2 transition-transform" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-2">
                    {section.items.map((item: any, itemIdx: number) => (
                      <div key={itemIdx} className="flex items-start gap-2 text-xs">
                        {item.achieved ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={item.achieved ? "text-foreground" : "text-muted-foreground"}>
                            {item.text}
                          </p>
                          {item.evidence && (
                            <p className="text-muted-foreground italic mt-1">{item.evidence}</p>
                          )}
                          {!item.achieved && item.tip && (
                            <p className="text-yellow-600 mt-1">💡 {item.tip}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </Card>

        {/* Missed Checklist */}
        {debriefData.missedChecklist.length > 0 && (
          <Card className="p-4 border-yellow-200 bg-yellow-50/50">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              Areas for Improvement ({debriefData.missedChecklist.length})
            </h3>
            <div className="space-y-2">
              {debriefData.missedChecklist.map((item: any, idx: number) => (
                <Card key={idx} className="p-3 bg-white">
                  <p className="text-sm font-medium">{item.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">💡 {item.tip}</p>
                  <p className="text-xs text-blue-600 mt-1">📖 {item.resource}</p>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Stepwise Reasoning */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Expected Clinical Reasoning
          </h3>
          <ol className="space-y-2">
            {debriefData.stepwiseReasoning.map((step, idx) => (
              <li key={idx} className="text-sm text-muted-foreground">
                {step}
              </li>
            ))}
          </ol>
        </Card>

        {/* Learning Pearls */}
        <Card className="p-4 bg-blue-50/50 border-blue-200">
          <h3 className="font-semibold mb-3 text-blue-800">🌟 Learning Pearls</h3>
          <div className="space-y-2">
            {debriefData.learningPearls.map((pearl, idx) => (
              <div key={idx} className="text-sm">
                <p className="text-foreground">{pearl.text}</p>
                {pearl.ref && !pearl.ref.includes("NCISM CBDC") && (
                  <p className="text-xs text-blue-600 mt-1">— {pearl.ref}</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Remediation MCQs */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Remediation Questions</h3>
          <div className="space-y-4">
            {debriefData.mcqs.map((mcq, mcqIdx) => (
              <Card key={mcqIdx} className="p-4 bg-accent/5">
                <p className="text-sm font-medium mb-3">{mcq.stem}</p>
                <div className="space-y-2">
                  {mcq.choices.map((choice: string, choiceIdx: number) => {
                    const isSelected = selectedMCQ[mcqIdx] === choiceIdx;
                    const isCorrect = choiceIdx === mcq.correctIndex;
                    const showAnswer = selectedMCQ[mcqIdx] !== undefined;

                    return (
                      <Button
                        key={choiceIdx}
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full justify-start text-left h-auto py-2 ${
                          showAnswer && isCorrect ? "border-green-500 bg-green-50" : ""
                        } ${showAnswer && isSelected && !isCorrect ? "border-red-500 bg-red-50" : ""}`}
                        onClick={() => handleMCQAnswer(mcqIdx, choiceIdx)}
                        disabled={showAnswer}
                      >
                        <span className="mr-2">{String.fromCharCode(65 + choiceIdx)}.</span>
                        {choice}
                        {showAnswer && isCorrect && <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" />}
                      </Button>
                    );
                  })}
                </div>
                {selectedMCQ[mcqIdx] !== undefined && (
                  <p className="text-xs text-muted-foreground mt-3 p-2 bg-blue-50 rounded">
                    {mcq.explanation}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        <Button className="w-full" onClick={() => navigate("/student")}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Debrief;
