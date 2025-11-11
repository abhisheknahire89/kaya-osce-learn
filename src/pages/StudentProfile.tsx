import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";
import { Loader2, Mail, Trophy, Target, Clock, TrendingUp } from "lucide-react";

interface StudentStats {
  totalCases: number;
  completedCases: number;
  avgScore: number;
  totalTime: number;
}

const StudentProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<StudentStats>({
    totalCases: 0,
    completedCases: 0,
    avgScore: 0,
    totalTime: 0,
  });

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    try {
      if (!user) return;

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load stats from simulation runs
      const { data: runs, error: runsError } = await supabase
        .from("simulation_runs")
        .select("status, score_json, start_at, end_at")
        .eq("student_id", user.id);

      if (runsError) throw runsError;

      const completed = runs?.filter((r) => r.status === "completed") || [];
      const scores = completed
        .map((r) => {
          const scoreData = r.score_json as any;
          return scoreData?.percentage || 0;
        })
        .filter((s) => s > 0);

      const avgScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;

      const totalTime = completed.reduce((acc, r) => {
        if (r.start_at && r.end_at) {
          const diff = new Date(r.end_at).getTime() - new Date(r.start_at).getTime();
          return acc + Math.floor(diff / 1000 / 60);
        }
        return acc;
      }, 0);

      setStats({
        totalCases: runs?.length || 0,
        completedCases: completed.length,
        avgScore: Math.round(avgScore),
        totalTime,
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopMicroHeader
        title="Profile"
        subtitle="प्रोफाइल"
        onBack={() => navigate("/student")}
      />

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {profile?.name ? getInitials(profile.name) : "ST"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{profile?.name || "Student"}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </div>
                <Badge variant="secondary" className="mt-2">
                  Student
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Your OSCE performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span className="text-sm">Cases Assigned</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalCases}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="h-4 w-4" />
                <span className="text-sm">Completed</span>
              </div>
              <p className="text-2xl font-bold">{stats.completedCases}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Avg Score</span>
              </div>
              <p className="text-2xl font-bold">{stats.avgScore}%</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Total Time</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalTime}m</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/student/assigned")}
            >
              View Assigned Cases
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/student/progress")}
            >
              View Progress Report
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/student/remediation")}
            >
              Practice MCQs
            </Button>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default StudentProfile;
