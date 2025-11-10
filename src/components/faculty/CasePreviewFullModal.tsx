import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PrimaryCTA } from "@/components/ui/primary-cta";
import { SecondaryCTA } from "@/components/ui/secondary-cta";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Check, X, Edit, Save } from "lucide-react";
import { useState } from "react";

interface CasePreviewFullModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: any;
  onApprove: () => void;
  onEdit: () => void;
  onSaveDraft: () => void;
  isApproving?: boolean;
}

export const CasePreviewFullModal = ({
  isOpen,
  onClose,
  preview,
  onApprove,
  onEdit,
  onSaveDraft,
  isApproving = false,
}: CasePreviewFullModalProps) => {
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showJson, setShowJson] = useState(false);

  if (!preview) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] md:max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold text-foreground">
            Generated Case Preview
            <span className="block text-sm font-normal text-muted-foreground mt-1" lang="hi">
              केस पूर्वावलोकन
            </span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(95vh-200px)] md:h-[calc(90vh-200px)] px-6">
          <div className="space-y-6 py-4">
            {/* Human-Readable Summary */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Case Title</h3>
                <p className="text-base">{preview.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <Badge variant="outline" className="mt-1">{preview.subject}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <Badge variant="outline" className="mt-1">{preview.durationMinutes} minutes</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Patient Stem</h3>
                <p className="text-sm leading-relaxed bg-accent/20 p-4 rounded-lg">
                  {preview.patientStem}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Top Rubric Items</h3>
                <ul className="space-y-2">
                  {preview.topRubricItems?.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Competency Mapping</h3>
                <div className="flex flex-wrap gap-2">
                  {preview.competencyIds?.map((id: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{id}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Collapsible JSON Block */}
            <Collapsible open={showJson} onOpenChange={setShowJson}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full rounded-xl justify-between"
                >
                  <span>View Raw JSON</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showJson ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                    {JSON.stringify(preview.rawJson, null, 2)}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(preview.rawJson, null, 2));
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Review Checkbox */}
            <div className="flex items-center space-x-2 p-4 bg-accent/20 rounded-lg border border-border">
              <Checkbox
                id="reviewed"
                checked={hasReviewed}
                onCheckedChange={(checked) => setHasReviewed(checked as boolean)}
              />
              <Label
                htmlFor="reviewed"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                I have reviewed this case and confirm it meets quality standards
                <span className="block text-xs text-muted-foreground mt-1" lang="hi">
                  मैंने इस केस की समीक्षा की है
                </span>
              </Label>
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 px-6 py-4 border-t bg-card">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isApproving}
            className="rounded-xl"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <SecondaryCTA
            onClick={onSaveDraft}
            disabled={isApproving}
            size="sm"
            className="flex-1 md:flex-initial"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </SecondaryCTA>
          <SecondaryCTA
            onClick={onEdit}
            disabled={isApproving}
            size="sm"
            className="flex-1 md:flex-initial"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </SecondaryCTA>
          <PrimaryCTA
            onClick={onApprove}
            disabled={!hasReviewed || isApproving}
            size="sm"
            className="flex-1 md:flex-initial"
          >
            {isApproving ? (
              <>Approving...</>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Approve & Assign
              </>
            )}
          </PrimaryCTA>
        </div>
      </DialogContent>
    </Dialog>
  );
};
