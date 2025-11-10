import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowLeft, Eye, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import kayaLogo from "@/assets/kaya-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CasePreviewModal } from "@/components/faculty/CasePreviewModal";
import { LoadingWithFacts } from "@/components/faculty/LoadingWithFacts";
import { AssignmentModal } from "@/components/faculty/AssignmentModal";

const SUBJECTS = [
  "Kayachikitsa",
  "Kaumarbhritya",
  "Shalya Tantra",
  "Shalakya Tantra",
  "Panchakarma",
  "Rasashastra",
  "Dravyaguna",
  "Swasthavritta",
];

const MILLER_LEVELS = [
  { value: "Knows", label: "Knows (L1)" },
  { value: "KnowsHow", label: "Knows How (L2)" },
  { value: "ShowsHow", label: "Shows How (L3)" },
  { value: "Does", label: "Does (L4)" },
];

const BLOOM_DOMAINS = [
  "Cognitive",
  "Affective",
  "Psychomotor",
  "Cognitive/Affective",
];

const DOSHAS = ["Vata", "Pitta", "Kapha"];

const GenerateCase = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [sloIds, setSloIds] = useState("");
  const [millerLevel, setMillerLevel] = useState("");
  const [bloomDomain, setBloomDomain] = useState("");
  const [difficulty, setDifficulty] = useState([50]);
  const [duration, setDuration] = useState([12]);
  const [selectedDoshas, setSelectedDoshas] = useState<string[]>([]);
  const [specialModality, setSpecialModality] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCase, setGeneratedCase] = useState<any>(null);
  const [previewText, setPreviewText] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvedCaseId, setApprovedCaseId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deadline, setDeadline] = useState("");

  const handleGenerate = async () => {
    if (!subject || !sloIds || !millerLevel || !bloomDomain) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate cases",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Parse SLO IDs from comma-separated string
      const sloIdArray = sloIds.split(",").map(s => s.trim()).filter(s => s);
      
      // Determine difficulty level
      const difficultyLevel = difficulty[0] < 33 ? "Easy" : difficulty[0] < 67 ? "Medium" : "Hard";
      
      // Prepare payload
      const payload = {
        subject,
        sloIds: sloIdArray,
        millerLevel,
        bloomDomain,
        difficulty: difficultyLevel,
        durationMinutes: duration[0],
        faculty_id: user.id,
        ayurvedicContext: {
          doshaFocus: selectedDoshas.length > 0 ? selectedDoshas : undefined,
          specialModality: specialModality || undefined,
        },
      };

      console.log("Calling generate_case with payload:", payload);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke("generate_case", {
        body: payload,
      });

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (data.error) {
        // Handle specific error types
        if (data.error === 'AI_KEY_NOT_CONFIGURED') {
          toast({
            title: "Veda AI Not Configured",
            description: data.message || "Please contact support for assistance.",
            variant: "destructive",
          });
        } else if (data.error === 'AI_GENERATION_ERROR') {
          toast({
            title: "Generation Error",
            description: data.message || "Veda AI encountered an error. Please try again.",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      if (!data.success || !data.case) {
        throw new Error("Failed to generate case");
      }

      setGeneratedCase(data.case);
      setPreviewText(data.previewText || "");
      setShowPreview(true); // Auto-open preview modal
      toast({
        title: "Case generated successfully",
        description: "Review and approve to publish",
      });
    } catch (error: any) {
      console.error("Error generating case:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate case. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!generatedCase || !user) return;

    setIsApproving(true);

    try {
      // Call approve_case edge function
      const { data, error } = await supabase.functions.invoke("approve_case", {
        body: {
          case_id: generatedCase.id,
          clinical_json: generatedCase,
          faculty_id: user.id,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setApprovedCaseId(data.case_id);
      
      toast({
        title: "Case approved successfully",
        description: "Now assign it to students",
      });

      // Close preview and open assign modal
      setShowPreview(false);
      setShowAssignModal(true);
    } catch (error: any) {
      console.error("Error approving case:", error);
      toast({
        title: "Approval failed",
        description: error.message || "Failed to approve case. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleAssignComplete = () => {
    setShowAssignModal(false);
    setGeneratedCase(null);
    setApprovedCaseId(null);
    setDeadline("");
    navigate("/faculty");
  };

  const getDifficultyLabel = () => {
    if (difficulty[0] < 33) return "Easy";
    if (difficulty[0] < 67) return "Medium";
    return "Hard";
  };

  return (
    <>
      {/* Loading Overlay */}
      {isGenerating && <LoadingWithFacts />}
      
      <div className="min-h-screen bg-background w-full overflow-x-hidden">
        <header className="border-b bg-card sticky top-0 z-50 w-full" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center justify-between px-4 py-4 max-w-full">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Link to="/faculty" className="flex-shrink-0">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <img src={kayaLogo} alt="Kaya Logo" className="h-10 w-auto flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-foreground truncate">Generate OSCE Case</h1>
                <p className="text-xs text-muted-foreground truncate" lang="hi">केस निर्माण</p>
              </div>
            </div>
          </div>
        </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="rounded-2xl border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Powered Case Generation
            </CardTitle>
            <CardDescription>
              Configure parameters to generate NCISM CBDC-aligned virtual OSCE cases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subject Selection */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SLO IDs */}
            <div className="space-y-2">
              <Label htmlFor="sloIds">SLO IDs * <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
              <Input
                id="sloIds"
                placeholder="e.g., SLO-KAY-JW-01, SLO-KAY-DH-02"
                value={sloIds}
                onChange={(e) => setSloIds(e.target.value)}
              />
            </div>

            {/* Miller Level */}
            <div className="space-y-2">
              <Label htmlFor="miller">Miller Level *</Label>
              <Select value={millerLevel} onValueChange={setMillerLevel}>
                <SelectTrigger id="miller">
                  <SelectValue placeholder="Select Miller level" />
                </SelectTrigger>
                <SelectContent>
                  {MILLER_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bloom Domain */}
            <div className="space-y-2">
              <Label htmlFor="bloom">Bloom Domain *</Label>
              <Select value={bloomDomain} onValueChange={setBloomDomain}>
                <SelectTrigger id="bloom">
                  <SelectValue placeholder="Select Bloom domain" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOM_DOMAINS.map((domain) => (
                    <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Slider */}
            <div className="space-y-2">
              <Label>Difficulty: {getDifficultyLabel()}</Label>
              <Slider
                value={difficulty}
                onValueChange={setDifficulty}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration: {duration[0]} minutes</Label>
              <Slider
                value={duration}
                onValueChange={setDuration}
                min={5}
                max={30}
                step={1}
                className="w-full"
              />
            </div>

            {/* Ayurvedic Context */}
            <div className="space-y-4 rounded-xl bg-accent/10 p-4">
              <h3 className="font-medium text-sm" lang="hi">आयुर्वेदिक संदर्भ (Ayurvedic Context)</h3>
              
              <div className="space-y-2">
                <Label>Dosha Focus (optional)</Label>
                <div className="flex gap-4">
                  {DOSHAS.map((dosha) => (
                    <div key={dosha} className="flex items-center space-x-2">
                      <Checkbox
                        id={dosha}
                        checked={selectedDoshas.includes(dosha)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDoshas([...selectedDoshas, dosha]);
                          } else {
                            setSelectedDoshas(selectedDoshas.filter((d) => d !== dosha));
                          }
                        }}
                      />
                      <Label htmlFor={dosha} className="cursor-pointer">{dosha}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modality">Special Modality (optional)</Label>
                <Input
                  id="modality"
                  placeholder="e.g., Nadi Pariksha, Rasashastra, Panchakarma"
                  value={specialModality}
                  onChange={(e) => setSpecialModality(e.target.value)}
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full rounded-2xl bg-gradient-to-r from-primary to-[#7AA86E] text-white"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                  Generating case with Veda AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Case
                </>
              )}
            </Button>

            {/* Note about assignment */}
            <p className="text-xs text-center text-muted-foreground">
              After generation, you'll review and assign the case to students with a deadline
            </p>

            {/* Preview Generated Case */}
            {generatedCase && (
              <Card className="rounded-xl border-secondary bg-accent/5">
                <CardHeader>
                  <CardTitle className="text-lg">Case Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Title</p>
                    <p className="font-medium">{generatedCase.title}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-2xl"
                      size="sm"
                      onClick={() => setShowPreview(true)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Full Preview
                    </Button>
                    <Button
                      className="flex-1 rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      size="sm"
                      onClick={handleApprove}
                      disabled={isApproving}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {isApproving ? "Approving..." : "Approve & Publish"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      <CasePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        caseData={generatedCase}
        previewText={previewText}
        onApprove={handleApprove}
        isApproving={isApproving}
        showAssignButton={false}
      />

      {/* Assignment Modal */}
      {showAssignModal && approvedCaseId && (
        <AssignmentModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          caseId={approvedCaseId}
          onSuccess={handleAssignComplete}
        />
      )}
      </div>
    </>
  );
};

export default GenerateCase;
