import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Check, X, ChevronDown, Code2 } from "lucide-react";
import { useState } from "react";

interface CasePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: any;
  previewText?: string;
  onApprove: () => void;
  onAssign?: () => void;
  isApproving?: boolean;
  showAssignButton?: boolean;
}

export const CasePreviewModal = ({
  isOpen,
  onClose,
  caseData,
  previewText,
  onApprove,
  onAssign,
  isApproving = false,
  showAssignButton = false,
}: CasePreviewModalProps) => {
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  if (!caseData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          <div className="space-y-6">
            {/* Human-Readable Overview */}
            {previewText && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Case Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                    {previewText}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Raw JSON Toggle */}
            <Collapsible open={showRawJson} onOpenChange={setShowRawJson}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full rounded-xl">
                  <Code2 className="mr-2 h-4 w-4" />
                  {showRawJson ? "Hide" : "View"} Raw JSON
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showRawJson ? "rotate-180" : ""}`} />
                </Button>
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
            {!previewText && (
              <>
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
                        {caseData.sloIds?.map((slo: string) => (
                          <Badge key={slo} variant="secondary">{slo}</Badge>
                        ))}
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
                      {Object.entries(caseData.vitals || {}).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-sm text-muted-foreground capitalize">
                            {key.replace(/_/g, " ")}
                          </p>
                          <p className="font-medium">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Script Information */}
                {caseData.script && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Virtual Patient Script</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {caseData.script.history && (
                        <div>
                          <h4 className="font-semibold mb-2">History Responses</h4>
                          <div className="space-y-2">
                            {Object.entries(caseData.script.history).slice(0, 3).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <p className="text-muted-foreground italic">"{key}"</p>
                                <p className="ml-4">{String(value)}</p>
                              </div>
                            ))}
                            {Object.keys(caseData.script.history).length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                + {Object.keys(caseData.script.history).length - 3} more responses...
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Rubric */}
                {caseData.rubric && caseData.rubric.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Assessment Rubric</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {caseData.rubric.map((section: any, idx: number) => (
                        <div key={idx}>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">{section.section}</h4>
                            <Badge>Max: {section.max} points</Badge>
                          </div>
                          <div className="space-y-1 ml-4">
                            {section.items?.map((item: any, itemIdx: number) => (
                              <div key={itemIdx} className="text-sm flex items-start gap-2">
                                <span className="text-muted-foreground">•</span>
                                <div className="flex-1">
                                  <span>{item.text}</span>
                                  <span className="text-muted-foreground ml-2">
                                    ({item.weight} pts)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {idx < caseData.rubric.length - 1 && <Separator className="mt-3" />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* MCQs */}
                {caseData.mcqs && caseData.mcqs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">MCQ Questions ({caseData.mcqs.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {caseData.mcqs.map((mcq: any, idx: number) => (
                        <div key={idx} className="space-y-2">
                          <p className="font-medium">
                            {idx + 1}. {mcq.stem}
                          </p>
                          <div className="ml-4 space-y-1">
                            {mcq.choices?.map((choice: string, choiceIdx: number) => (
                              <div
                                key={choiceIdx}
                                className={`text-sm flex items-center gap-2 ${
                                  choiceIdx === mcq.correctIndex
                                    ? "text-green-600 font-medium"
                                    : ""
                                }`}
                              >
                                <span>
                                  {String.fromCharCode(65 + choiceIdx)}. {choice}
                                </span>
                                {choiceIdx === mcq.correctIndex && (
                                  <Check className="h-4 w-4" />
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground ml-4">
                            <span className="font-medium">Rationale:</span> {mcq.rationale}
                          </p>
                          {idx < caseData.mcqs.length - 1 && <Separator className="mt-3" />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Review Confirmation & Action Buttons */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center space-x-2 bg-accent/20 p-3 rounded-lg">
            <Checkbox
              id="review-confirm"
              checked={hasReviewed}
              onCheckedChange={(checked) => setHasReviewed(checked as boolean)}
              className="min-h-[44px] min-w-[44px]"
            />
            <Label
              htmlFor="review-confirm"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have reviewed this case and confirm it is ready for approval
            </Label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isApproving}
              className="flex-1 rounded-xl"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            
            {!showAssignButton ? (
              <Button
                onClick={onApprove}
                disabled={!hasReviewed || isApproving}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-[#7AA86E] text-white"
              >
                {isApproving ? (
                  <>Approving...</>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={onAssign}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F4E5A1] text-foreground"
              >
                Assign to Cohort
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
