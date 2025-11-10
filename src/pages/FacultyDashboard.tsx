import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardHeader } from "@/components/faculty/DashboardHeader";

const FacultyDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8 animate-fade-in">
          <h2 className="mb-4 text-2xl font-bold text-foreground">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild className="h-24 flex-col gap-2 rounded-2xl bg-gradient-to-r from-primary to-[#7AA86E] hover-scale">
              <Link to="/faculty/generate-case">
                <Plus className="h-6 w-6" />
                <span>Generate New Case</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl hover-scale">
              <FileText className="h-6 w-6" />
              <span>View All Cases</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl hover-scale">
              <Users className="h-6 w-6" />
              <span>Manage Students</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl hover-scale">
              <BarChart3 className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h2 className="mb-4 text-2xl font-bold text-foreground">
            Overview
            <span className="ml-2 text-sm text-muted-foreground" lang="hi">अवलोकन</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-primary/20 hover-scale">
              <CardHeader className="pb-3">
                <CardDescription>Active Cases</CardDescription>
                <CardTitle className="text-3xl">24</CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl border-primary/20 hover-scale">
              <CardHeader className="pb-3">
                <CardDescription>Pending Approvals</CardDescription>
                <CardTitle className="text-3xl">3</CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl border-primary/20 hover-scale">
              <CardHeader className="pb-3">
                <CardDescription>Students</CardDescription>
                <CardTitle className="text-3xl">156</CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl border-primary/20 hover-scale">
              <CardHeader className="pb-3">
                <CardDescription>Avg. Score</CardDescription>
                <CardTitle className="text-3xl">78%</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Recent Cases */}
        <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h2 className="mb-4 text-2xl font-bold text-foreground">Recent Cases</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="hover:shadow-md transition-shadow rounded-2xl border-primary/10">
                <CardHeader>
                  <CardTitle className="text-lg">Case {i}: Pittaja Jwara</CardTitle>
                  <CardDescription>Competency: Clinical Diagnosis • Miller: ShowsHow</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-xl">View</Button>
                    <Button size="sm" variant="outline" className="rounded-xl">Edit</Button>
                    <Button size="sm" variant="outline" className="rounded-xl">Analytics</Button>
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
