import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";

const StudentProgress = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopMicroHeader
        title="My Progress"
        subtitleHindi="मेरी प्रगति"
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Performance Analytics
            </CardTitle>
            <CardDescription>
              Track your OSCE performance over time
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-6">
              Complete assessments to see your progress analytics
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

export default StudentProgress;
