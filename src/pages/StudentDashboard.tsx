import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, Award, TrendingUp, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { StudentHeader } from "@/components/student/StudentHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cases, setCases] = useState<any[]>([]);
  const [completedRuns, setCompletedRuns] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    completed: 0,
    averageScore: 0,
    completionRate: 0,
  });
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch assigned cases only
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select(`
          *,
          cases (*)
        `)
        .is("cohort_id", null)
        .order("created_at", { ascending: false });

      if (assignmentsError) throw assignmentsError;
      
      // Store assignments (not just cases)
      const assignmentsWithCases = assignmentsData || [];
      setCases(assignmentsWithCases);

      // Fetch completed simulation runs
      const { data: runsData, error: runsError } = await supabase
        .from("simulation_runs")
        .select("*")
        .eq("student_id", user!.id)
        .eq("status", "scored")
        .order("created_at", { ascending: false });

      if (runsError) throw runsError;
      setCompletedRuns(runsData || []);

      // Calculate statistics
      const totalCases = assignmentsWithCases?.length || 0;
      const completed = runsData?.length || 0;
      const scores = runsData?.map(r => (r.score_json as any)?.percent || 0).filter(s => s > 0) || [];
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      setStats({
        totalCases: totalCases,
        completed: completed,
        averageScore: Math.round(avgScore),
        completionRate: totalCases > 0 ? Math.round((completed / totalCases) * 100) : 0,
      });

      // Build progress over time data
      const progressByDate = runsData?.reduce((acc: any, run) => {
        const date = new Date(run.created_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, avgScore: 0, count: 0 };
        }
        acc[date].avgScore += (run.score_json as any)?.percent || 0;
        acc[date].count += 1;
        return acc;
      }, {});

      const progressArray = Object.values(progressByDate || {}).map((p: any) => ({
        date: p.date,
        score: Math.round(p.avgScore / p.count),
      }));
      setProgressData(progressArray);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Failed to load dashboard",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getGradeBadge = (percent: number) => {
    if (percent >= 85) return { label: "Distinction", variant: "default" as const };
    if (percent >= 70) return { label: "Pass", variant: "secondary" as const };
    if (percent >= 50) return { label: "Borderline", variant: "outline" as const };
    return { label: "Fail", variant: "destructive" as const };
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Progress Overview */}
        <div className="mb-8 animate-fade-in">
          <h2 className="mb-4 text-2xl font-bold text-foreground">
            Your Progress
            <span className="ml-2 text-sm text-muted-foreground" lang="hi">आपकी प्रगति</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="rounded-2xl border-primary/20">
              <CardHeader className="pb-3">
                <CardDescription>Overall Completion</CardDescription>
                <CardTitle className="text-3xl">{stats.completionRate}%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={stats.completionRate} className="h-2" />
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-primary/20">
              <CardHeader className="pb-3">
                <CardDescription>Average Score</CardDescription>
                <CardTitle className="text-3xl">{stats.averageScore}%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={stats.averageScore} className="h-2" />
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-primary/20">
              <CardHeader className="pb-3">
                <CardDescription>Cases Completed</CardDescription>
                <CardTitle className="text-3xl">{stats.completed}/{stats.totalCases}</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={stats.completionRate} className="h-2" />
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-primary/20">
              <CardHeader className="pb-3">
                <CardDescription>Available Cases</CardDescription>
                <CardTitle className="text-3xl">{stats.totalCases}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">All approved cases</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Progress Over Time Chart */}
        {progressData.length > 0 && (
          <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Trend
                </CardTitle>
                <CardDescription>Your scores over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Available Cases */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h2 className="mb-4 text-xl font-bold text-foreground flex items-center gap-2">
              <Target className="h-5 w-5" />
              Available Cases
            </h2>
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : cases.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No cases available yet</p>
                  </CardContent>
                </Card>
              ) : (
                cases.slice(0, 10).map((assignment: any) => {
                  const caseItem = assignment.cases;
                  if (!caseItem) return null;
                  
                  return (
                    <Card key={assignment.id} className="rounded-2xl border-primary/10 hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{caseItem.title}</CardTitle>
                            <CardDescription className="mt-1">{caseItem.subject}</CardDescription>
                          </div>
                          <Badge variant="secondary" className="rounded-full">
                            {caseItem.difficulty || "Medium"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          asChild
                          size="sm"
                          className="w-full rounded-xl"
                        >
                          <Link to={`/simulation/${assignment.id}`}>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Start Case
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
            {cases.length > 10 && (
              <Button asChild variant="outline" className="w-full mt-4 rounded-xl">
                <Link to="/student/assigned">View All Cases</Link>
              </Button>
            )}
          </div>

          {/* Completed Assessments */}
          <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h2 className="mb-4 text-xl font-bold text-foreground flex items-center gap-2">
              <Award className="h-5 w-5" />
              Completed Assessments
            </h2>
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : completedRuns.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No completed assessments yet</p>
                  </CardContent>
                </Card>
              ) : (
                completedRuns.slice(0, 5).map((run) => {
                  const scoreJson = run.score_json as any;
                  const percent = scoreJson?.percent || 0;
                  const grade = getGradeBadge(percent);

                  return (
                    <Card key={run.id} className="rounded-2xl border-primary/10">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">Case Assessment</CardTitle>
                            <CardDescription>
                              {new Date(run.created_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <Badge variant={grade.variant} className="rounded-full">
                            {grade.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-2xl font-bold">{percent}%</p>
                            <p className="text-xs text-muted-foreground">
                              {scoreJson?.score || 0}/{scoreJson?.maxScore || 0} points
                            </p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-primary" />
                        </div>
                        <Button 
                          asChild 
                          variant="outline" 
                          size="sm" 
                          className="w-full rounded-xl"
                        >
                          <Link to={`/debrief/${run.id}`}>
                            View Debrief
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
            {completedRuns.length > 5 && (
              <Button asChild variant="outline" className="w-full mt-4 rounded-xl">
                <Link to="/student/progress">View All Completed</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
