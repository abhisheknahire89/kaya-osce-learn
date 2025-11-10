import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, Award, Loader2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/faculty/DashboardHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { COHORTS } from "@/constants/cohorts";

const AdminAnalytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const cohorts = COHORTS;
  const [selectedCohort, setSelectedCohort] = useState<string>('all');
  const [analytics, setAnalytics] = useState({
    performanceBySubject: [] as any[],
    scoreDistribution: [] as any[],
    engagementTrend: [] as any[],
    topPerformers: [] as any[],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [period, selectedCohort]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch simulation runs
      const { data: runs, error: runsError } = await supabase
        .from("simulation_runs")
        .select("id, student_id, score_json, created_at, status, assignment_id")
        .eq("status", "scored")
        .gte("created_at", startDate.toISOString());

      if (runsError) throw runsError;

      // Fetch student profiles
      const studentIds = [...new Set(runs?.map(r => r.student_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, metadata")
        .in("id", studentIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch assignments to get case info
      const assignmentIds = [...new Set(runs?.map(r => r.assignment_id).filter(Boolean) || [])];
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, case_id")
        .in("id", assignmentIds);

      const assignmentMap = new Map(assignments?.map(a => [a.id, a]) || []);

      // Fetch cases to get subject
      const caseIds = [...new Set(assignments?.map(a => a.case_id).filter(Boolean) || [])];
      const { data: cases } = await supabase
        .from("cases")
        .select("id, subject")
        .in("id", caseIds);

      const caseMap = new Map(cases?.map(c => [c.id, c]) || []);

      // Filter by cohort if selected
      let filteredRuns = runs || [];
      if (selectedCohort !== 'all') {
        filteredRuns = filteredRuns.filter(run => {
          const profile = profileMap.get(run.student_id);
          const metadata = profile?.metadata as { cohort_id?: string } | null;
          return metadata?.cohort_id === selectedCohort;
        });
      }

      // Process performance by subject
      const subjectScores: Record<string, { total: number; count: number }> = {};
      filteredRuns.forEach(run => {
        const assignment = assignmentMap.get(run.assignment_id);
        if (assignment) {
          const caseData = caseMap.get(assignment.case_id);
          if (caseData?.subject) {
            const score = (run.score_json as any)?.percent || 0;
            if (!subjectScores[caseData.subject]) {
              subjectScores[caseData.subject] = { total: 0, count: 0 };
            }
            subjectScores[caseData.subject].total += score;
            subjectScores[caseData.subject].count += 1;
          }
        }
      });

      const performanceBySubject = Object.entries(subjectScores).map(([subject, data]) => ({
        subject,
        avgScore: Math.round(data.total / data.count),
        assessments: data.count,
      }));

      // Process score distribution
      const scoreRanges = [
        { range: '0-49%', min: 0, max: 49, count: 0 },
        { range: '50-69%', min: 50, max: 69, count: 0 },
        { range: '70-84%', min: 70, max: 84, count: 0 },
        { range: '85-100%', min: 85, max: 100, count: 0 },
      ];

      filteredRuns.forEach(run => {
        const score = (run.score_json as any)?.percent || 0;
        const range = scoreRanges.find(r => score >= r.min && score <= r.max);
        if (range) range.count++;
      });

      const scoreDistribution = scoreRanges.map(r => ({
        name: r.range,
        value: r.count,
      }));

      // Process engagement trend
      const dailyData: Record<string, number> = {};
      filteredRuns.forEach(run => {
        const date = new Date(run.created_at).toLocaleDateString();
        dailyData[date] = (dailyData[date] || 0) + 1;
      });

      const engagementTrend = Object.entries(dailyData)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .slice(-14)
        .map(([date, count]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          assessments: count,
        }));

      // Process top performers
      const studentPerformance: Record<string, { total: number; count: number; name: string }> = {};
      filteredRuns.forEach(run => {
        const profile = profileMap.get(run.student_id);
        if (profile) {
          const score = (run.score_json as any)?.percent || 0;
          if (!studentPerformance[run.student_id]) {
            studentPerformance[run.student_id] = { total: 0, count: 0, name: profile.name };
          }
          studentPerformance[run.student_id].total += score;
          studentPerformance[run.student_id].count += 1;
        }
      });

      const topPerformers = Object.entries(studentPerformance)
        .map(([id, data]) => ({
          id,
          name: data.name,
          avgScore: Math.round(data.total / data.count),
          assessments: data.count,
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

      setAnalytics({
        performanceBySubject,
        scoreDistribution,
        engagementTrend,
        topPerformers,
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Failed to load analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--secondary))', 'hsl(var(--primary))'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Admin — Analytics
            <span className="text-base font-normal text-muted-foreground ml-2" lang="hi">
              विश्लेषण
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive performance analytics and insights
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[200px] rounded-xl">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCohort} onValueChange={setSelectedCohort}>
            <SelectTrigger className="w-[200px] rounded-xl">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All cohorts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cohorts</SelectItem>
              {cohorts.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-6">
          {/* Performance by Subject */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Performance by Subject</CardTitle>
              <CardDescription>Average scores across different subjects</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.performanceBySubject.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.performanceBySubject}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Score Distribution */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>Distribution of student scores</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.scoreDistribution.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.scoreDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Engagement Trend */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Engagement Trend</CardTitle>
                <CardDescription>Assessments completed over time</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.engagementTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.engagementTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="assessments"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Top Performers
              </CardTitle>
              <CardDescription>Students with highest average scores</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topPerformers.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topPerformers.map((student, idx) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-4 p-4 bg-accent/5 rounded-xl"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.assessments} assessment{student.assessments > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{student.avgScore}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
