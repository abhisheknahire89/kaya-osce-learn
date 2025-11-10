import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Users, BarChart3, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import kayaLogo from "@/assets/kaya-logo.png";

const FacultyDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={kayaLogo} alt="Kaya Logo" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Faculty Dashboard</h1>
              <p className="text-xs text-muted-foreground">Dr. Faculty Name</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-foreground">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild className="h-24 flex-col gap-2">
              <Link to="/faculty/generate-case">
                <Plus className="h-6 w-6" />
                <span>Generate New Case</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>View All Cases</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>Manage Students</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-foreground">Overview</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Cases</CardDescription>
                <CardTitle className="text-3xl">24</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Active Assessments</CardDescription>
                <CardTitle className="text-3xl">8</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Students</CardDescription>
                <CardTitle className="text-3xl">156</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Avg. Score</CardDescription>
                <CardTitle className="text-3xl">78%</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Recent Cases */}
        <div>
          <h2 className="mb-4 text-2xl font-bold text-foreground">Recent Cases</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Case {i}: Chronic Back Pain</CardTitle>
                  <CardDescription>Competency: Clinical Diagnosis • Miller: Does</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">View</Button>
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="outline">Analytics</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
