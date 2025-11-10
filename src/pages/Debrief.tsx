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
      // In real implementation, fetch from API
      // For now, use mock data
      const mockData: DebriefData = {
        runId: runId || "mock-run",
        caseId: "case-kaya-001",
        studentId: "student-demo",
        score: 9,
        maxScore: 13,
        percent: 69,
        grade: "Borderline",
        timeTakenSec: 670,
        rubric: [
          {
            section: "History",
            score: 2,
            max: 4,
            items: [
              { id: "H1", text: "Ask SOCRATES", achieved: 1, evidence: "asked 'where is the pain' at 00:35" },
              { id: "H2", text: "Ask agni/appetite", achieved: 0, tip: "Ask: 'How is your appetite? Any burning?'", reference: "HEB-NCH-CBDC Kayachikitsa" },
              { id: "H3", text: "Inquire about aggravating factors", achieved: 1, evidence: "asked about worse times" },
              { id: "H4", text: "Ask about recent travel", achieved: 0, tip: "Ask: 'Any recent travel or exposure?'", reference: "Virtual OSCE notes" },
            ],
          },
          {
            section: "Exam/Investigations",
            score: 3,
            max: 4,
            items: [
              { id: "E1", text: "Perform Nadi Pariksha", achieved: 1, evidence: "Nadi check performed" },
              { id: "E2", text: "Assess Pittaja signs", achieved: 1, evidence: "Checked tongue and skin" },
              { id: "E3", text: "Order relevant investigations", achieved: 1, evidence: "Ordered CBC" },
              { id: "E4", text: "Interpret lab results", achieved: 0, tip: "Explain the significance of elevated WBC", reference: "Clinical Labs Guide" },
            ],
          },
          {
            section: "Diagnosis",
            score: 1,
            max: 2,
            items: [
              { id: "D1", text: "State provisional diagnosis", achieved: 1, evidence: "Stated Pittaja Jwara" },
              { id: "D2", text: "Justify differential", achieved: 0, tip: "Provide brief differential diagnosis", reference: "Diagnostic Guidelines" },
            ],
          },
          {
            section: "Management",
            score: 2,
            max: 2,
            items: [
              { id: "M1", text: "Initiate cooling measures", achieved: 1, evidence: "Suggested cold drinks and rest" },
              { id: "M2", text: "Plan follow-up", achieved: 1, evidence: "Advised to return if worsens" },
            ],
          },
          {
            section: "Communication",
            score: 1,
            max: 1,
            items: [
              { id: "C1", text: "Explain and reassure", achieved: 1, evidence: "Clear explanation provided" },
            ],
          },
        ],
        missedChecklist: [
          { id: "H2", text: "Ask agni/appetite", tip: "Ask: 'How is your appetite? Any burning?'", resource: "Charaka Samhita — Vimana Sthana" },
          { id: "H4", text: "Ask about recent travel", tip: "Ask: 'Any recent travel or exposure?'", resource: "Clinical Methods in Ayurveda — History Taking" },
          { id: "E4", text: "Interpret lab results", tip: "Explain the significance of elevated WBC", resource: "Clinical Methods in Ayurveda — Diagnostic Reasoning" },
          { id: "D2", text: "Justify differential", tip: "Provide brief differential diagnosis", resource: "Kayachikitsa: Principles and Practice — Chapter on Jwara" },
        ],
        stepwiseReasoning: [
          "1. Fever + intense thirst → suspect Pittaja involvement",
          "2. Confirm with Nadi & tongue exam",
          "3. Order CBC & LFT to rule out systemic inflammation",
          "4. Start cooling measures and ORS; plan referral if deterioration",
        ],
        learningPearls: [
          { text: "Pittaja Jwara typically presents with intense thirst and red tongue", ref: "Kayachikitsa: Principles and Practice — Chapter on Jwara" },
          { text: "Order targeted tests; non-relevant tests return normal values", ref: "Clinical Methods in Ayurveda — Diagnostic Reasoning" },
          { text: "Systematic SOCRATES approach improves diagnostic accuracy", ref: "Clinical Methods in Ayurveda — History Taking in Ayurveda" },
        ],
        mcqs: [
          {
            id: "Q1",
            stem: "A typical Pittaja feature is:",
            choices: ["Increased thirst", "Pale tongue", "Cold intolerance", "Bradycardia"],
            correctIndex: 0,
            explanation: "Pitta produces heat and thirst. See SLO-KAY-JW-01",
          },
          {
            id: "Q2",
            stem: "Which test is most useful to confirm systemic inflammation?",
            choices: ["TSH", "CBC", "Blood glucose", "Lipid panel"],
            correctIndex: 1,
            explanation: "CBC shows leukocytosis supporting inflammatory response",
          },
          {
            id: "Q3",
            stem: "Immediate first step in febrile dehydration?",
            choices: ["Antibiotics", "Start ORS and cooling", "CT scan", "Blood culture"],
            correctIndex: 1,
            explanation: "Stabilize hydration and reduce body heat first",
          },
        ],
        audit: {
          modelMatches: [{ itemId: "H2", confidence: 72 }],
          rawModelOutputId: "case-kaya-009-modelout-uuid",
          events: ["order_test:CBC", "request_exam:nadi"],
        },
      };

      setDebriefData(mockData);
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
                <p className="text-xs text-blue-600 mt-1">— {pearl.ref}</p>
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
