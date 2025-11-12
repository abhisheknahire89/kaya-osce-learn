import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Users, Award, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/faculty/DashboardHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
const AdminDashboard = () => {
  const {
    toast
  } = useToast();
  const [dailyLeaderboard, setDailyLeaderboard] = useState<any[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeAssessments: 0,
    avgScore: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchAdminData();
  }, []);
  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('You must be logged in to view this data');
      }

      console.log('Fetching admin dashboard data...');

      // Fetch all profiles to get total students count
      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name");
      
      if (profilesError) {
        console.error('Profiles error:', profilesError);
        throw profilesError;
      }

      console.log('Fetched profiles:', allProfiles?.length);

      // Fetch all completed simulation runs with scores
      const { data: allRuns, error: runsError } = await supabase
        .from("simulation_runs")
        .select("id, student_id, score_json, end_at")
        .eq("status", "completed")
        .not("end_at", "is", null)
        .not("score_json", "is", null);

      if (runsError) {
        console.error('Runs error:', runsError);
        throw runsError;
      }

      console.log('Fetched runs:', allRuns?.length);

      // Create profile map
      const profileMap = new Map(allProfiles?.map(p => [p.id, p]) || []);

      // Calculate date ranges
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      // Build student metrics
      const buildMetrics = (runs: any[]) => {
        const studentMetrics = new Map<string, { scores: number[]; lastAttemptAt: string }>();

        runs?.forEach((run: any) => {
          if (!run.score_json?.totalPoints || !run.score_json?.maxPoints) return;
          
          const normalizedScore = (run.score_json.totalPoints / run.score_json.maxPoints) * 10;
          
          if (!studentMetrics.has(run.student_id)) {
            studentMetrics.set(run.student_id, { scores: [], lastAttemptAt: run.end_at });
          }
          
          const metrics = studentMetrics.get(run.student_id)!;
          metrics.scores.push(normalizedScore);
          if (new Date(run.end_at) > new Date(metrics.lastAttemptAt)) {
            metrics.lastAttemptAt = run.end_at;
          }
        });

        return Array.from(studentMetrics.entries()).map(([studentId, data]) => {
          const profile: any = profileMap.get(studentId);
          return {
            studentId,
            name: profile?.name || 'Unknown',
            avgScore: data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length,
            attempts: data.scores.length,
            lastAttemptAt: data.lastAttemptAt,
          };
        }).sort((a, b) => b.avgScore - a.avgScore);
      };

      // Filter runs for different periods
      const todayRuns = allRuns?.filter(r => new Date(r.end_at) >= todayStart) || [];
      const weekRuns = allRuns?.filter(r => new Date(r.end_at) >= weekStart) || [];

      // Build leaderboards
      const dailyMetrics = buildMetrics(todayRuns);
      const weeklyMetrics = buildMetrics(weekRuns);
      const allTimeMetrics = buildMetrics(allRuns || []);

      console.log('Daily metrics:', dailyMetrics.length);
      console.log('Weekly metrics:', weeklyMetrics.length);
      console.log('All-time metrics:', allTimeMetrics.length);

      // Calculate stats from all-time data
      const totalAttempts = allTimeMetrics.reduce((sum, m) => sum + m.attempts, 0);
      const totalScore = allTimeMetrics.reduce((sum, m) => sum + (m.avgScore * m.attempts), 0);
      const avgScore = totalAttempts > 0 ? Math.round((totalScore / totalAttempts) * 10) : 0;
      const completionRate = allProfiles?.length > 0 
        ? Math.round((allTimeMetrics.length / allProfiles.length) * 100) 
        : 0;

      setStats({
        totalStudents: allProfiles?.length || 0,
        activeAssessments: totalAttempts,
        avgScore: avgScore,
        completionRate
      });

      // Set leaderboards
      setDailyLeaderboard(dailyMetrics);
      setWeeklyLeaderboard(weeklyMetrics);

      console.log('Successfully loaded admin dashboard data');

    } catch (error: any) {
      console.error("Error fetching admin data:", error);
      
      toast({
        title: "Failed to load admin data",
        description: error.message || "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const getRankBadge = (rank: number) => {
    if (rank === 1) return {
      icon: "🥇",
      variant: "default" as const
    };
    if (rank === 2) return {
      icon: "🥈",
      variant: "secondary" as const
    };
    if (rank === 3) return {
      icon: "🥉",
      variant: "outline" as const
    };
    return {
      icon: rank.toString(),
      variant: "outline" as const
    };
  };
  const getGradeColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };
  if (loading) {
    return <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Student performance overview & leaderboards</p>
          </div>
          <Button asChild className="rounded-xl bg-gradient-to-r from-primary to-[#7AA86E]">
            <Link to="/admin/leaderboard">
              <Trophy className="mr-2 h-4 w-4" />
              View Full Leaderboard
            </Link>
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                Total Students
              </CardDescription>
              <CardTitle className="text-4xl font-bold text-foreground">{stats.totalStudents}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">All registered students</p>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-accent/5 to-background">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4" />
                Assessments
              </CardDescription>
              <CardTitle className="text-4xl font-bold text-foreground">{stats.activeAssessments}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Total completed</p>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-secondary/5 to-background">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Average Score
              </CardDescription>
              <CardTitle className="text-4xl font-bold text-foreground">{stats.avgScore}%</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Across all assessments</p>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 to-background">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="h-4 w-4" />
                Completion Rate
              </CardDescription>
              <CardTitle className="text-4xl font-bold text-foreground">{stats.completionRate}%</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Students with ≥1 assessment</p>
            </CardHeader>
          </Card>
        </div>

        {/* Leaderboards */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Student Leaderboards
              <span className="text-sm font-normal text-muted-foreground ml-2" lang="hi">
                छात्र लीडरबोर्ड
              </span>
            </CardTitle>
            <CardDescription>
              Average OSCE scores across all completed cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 rounded-xl">
                <TabsTrigger value="daily" className="rounded-lg">Today</TabsTrigger>
                <TabsTrigger value="weekly" className="rounded-lg">This Week</TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="mt-6">
                {dailyLeaderboard.length === 0 ? <Alert className="rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No assessments completed today. Check back later!
                    </AlertDescription>
                  </Alert> : <div className="space-y-3">
                    {dailyLeaderboard.map((student, idx) => {
                  const rank = idx + 1;
                  const badge = getRankBadge(rank);
                  const displayScore = Math.round(student.avgScore * 10); // Convert 0-10 scale to 0-100
                  return <div key={student.studentId} className="flex items-center gap-4 p-4 bg-accent/5 rounded-xl hover:bg-accent/10 transition-colors">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-accent-foreground font-bold">
                            {badge.icon}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.attempts} assessment{student.attempts > 1 ? "s" : ""} completed
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${getGradeColor(displayScore)}`}>
                              {displayScore}%
                            </p>
                            <Badge variant={badge.variant} className="mt-1 rounded-full">
                              Rank #{rank}
                            </Badge>
                          </div>
                        </div>;
                })}
                  </div>}
              </TabsContent>

              <TabsContent value="weekly" className="mt-6">
                {weeklyLeaderboard.length === 0 ? <Alert className="rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No assessments completed this week. Check back later!
                    </AlertDescription>
                  </Alert> : <div className="space-y-3">
                    {weeklyLeaderboard.map((student, idx) => {
                  const rank = idx + 1;
                  const badge = getRankBadge(rank);
                  const displayScore = Math.round(student.avgScore * 10); // Convert 0-10 scale to 0-100
                  return <div key={student.studentId} className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${rank <= 3 ? "bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20" : "bg-accent/5 hover:bg-accent/10"}`}>
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-accent-foreground font-bold">
                            {badge.icon}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.attempts} assessment{student.attempts > 1 ? "s" : ""} completed
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${getGradeColor(displayScore)}`}>
                              {displayScore}%
                            </p>
                            <Badge variant={badge.variant} className="mt-1 rounded-full">
                              Rank #{rank}
                            </Badge>
                          </div>
                        </div>;
                })}
                  </div>}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AdminDashboard;