import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Send, 
  Clock, 
  Stethoscope, 
  FlaskConical, 
  UserRound,
  MessageSquare,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";

interface Message {
  role: "patient" | "student";
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { id: "socrates", label: "Ask SOCRATES", icon: MessageSquare },
  { id: "exam", label: "Physical Exam", icon: Stethoscope },
  { id: "labs", label: "Order Labs", icon: FlaskConical },
  { id: "nadi", label: "Check Nadi", icon: Activity },
  { id: "history", label: "Take History", icon: UserRound },
];

const SUGGESTED_PROMPTS = [
  "Can you describe your main complaint?",
  "When did this start?",
  "Does anything make it better or worse?",
];

const Simulation = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "patient",
      content: "Namaste Doctor. I have been experiencing severe headaches for the past 2 days.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(12 * 60); // 12 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "student",
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput("");

    // Simulate VP response - replace with actual edge function call
    setTimeout(() => {
      const vpResponse: Message = {
        role: "patient",
        content: "The pain is mostly on the right side, throbbing in nature. It gets worse with bright lights.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, vpResponse]);
    }, 800);
  };

  const handleQuickAction = (actionId: string) => {
    toast({
      title: "Action logged",
      description: `${actionId} has been recorded`,
    });
    
    // Add system message for the action
    const actionMessage: Message = {
      role: "student",
      content: `[Action: ${actionId}]`,
      timestamp: new Date(),
    };
    setMessages([...messages, actionMessage]);

    // Simulate VP response with relevant data
    setTimeout(() => {
      let response = "";
      switch (actionId) {
        case "nadi":
          response = "Nadi Pariksha reveals: Vata-predominant pulse, rapid and irregular (approximately 88 bpm).";
          break;
        case "exam":
          response = "Patient appears distressed, photophobic. No obvious neurological deficits on examination.";
          break;
        case "labs":
          response = "CBC ordered. Results available: WBC 7,500, Hb 12.8, Platelet 250,000. Normal limits.";
          break;
        default:
          response = "Noted. What would you like to know more about?";
      }
      
      const vpResponse: Message = {
        role: "patient",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, vpResponse]);
    }, 1000);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Navigate to debrief after submission
    toast({
      title: "Simulation completed",
      description: "Calculating your score...",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/student">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-sm">Pittaja Jwara Assessment</h1>
            <p className="text-xs text-muted-foreground" lang="hi">ज्वर परीक्षण</p>
          </div>
        </div>
        <Badge variant="outline" className="rounded-full px-3">
          <Clock className="mr-1 h-3 w-3" />
          {formatTime(timeRemaining)}
        </Badge>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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

      {/* Quick Actions */}
      <div className="border-t bg-card px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="rounded-2xl whitespace-nowrap"
                onClick={() => handleQuickAction(action.id)}
              >
                <Icon className="mr-1 h-3 w-3" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t bg-accent/5">
          <p className="text-xs text-muted-foreground mb-2">Suggested:</p>
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
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your question..."
            className="rounded-2xl"
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="rounded-full bg-gradient-to-r from-primary to-[#7AA86E]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          variant="outline"
          className="w-full mt-2 rounded-2xl"
          size="sm"
        >
          Submit Assessment
        </Button>
      </div>
    </div>
  );
};

export default Simulation;
