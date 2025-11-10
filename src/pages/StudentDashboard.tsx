import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, BookOpen, Award, TrendingUp, Clock, Target, BookMarked } from "lucide-react";
import { Link } from "react-router-dom";
import { StudentHeader } from "@/components/student/StudentHeader";
import { StudentOnboarding } from "@/components/student/StudentOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [completedRuns, setCompletedRuns] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    completed: 0,
    averageScore: 0,
    completionRate: 0,
  });
  const [progressData, setProgressData] = useState<any[]>([]);
  const [competencyMap, setCompetencyMap] = useState<Record<string, { score: number; count: number }>>({});
  const [remediation, setRemediation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
      fetchDashboardData();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('metadata')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Check if student has selected a cohort
      const metadata = profile?.metadata as any;
      const hasCohort = metadata?.cohort_id;
      
      if (!hasCohort) {
        setNeedsOnboarding(true);
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch profile to get cohort
      const { data: profile } = await supabase
        .from("profiles")
        .select("metadata")
        .eq("id", user!.id)
        .single();

      const metadata = profile?.metadata as any;
      const cohortId = metadata?.cohort_id as string | undefined;

      if (cohortId) {
        // Fetch assignments for user's cohort
        const { data: assignmentsData, error: assignError } = await supabase
          .from("assignments")
          .select(`
            *,
            cases (
              id,
              title,
              subject,
              difficulty,
              clinical_json,
              cbdc_tags
            )
          `)
          .eq("cohort_id", cohortId)
          .order("start_at", { ascending: false });

        if (assignError) throw assignError;
        setAssignments(assignmentsData || []);

        // Fetch completed simulation runs
        const { data: runsData, error: runsError } = await supabase
          .from("simulation_runs")
          .select(`
            *,
            assignments (
              cases (
                title,
                subject,
                cbdc_tags
              )
            )
          `)
          .eq("student_id", user!.id)
          .eq("status", "scored")
          .order("created_at", { ascending: false });

        if (runsError) throw runsError;
        setCompletedRuns(runsData || []);

        // Calculate statistics
        const total = assignmentsData?.length || 0;
        const completed = runsData?.length || 0;
        const scores = runsData?.map(r => (r.score_json as any)?.percent || 0).filter(s => s > 0) || [];
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        setStats({
          totalAssigned: total,
          completed: completed,
          averageScore: Math.round(avgScore),
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
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

        // Build competency heatmap
        const compMap: Record<string, { score: number; count: number }> = {};
        runsData?.forEach(run => {
          const cbdcTags = run.assignments?.cases?.cbdc_tags as any;
          const sloIds = cbdcTags?.sloIds || [];
          const score = (run.score_json as any)?.percent || 0;
          sloIds.forEach((slo: string) => {
            if (!compMap[slo]) {
              compMap[slo] = { score: 0, count: 0 };
            }
            compMap[slo].score += score;
            compMap[slo].count += 1;
          });
        });
        setCompetencyMap(compMap);

        // Identify remediation topics (lowest performing SLOs)
        const remediationTopics = Object.entries(compMap)
          .map(([slo, data]) => ({
            slo,
            avgScore: Math.round(data.score / data.count),
            attempts: data.count,
          }))
          .filter(t => t.avgScore < 70)
          .sort((a, b) => a.avgScore - b.avgScore)
          .slice(0, 5);
        setRemediation(remediationTopics);
      }
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

  const getTimeRemaining = (endAt: string) => {
    const now = new Date();
    const end = new Date(endAt);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
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

      {/* Student Onboarding Modal */}
      {showOnboarding && needsOnboarding && (
        <StudentOnboarding
          isOpen={showOnboarding}
          userId={user?.id || ""}
          userName={user?.user_metadata?.name || "Student"}
        />
      )}

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
                <CardDescription>Assessments Completed</CardDescription>
                <CardTitle className="text-3xl">{stats.completed}/{stats.totalAssigned}</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={stats.completionRate} className="h-2" />
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-primary/20">
              <CardHeader className="pb-3">
                <CardDescription>Remediation Needed</CardDescription>
                <CardTitle className="text-3xl">{remediation.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Topics below 70%</p>
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
          {/* Assigned Cases */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h2 className="mb-4 text-xl font-bold text-foreground flex items-center gap-2">
              <Target className="h-5 w-5" />
              Assigned Cases
            </h2>
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : assignments.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No cases assigned yet</p>
                  </CardContent>
                </Card>
              ) : (
                assignments.map((assignment) => {
                  const caseData = assignment.cases;
                  return (
                    <Card key={assignment.id} className="rounded-2xl border-primary/10 hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{caseData?.title}</CardTitle>
                            <CardDescription className="mt-1">{caseData?.subject}</CardDescription>
                          </div>
                          <Badge variant="secondary" className="rounded-full">
                            {caseData?.difficulty}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Time remaining: {getTimeRemaining(assignment.end_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          <span>Duration: {assignment.time_limit} minutes</span>
                        </div>
                        <Button asChild className="w-full rounded-2xl bg-gradient-to-r from-primary to-[#7AA86E]">
                          <Link to={`/simulation/${assignment.id}`}>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Start Assessment
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
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
                  const caseTitle = run.assignments?.cases?.title || "Unknown Case";

                  return (
                    <Card key={run.id} className="rounded-2xl border-primary/10">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{caseTitle}</CardTitle>
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
          </div>
        </div>

        {/* Competency Coverage & Remediation */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Competency Heatmap */}
          <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Competency Coverage
                </CardTitle>
                <CardDescription>Strengths & weaknesses by NCISM SLO</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(competencyMap).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Complete assessments to see competency analysis
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(competencyMap).map(([slo, data]) => {
                      const avgScore = Math.round(data.score / data.count);
                      const color = avgScore >= 85 ? "bg-green-500" : avgScore >= 70 ? "bg-blue-500" : avgScore >= 50 ? "bg-yellow-500" : "bg-red-500";
                      return (
                        <div key={slo}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{slo}</span>
                            <span className="text-sm text-muted-foreground">{avgScore}%</span>
                          </div>
                          <div className="h-2 bg-accent rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${color} transition-all`}
                              style={{ width: `${avgScore}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Remediation Recommendations */}
          <div className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5" />
                  Remediation Recommendations
                </CardTitle>
                <CardDescription>Focus areas based on your performance</CardDescription>
              </CardHeader>
              <CardContent>
                {remediation.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Great job! No remediation needed.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {remediation.map((topic, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-sm font-semibold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{topic.slo}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Avg: {topic.avgScore}% • {topic.attempts} attempt{topic.attempts > 1 ? 's' : ''}
                          </p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="h-auto p-0 mt-1 text-xs"
                            asChild
                          >
                            <Link to="/student/remediation">
                              Practice MCQs →
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
