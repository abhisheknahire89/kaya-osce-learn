import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookMarked, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";

const StudentRemediation = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopMicroHeader
        title="MCQ Practice"
        subtitleHindi="प्रश्न अभ्यास"
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookMarked className="h-6 w-6 text-primary" />
              Remediation MCQs
            </CardTitle>
            <CardDescription>
              Practice questions based on your weak areas
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-6">
              Complete assessments to unlock personalized practice questions
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

export default StudentRemediation;
