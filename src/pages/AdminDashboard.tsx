import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Users, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/faculty/DashboardHeader";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [dailyLeaderboard, setDailyLeaderboard] = useState<any[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeAssessments: 0,
    avgScore: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Calculate date ranges
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch all scored runs with student and case info
      const { data: allRuns, error: runsError } = await supabase
        .from("simulation_runs")
        .select(`
          id,
          student_id,
          score_json,
          created_at,
          status,
          profiles!simulation_runs_student_id_fkey (
            id,
            name
          )
        `)
        .eq("status", "scored");

      if (runsError) throw runsError;

      // Calculate stats
      const uniqueStudents = new Set(allRuns?.map(r => r.student_id) || []);
      const scores = allRuns?.map(r => (r.score_json as any)?.percent || 0).filter(s => s > 0) || [];
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      setStats({
        totalStudents: uniqueStudents.size,
        activeAssessments: allRuns?.length || 0,
        avgScore: Math.round(avgScore),
        completionRate: 75, // Placeholder
      });

      // Build daily leaderboard
      const dailyRuns = allRuns?.filter(r => new Date(r.created_at) >= todayStart) || [];
      const dailyByStudent = buildLeaderboard(dailyRuns);
      setDailyLeaderboard(dailyByStudent);

      // Build weekly leaderboard
      const weeklyRuns = allRuns?.filter(r => new Date(r.created_at) >= weekStart) || [];
      const weeklyByStudent = buildLeaderboard(weeklyRuns);
      setWeeklyLeaderboard(weeklyByStudent);
    } catch (error: any) {
      console.error("Error fetching admin data:", error);
      toast({
        title: "Failed to load admin data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildLeaderboard = (runs: any[]) => {
    const studentMap: Record<string, { name: string; scores: number[]; count: number }> = {};

    runs.forEach(run => {
      const studentId = run.student_id;
      const studentName = run.profiles?.name || "Unknown Student";
      const score = (run.score_json as any)?.percent || 0;

      if (!studentMap[studentId]) {
        studentMap[studentId] = { name: studentName, scores: [], count: 0 };
      }
      studentMap[studentId].scores.push(score);
      studentMap[studentId].count += 1;
    });

    const leaderboard = Object.entries(studentMap)
      .map(([studentId, data]) => ({
        studentId,
        name: data.name,
        avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        attempts: data.count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    return leaderboard;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: "🥇", variant: "default" as const };
    if (rank === 2) return { icon: "🥈", variant: "secondary" as const };
    if (rank === 3) return { icon: "🥉", variant: "outline" as const };
    return { icon: rank.toString(), variant: "outline" as const };
  };

  const getGradeColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-background">
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
          <Card className="rounded-2xl border-primary/20">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Students
              </CardDescription>
              <CardTitle className="text-3xl">{stats.totalStudents}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl border-primary/20">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Completed Assessments
              </CardDescription>
              <CardTitle className="text-3xl">{stats.activeAssessments}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl border-primary/20">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Average Score
              </CardDescription>
              <CardTitle className="text-3xl">{stats.avgScore}%</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl border-primary/20">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Top Performer
              </CardDescription>
              <CardTitle className="text-base">
                {weeklyLeaderboard[0]?.name || "N/A"}
              </CardTitle>
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
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Loading...</p>
                ) : dailyLeaderboard.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No assessments completed today
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dailyLeaderboard.map((student, idx) => {
                      const rank = idx + 1;
                      const badge = getRankBadge(rank);
                      return (
                        <div
                          key={student.studentId}
                          className="flex items-center gap-4 p-4 bg-accent/5 rounded-xl hover:bg-accent/10 transition-colors"
                        >
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
                            <p className={`text-2xl font-bold ${getGradeColor(student.avgScore)}`}>
                              {Math.round(student.avgScore)}%
                            </p>
                            <Badge variant={badge.variant} className="mt-1 rounded-full">
                              Rank #{rank}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="weekly" className="mt-6">
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Loading...</p>
                ) : weeklyLeaderboard.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No assessments completed this week
                  </p>
                ) : (
                  <div className="space-y-3">
                    {weeklyLeaderboard.map((student, idx) => {
                      const rank = idx + 1;
                      const badge = getRankBadge(rank);
                      return (
                        <div
                          key={student.studentId}
                          className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                            rank <= 3
                              ? "bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
                              : "bg-accent/5 hover:bg-accent/10"
                          }`}
                        >
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
                            <p className={`text-2xl font-bold ${getGradeColor(student.avgScore)}`}>
                              {Math.round(student.avgScore)}%
                            </p>
                            <Badge variant={badge.variant} className="mt-1 rounded-full">
                              Rank #{rank}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
