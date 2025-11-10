import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Send, 
  Clock, 
  Stethoscope, 
  FlaskConical, 
  Activity,
  Eye,
  EyeOff,
  CheckCircle2
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import sampleCase from "@/data/sample-case.json";

interface Message {
  role: "patient" | "student";
  content: string;
  timestamp: Date;
}

interface ExamFinding {
  name: string;
  value: string;
  revealed: boolean;
}

interface LabTest {
  name: string;
  ordered: boolean;
  result: string;
}

const SUGGESTED_PROMPTS = [
  "Can you describe your pain?",
  "When did this symptom start?",
  "Does anything make it better or worse?",
  "Are you taking any medications?",
];

const Simulation = () => {
  const { id: assignmentId } = useParams();
  const { toast } = useToast();
  
  // Load case data (in real app, fetch from assignment)
  const caseData = sampleCase as any;
  
  const [runId] = useState(crypto.randomUUID());
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "patient",
      content: `Namaste Doctor. ${caseData.stem}`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(caseData.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Vitals & Physical Exam state
  const [examFindings, setExamFindings] = useState<ExamFinding[]>(
    Object.entries(caseData.script.onRequestExam || {}).map(([name, value]) => ({
      name,
      value: String(value),
      revealed: false,
    }))
  );
  const [showVitals, setShowVitals] = useState(false);
  
  // Lab tests state
  const [labTests, setLabTests] = useState<LabTest[]>([
    ...Object.entries(caseData.script.labsOnOrder || {}).map(([name, result]) => ({
      name,
      ordered: false,
      result: String(result),
    })),
    // Add common tests with normalized values
    { name: "Blood_glucose", ordered: false, result: "95 mg/dL (Normal: 70-100)" },
    { name: "Serum_creatinine", ordered: false, result: "0.9 mg/dL (Normal: 0.6-1.2)" },
    { name: "TSH", ordered: false, result: "2.5 mIU/L (Normal: 0.5-5.0)" },
  ]);
  const [showLabResults, setShowLabResults] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return;

    const userMessage: Message = {
      role: "student",
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput("");
    setIsSending(true);

    trackEvent({
      event: "student_message",
      actor_id: "student-demo",
      actor_role: "student",
      case_id: caseData.id,
      run_id: runId,
      extra: { message_length: input.length },
    });

    try {
      const { data, error } = await supabase.functions.invoke("student_message", {
        body: {
          run_id: runId,
          message: input,
          conversationHistory: messages,
          caseData,
        },
      });

      if (error) throw error;

      const vpResponse: Message = {
        role: "patient",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, vpResponse]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleRevealExam = (index: number) => {
    setExamFindings((prev) =>
      prev.map((finding, i) => (i === index ? { ...finding, revealed: true } : finding))
    );
    trackEvent({
      event: "action_physical_exam",
      actor_id: "student-demo",
      actor_role: "student",
      case_id: caseData.id,
      run_id: runId,
      extra: { exam_type: examFindings[index].name },
    });
  };

  const handleOrderLab = (index: number) => {
    setLabTests((prev) =>
      prev.map((test, i) => (i === index ? { ...test, ordered: true } : test))
    );
    trackEvent({
      event: "action_order_labs",
      actor_id: "student-demo",
      actor_role: "student",
      case_id: caseData.id,
      run_id: runId,
      extra: { lab_test: labTests[index].name },
    });
    toast({
      title: "Lab ordered",
      description: `${labTests[index].name.replace(/_/g, " ")} has been ordered`,
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    trackEvent({
      event: "run_submit",
      actor_id: "student-demo",
      actor_role: "student",
      case_id: caseData.id,
      run_id: runId,
    });
    
    toast({
      title: "Simulation completed",
      description: "Calculating your score...",
    });
    
    // In real app: call submit_run edge function and navigate to debrief
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Link to="/student">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-sm">{caseData.title}</h1>
            <p className="text-xs text-muted-foreground">Virtual OSCE</p>
          </div>
        </div>
        <Badge variant="outline" className="rounded-full px-3">
          <Clock className="mr-1 h-3 w-3" />
          {formatTime(timeRemaining)}
        </Badge>
      </header>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="exam">
            <Stethoscope className="mr-1 h-3 w-3" />
            Examination
          </TabsTrigger>
          <TabsTrigger value="labs">
            <FlaskConical className="mr-1 h-3 w-3" />
            Labs
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
          {/* Patient Info Card */}
          <Card className="m-4 p-3 bg-accent/5">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{caseData.patient.name}</p>
                <p className="text-xs text-muted-foreground">
                  {caseData.patient.age}y, {caseData.patient.gender === "M" ? "Male" : "Female"}
                </p>
              </div>
            </div>
          </Card>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === "student"
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent/50 text-foreground"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </Card>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 border-t bg-accent/5">
              <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
              <div className="flex gap-2 overflow-x-auto">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    className="text-xs rounded-2xl whitespace-nowrap"
                    onClick={() => setInput(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t bg-card px-4 py-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isSending && handleSendMessage()}
                placeholder="Ask the patient..."
                className="rounded-2xl"
                disabled={isSending}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="rounded-full shrink-0"
                disabled={isSending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Examination Tab */}
        <TabsContent value="exam" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Vitals Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Vital Signs
                </h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor="vitals-toggle" className="text-xs">Show</Label>
                  <Switch
                    id="vitals-toggle"
                    checked={showVitals}
                    onCheckedChange={setShowVitals}
                  />
                </div>
              </div>
              {showVitals && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {Object.entries(caseData.vitals).map(([key, value]) => (
                    <div key={key} className="bg-accent/20 p-2 rounded-lg">
                      <p className="text-xs text-muted-foreground">{key.toUpperCase()}</p>
                      <p className="text-sm font-medium">{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Physical Examination Findings */}
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                Physical Examination
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Click to reveal examination findings
              </p>
              <div className="space-y-2">
                {examFindings.map((finding, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize mb-1">
                          {finding.name.replace(/_/g, " ")}
                        </p>
                        {finding.revealed ? (
                          <p className="text-xs text-muted-foreground">{finding.value}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Click to reveal</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={finding.revealed ? "ghost" : "outline"}
                        onClick={() => handleRevealExam(idx)}
                        disabled={finding.revealed}
                      >
                        {finding.revealed ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Labs Tab */}
        <TabsContent value="labs" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  Laboratory Tests
                </h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor="results-toggle" className="text-xs">
                    {showLabResults ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Label>
                  <Switch
                    id="results-toggle"
                    checked={showLabResults}
                    onCheckedChange={setShowLabResults}
                  />
                </div>
              </div>
              <Separator className="my-3" />
              <div className="space-y-2">
                {labTests.map((test, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {test.name.replace(/_/g, " ")}
                        </p>
                        {showLabResults && (
                          <p className="text-xs text-muted-foreground mt-1">{test.result}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={test.ordered ? "ghost" : "outline"}
                        onClick={() => handleOrderLab(idx)}
                        disabled={test.ordered}
                      >
                        {test.ordered ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          "Order"
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                * Results include normalized values for all tests (ordered and unordered)
              </p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit Button - Fixed at bottom */}
      <div className="border-t bg-card px-4 py-3">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full rounded-2xl"
          size="lg"
        >
          Submit Assessment
        </Button>
      </div>
    </div>
  );
};

export default Simulation;
