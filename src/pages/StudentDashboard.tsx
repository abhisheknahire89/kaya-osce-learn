import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, BookOpen, Award, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import kayaLogo from "@/assets/kaya-logo.png";

const StudentDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={kayaLogo} alt="Kaya Logo" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Student Dashboard</h1>
              <p className="text-xs text-muted-foreground">Student Name • Roll: 2024001</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Profile</Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Overview */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-foreground">Your Progress</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Overall Completion</CardDescription>
                <CardTitle className="text-3xl">65%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={65} className="h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Average Score</CardDescription>
                <CardTitle className="text-3xl">82%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={82} className="h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Assessments Completed</CardDescription>
                <CardTitle className="text-3xl">12/18</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={(12/18) * 100} className="h-2" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Available Assessments */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-foreground">Available Assessments</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Virtual OSCE {i}</CardTitle>
                      <CardDescription>Ayurvedic Clinical Assessment</CardDescription>
                    </div>
                    <Badge>Available</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>Competency: Clinical Diagnosis</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="h-4 w-4" />
                      <span>Miller Level: Does (L4)</span>
                    </div>
                    <Button asChild className="w-full">
                      <Link to="/student/assessment">
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start Assessment
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Results */}
        <div>
          <h2 className="mb-4 text-2xl font-bold text-foreground">Recent Results</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Case 1: Chronic Pain", score: 85, status: "Pass" },
              { title: "Case 2: Digestive Issues", score: 78, status: "Pass" },
              { title: "Case 3: Respiratory", score: 92, status: "Pass" }
            ].map((result, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-base">{result.title}</CardTitle>
                  <CardDescription>Completed 2 days ago</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{result.score}%</p>
                      <Badge variant="outline" className="mt-1">{result.status}</Badge>
                    </div>
                    <TrendingUp className="h-8 w-8 text-success" />
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    View Feedback
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
