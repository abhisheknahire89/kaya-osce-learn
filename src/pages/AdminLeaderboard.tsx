import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Download, RefreshCw, Calendar, Users, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/faculty/DashboardHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AdminLeaderboard = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState<'daily' | 'weekly'>('weekly');
  const [date, setDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });
  const [cohortId, setCohortId] = useState<string>('');
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);

  useEffect(() => {
    fetchCohorts();
    fetchLeaderboard();
  }, [period, date, cohortId, page]);

  const fetchCohorts = async () => {
    try {
      const { data, error } = await supabase
        .from('cohorts')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCohorts(data || []);
    } catch (error: any) {
      console.error('Error fetching cohorts:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('admin_leaderboard', {
        body: null,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) throw error;

      setMetrics(data.metrics || []);
      setTotalStudents(data.totalStudents || 0);
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Failed to load leaderboard",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      const { data, error } = await supabase.functions.invoke('admin_leaderboard', {
        body: { period, snapshot_date: date, cohort_id: cohortId || null },
        method: 'POST',
      });

      if (error) throw error;

      toast({
        title: "Snapshot refreshed",
        description: "Leaderboard data has been regenerated",
      });

      // Reload leaderboard
      await fetchLeaderboard();
    } catch (error: any) {
      console.error('Error refreshing snapshot:', error);
      toast({
        title: "Refresh failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({
        period,
        date,
        format,
        ...(cohortId && { cohortId }),
      });

      const { data, error } = await supabase.functions.invoke(
        `admin_leaderboard_export?${params.toString()}`,
        {
          method: 'GET',
        }
      );

      if (error) throw error;

      // Create download link
      const blob = new Blob([format === 'csv' ? data : JSON.stringify(data, null, 2)], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leaderboard_${period}_${date}.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Downloaded as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error('Error exporting leaderboard:', error);
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: "🥇", bg: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" };
    if (rank === 2) return { icon: "🥈", bg: "bg-gray-400/10 text-gray-700 border-gray-400/20" };
    if (rank === 3) return { icon: "🥉", bg: "bg-orange-500/10 text-orange-700 border-orange-500/20" };
    return { icon: rank.toString(), bg: "bg-accent text-accent-foreground border-border" };
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-blue-600 dark:text-blue-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const totalPages = Math.ceil(totalStudents / pageSize);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Admin — Leaderboard
            <span className="text-base font-normal text-muted-foreground ml-2" lang="hi">
              श्रेणी सूची
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Student performance rankings based on OSCE scores
          </p>
        </div>

        {/* Filters & Controls */}
        <Card className="mb-6 rounded-2xl">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-5">
              {/* Period Toggle */}
              <div>
                <label className="text-sm font-medium mb-2 block">Period</label>
                <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-xl">
                    <TabsTrigger value="daily" className="rounded-lg">Daily</TabsTrigger>
                    <TabsTrigger value="weekly" className="rounded-lg">Weekly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Date Picker */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {/* Cohort Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Cohort
                </label>
                <Select value={cohortId} onValueChange={setCohortId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="All cohorts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All cohorts</SelectItem>
                    {cohorts.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Refresh Button */}
              <div>
                <label className="text-sm font-medium mb-2 block opacity-0">Actions</label>
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Export Button */}
              <div>
                <label className="text-sm font-medium mb-2 block opacity-0">Export</label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleExport('csv')}
                    variant="secondary"
                    size="sm"
                    className="flex-1 rounded-xl"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    CSV
                  </Button>
                  <Button
                    onClick={() => handleExport('json')}
                    variant="secondary"
                    size="sm"
                    className="flex-1 rounded-xl"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    JSON
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
            <CardDescription>
              {totalStudents} students • Page {page + 1} of {totalPages || 1}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading leaderboard...</p>
              </div>
            ) : metrics.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No data available for this period
                </p>
                <Button onClick={handleRefresh} variant="outline">
                  Generate Snapshot
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {metrics.map((student, idx) => {
                    const rank = page * pageSize + idx + 1;
                    const badge = getRankBadge(rank);
                    return (
                      <div
                        key={student.studentId}
                        onClick={() => {
                          setSelectedStudent(student);
                          setStudentModalOpen(true);
                        }}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer ${
                          rank <= 3
                            ? "bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/20 hover:border-primary/40"
                            : "bg-accent/5 hover:bg-accent/10 border border-border"
                        }`}
                      >
                        {/* Rank Badge */}
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 font-bold text-lg ${badge.bg}`}>
                          {badge.icon}
                        </div>

                        {/* Student Info */}
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.attempts} assessment{student.attempts > 1 ? 's' : ''} completed
                          </p>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <p className={`text-3xl font-bold ${getScoreColor(student.avgScore)}`}>
                            {student.avgScore}%
                          </p>
                          <Badge variant="outline" className="mt-1 rounded-full">
                            Rank #{rank}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <Button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      variant="outline"
                      className="rounded-xl"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      variant="outline"
                      className="rounded-xl"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student Detail Modal */}
      <Dialog open={studentModalOpen} onOpenChange={setStudentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedStudent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary">{selectedStudent?.avgScore}%</p>
                  <p className="text-sm text-muted-foreground mt-1">Average Score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-foreground">{selectedStudent?.attempts}</p>
                  <p className="text-sm text-muted-foreground mt-1">Assessments</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    {selectedStudent?.lastAttemptAt ? new Date(selectedStudent.lastAttemptAt).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Last Attempt</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl">
                View All Runs
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => handleExport('csv')}>
                Export Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeaderboard;
