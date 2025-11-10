import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";

const StudentAssigned = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopMicroHeader
        title="Assigned Cases"
        subtitleHindi="आवंटित मामले"
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              Your Assigned Cases
            </CardTitle>
            <CardDescription>
              View and complete cases assigned by your faculty
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-6">
              No cases assigned yet. Check back later.
            </p>
            <Button asChild className="rounded-xl">
              <Link to="/student">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAssigned;
