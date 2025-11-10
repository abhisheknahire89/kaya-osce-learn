import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Check, X, ChevronDown, Code2, Calendar } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
interface CasePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: any;
  previewText?: string;
  onApproveSuccess?: (caseId: string) => void;
  isApproving?: boolean;
  userId?: string;
  viewOnly?: boolean;
}
export const CasePreviewModal = ({
  isOpen,
  onClose,
  caseData,
  previewText,
  onApproveSuccess,
  isApproving = false,
  userId,
  viewOnly = false
}: CasePreviewModalProps) => {
  const { toast } = useToast();
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvedCaseId, setApprovedCaseId] = useState<string | null>(null);
  const [deadline, setDeadline] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [localIsApproving, setLocalIsApproving] = useState(false);

  const handleApprove = async () => {
    if (!caseData || !userId) return;

    setLocalIsApproving(true);

    try {
      const { data, error } = await supabase.functions.invoke("approve_case", {
        body: {
          case_id: caseData.id,
          clinical_json: caseData,
          faculty_id: userId,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setApprovedCaseId(data.case_id);
      setIsApproved(true);
      
      toast({
        title: "Case approved successfully",
        description: "Now set a deadline and assign to students",
      });
    } catch (error: any) {
      console.error("Error approving case:", error);
      toast({
        title: "Approval failed",
        description: error.message || "Failed to approve case. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLocalIsApproving(false);
    }
  };

  const handleAssign = async () => {
    if (!deadline) {
      toast({
        title: "Deadline required",
        description: "Please set a deadline for this assignment",
        variant: "destructive",
      });
      return;
    }

    if (!approvedCaseId) return;

    setIsAssigning(true);

    try {
      const { data, error } = await supabase.functions.invoke("assign_case", {
        body: {
          case_id: approvedCaseId,
          deadline_at: new Date(deadline).toISOString(),
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Case assigned successfully",
        description: "Students can now access this case",
      });

      onApproveSuccess(approvedCaseId);
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

  if (!caseData) return null;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Generated Case — Preview
            <span className="block text-sm font-normal text-muted-foreground mt-1" lang="hi">
              अनुमोदन पूर्वावलोकन
            </span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[65vh] pr-4">
          <div className="space-y-4">
            {/* Review Confirmation - only show if not view only */}
            {!viewOnly && (
              <>
                <div className="flex items-center space-x-2 bg-accent/20 p-3 rounded-lg sticky top-0 z-10 backdrop-blur-sm">
                  <Checkbox id="review-confirm" checked={hasReviewed} onCheckedChange={checked => setHasReviewed(checked as boolean)} className="min-h-[44px] min-w-[44px]" />
                  <Label htmlFor="review-confirm" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    I have reviewed this case and confirm it is ready for approval
                  </Label>
                </div>

                {/* Deadline Input - show during review if not yet approved */}
                {!isApproved && (
                  <Card className="border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Set Assignment Deadline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
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
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            {/* Case Title and Metadata Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Title</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{caseData?.title}</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Subject</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-base">{caseData?.subject}</Badge>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{caseData?.durationMinutes} minutes</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Difficulty</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">{caseData?.difficulty || "Medium"}</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Patient Information Tile */}
            <Card className="border-secondary/30">
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{caseData?.patient?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{caseData?.patient?.age} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">{caseData?.patient?.gender}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clinical Stem Tile */}
            <Card className="border-accent/30">
              <CardHeader>
                <CardTitle>Clinical Presentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{caseData?.stem}</p>
              </CardContent>
            </Card>

            {/* Vitals Tile */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Vital Signs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(caseData?.vitals || {}).map(([key, value]) => <div key={key} className="bg-accent/10 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="font-semibold mt-1">{String(value)}</p>
                    </div>)}
                </div>
              </CardContent>
            </Card>

            {/* Competencies Tile */}
            {caseData?.sloIds && <Card className="border-secondary/30">
                <CardHeader>
                  <CardTitle>Learning Objectives (SLOs)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {caseData.sloIds.map((slo: string) => <Badge key={slo} variant="secondary" className="text-xs">{slo}</Badge>)}
                  </div>
                </CardContent>
              </Card>}

            {/* Raw JSON Toggle */}
            <Collapsible open={showRawJson} onOpenChange={setShowRawJson}>
              <CollapsibleTrigger asChild>
                
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Card>
                  <CardContent className="pt-4">
                    <ScrollArea className="h-[300px]">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {JSON.stringify(caseData, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* Detailed Case Information (shown when no preview text) */}
            {!previewText && <>
                {/* Case Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Case Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Subject</p>
                        <p className="font-medium">{caseData.subject}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">{caseData.durationMinutes} minutes</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Miller Level</p>
                        <Badge variant="outline">{caseData.millerLevel}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bloom Domain</p>
                        <Badge variant="outline">{caseData.bloomDomain}</Badge>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">SLO IDs</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {caseData.sloIds?.map((slo: string) => <Badge key={slo} variant="secondary">{slo}</Badge>)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Patient Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Patient Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{caseData.patient?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Age</p>
                        <p className="font-medium">{caseData.patient?.age} years</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <p className="font-medium">{caseData.patient?.gender}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Clinical Stem */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Clinical Stem</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{caseData.stem}</p>
                  </CardContent>
                </Card>

                {/* Vitals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vital Signs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(caseData.vitals || {}).map(([key, value]) => <div key={key}>
                          <p className="text-sm text-muted-foreground capitalize">
                            {key.replace(/_/g, " ")}
                          </p>
                          <p className="font-medium">{String(value)}</p>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>

                {/* Script Information */}
                {caseData.script && <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Virtual Patient Script</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {caseData.script.history && <div>
                          <h4 className="font-semibold mb-2">History Responses</h4>
                          <div className="space-y-2">
                            {Object.entries(caseData.script.history).slice(0, 3).map(([key, value]) => <div key={key} className="text-sm">
                                <p className="text-muted-foreground italic">"{key}"</p>
                                <p className="ml-4">{String(value)}</p>
                              </div>)}
                            {Object.keys(caseData.script.history).length > 3 && <p className="text-xs text-muted-foreground">
                                + {Object.keys(caseData.script.history).length - 3} more responses...
                              </p>}
                          </div>
                        </div>}
                    </CardContent>
                  </Card>}

                {/* Rubric */}
                {caseData.rubric && caseData.rubric.length > 0 && <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Assessment Rubric</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {caseData.rubric.map((section: any, idx: number) => <div key={idx}>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">{section.section}</h4>
                            <Badge>Max: {section.max} points</Badge>
                          </div>
                          <div className="space-y-1 ml-4">
                            {section.items?.map((item: any, itemIdx: number) => <div key={itemIdx} className="text-sm flex items-start gap-2">
                                <span className="text-muted-foreground">•</span>
                                <div className="flex-1">
                                  <span>{item.text}</span>
                                  <span className="text-muted-foreground ml-2">
                                    ({item.weight} pts)
                                  </span>
                                </div>
                              </div>)}
                          </div>
                          {idx < caseData.rubric.length - 1 && <Separator className="mt-3" />}
                        </div>)}
                    </CardContent>
                  </Card>}

                {/* MCQs */}
                {caseData.mcqs && caseData.mcqs.length > 0 && <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">MCQ Questions ({caseData.mcqs.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {caseData.mcqs.map((mcq: any, idx: number) => <div key={idx} className="space-y-2">
                          <p className="font-medium">
                            {idx + 1}. {mcq.stem}
                          </p>
                          <div className="ml-4 space-y-1">
                            {mcq.choices?.map((choice: string, choiceIdx: number) => <div key={choiceIdx} className={`text-sm flex items-center gap-2 ${choiceIdx === mcq.correctIndex ? "text-green-600 font-medium" : ""}`}>
                                <span>
                                  {String.fromCharCode(65 + choiceIdx)}. {choice}
                                </span>
                                {choiceIdx === mcq.correctIndex && <Check className="h-4 w-4" />}
                              </div>)}
                          </div>
                          <p className="text-sm text-muted-foreground ml-4">
                            <span className="font-medium">Rationale:</span> {mcq.rationale}
                          </p>
                          {idx < caseData.mcqs.length - 1 && <Separator className="mt-3" />}
                        </div>)}
                    </CardContent>
                  </Card>}
              </>}
          </div>
        </ScrollArea>

        {/* Action Buttons or Assignment Section */}
        <div className="pt-4 border-t space-y-4">
          {viewOnly ? (
            <Button onClick={onClose} className="w-full rounded-xl">
              Close
            </Button>
          ) : !isApproved ? (
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={localIsApproving} className="flex-1 rounded-xl">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              
              <Button 
                onClick={handleApprove} 
                disabled={!hasReviewed || localIsApproving || !deadline} 
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-[#7AA86E] text-white"
              >
                {localIsApproving ? "Approving..." : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Approve & Assign
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isAssigning} className="flex-1 rounded-xl">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              
              <Button 
                onClick={handleAssign} 
                disabled={isAssigning} 
                className="flex-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F4E5A1] text-foreground"
              >
                {isAssigning ? "Assigning..." : "Assign to Students"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>;
};