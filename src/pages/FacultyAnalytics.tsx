import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";

const FacultyAnalytics = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopMicroHeader
        title="Analytics"
        subtitleHindi="विश्लेषण"
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Case Analytics
            </CardTitle>
            <CardDescription>
              View performance metrics for your cases
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-6">
              Analytics dashboard coming soon
            </p>
            <Button asChild className="rounded-xl">
              <Link to="/faculty">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacultyAnalytics;
