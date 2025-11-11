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
  const {
    toast
  } = useToast();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'all'>('all');
  const [date, setDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [cohortId, setCohortId] = useState<string>('all');
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentRuns, setStudentRuns] = useState<any[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  useEffect(() => {
    fetchLeaderboard();
  }, [period, date, cohortId, page]);

  // Real-time subscription for simulation runs and leaderboard snapshots
  useEffect(() => {
    const channel = supabase
      .channel('admin-leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simulation_runs'
        },
        (payload) => {
          console.log('Simulation run changed:', payload);
          // Refetch leaderboard when runs are updated
          fetchLeaderboard();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard_snapshots'
        },
        (payload) => {
          console.log('Leaderboard snapshot changed:', payload);
          // Refetch leaderboard when snapshots are updated
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [period, date, cohortId, page]);
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        period,
        date,
        page: page.toString(),
        pageSize: pageSize.toString(),
        sort: 'avgScore',
        order: 'desc'
      });
      if (cohortId && cohortId !== 'all') {
        params.append('cohortId', cohortId);
      }
      
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      console.log('Fetching leaderboard with params:', params.toString());
      
      const {
        data,
        error
      } = await supabase.functions.invoke(`admin_leaderboard?${params.toString()}`, {
        method: 'GET'
      });
      
      console.log('Leaderboard response:', { data, error });
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      if (!data) {
        console.warn('No data returned from edge function');
        setMetrics([]);
        setTotalStudents(0);
        return;
      }
      
      setMetrics(data.metrics || []);
      setTotalStudents(data.totalStudents || 0);
      
      console.log(`Loaded ${data.metrics?.length || 0} students`);
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Failed to load leaderboard",
        description: error.message || "Please try generating a snapshot first",
        variant: "destructive"
      });
      setMetrics([]);
      setTotalStudents(0);
    } finally {
      setLoading(false);
    }
  };
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const {
        data,
        error
      } = await supabase.functions.invoke('admin_leaderboard', {
        body: {
          period,
          snapshot_date: date,
          cohort_id: cohortId && cohortId !== 'all' ? cohortId : null
        },
        method: 'POST'
      });
      if (error) throw error;
      toast({
        title: "Snapshot refreshed",
        description: "Leaderboard data has been regenerated"
      });

      // Reload leaderboard
      await fetchLeaderboard();
    } catch (error: any) {
      console.error('Error refreshing snapshot:', error);
      toast({
        title: "Refresh failed",
        description: error.message,
        variant: "destructive"
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
        ...(cohortId && cohortId !== 'all' && {
          cohortId
        })
      });
      const {
        data,
        error
      } = await supabase.functions.invoke(`admin_leaderboard_export?${params.toString()}`, {
        method: 'GET'
      });
      if (error) throw error;

      // Create download link
      const blob = new Blob([format === 'csv' ? data : JSON.stringify(data, null, 2)], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leaderboard_${period}_${date}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Export successful",
        description: `Downloaded as ${format.toUpperCase()}`
      });
    } catch (error: any) {
      console.error('Error exporting leaderboard:', error);
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const getRankBadge = (rank: number) => {
    if (rank === 1) return {
      icon: "🥇",
      bg: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
    };
    if (rank === 2) return {
      icon: "🥈",
      bg: "bg-gray-400/10 text-gray-700 border-gray-400/20"
    };
    if (rank === 3) return {
      icon: "🥉",
      bg: "bg-orange-500/10 text-orange-700 border-orange-500/20"
    };
    return {
      icon: rank.toString(),
      bg: "bg-accent text-accent-foreground border-border"
    };
  };
  const getScoreColor = (score: number) => {
    if (score >= 8.5) return "text-green-600 dark:text-green-400";
    if (score >= 7.0) return "text-blue-600 dark:text-blue-400";
    if (score >= 5.0) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };
  const totalPages = Math.ceil(totalStudents / pageSize);
  return <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          
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
                <Tabs value={period} onValueChange={v => setPeriod(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 rounded-xl">
                    <TabsTrigger value="all" className="rounded-lg">All Time</TabsTrigger>
                    <TabsTrigger value="weekly" className="rounded-lg">Weekly</TabsTrigger>
                    <TabsTrigger value="daily" className="rounded-lg">Daily</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Date Picker */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Date
                </label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl" />
            </div>

            {/* Refresh Button */}
            <div>
              <label className="text-sm font-medium mb-2 block opacity-0">Actions</label>
                <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="w-full rounded-xl">
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Export Button */}
              <div>
                <label className="text-sm font-medium mb-2 block opacity-0">Export</label>
                <div className="flex gap-2">
                  
                  
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
            {loading ? <div className="text-center py-12">
                <p className="text-muted-foreground">Loading leaderboard...</p>
              </div> : metrics.length === 0 ? <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">No Leaderboard Data Available</p>
                <p className="text-muted-foreground mb-4">
                  No student assessments found for {period === 'daily' ? 'this day' : 'this week'}.
                  {totalStudents === 0 && ' Make sure students have completed assessments.'}
                </p>
                <Button onClick={handleRefresh} variant="outline" className="rounded-xl">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Snapshot
                </Button>
              </div> : <>
                <div className="space-y-3">
                  {metrics.map((student, idx) => {
                const rank = page * pageSize + idx + 1;
                const badge = getRankBadge(rank);
                return <div key={student.studentId} onClick={async () => {
                  setSelectedStudent(student);
                  setStudentModalOpen(true);
                  setLoadingRuns(true);
                  
                  // Fetch student's simulation runs with detailed scores
                  const { data: runs } = await supabase
                    .from('simulation_runs')
                    .select('id, created_at, end_at, score_json, status')
                    .eq('student_id', student.studentId)
                    .eq('status', 'completed')
                    .order('created_at', { ascending: false })
                    .limit(5);
                  
                  setStudentRuns(runs || []);
                  setSelectedRunId(runs?.[0]?.id || null);
                  setLoadingRuns(false);
                }} className={`flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer ${rank <= 3 ? "bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/20 hover:border-primary/40" : "bg-accent/5 hover:bg-accent/10 border border-border"}`}>
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
                            {student.avgScore.toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">/ 10</p>
                          <Badge variant="outline" className="mt-1 rounded-full">
                            Rank #{rank}
                          </Badge>
                        </div>
                      </div>;
              })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} variant="outline" className="rounded-xl">
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} variant="outline" className="rounded-xl">
                      Next
                    </Button>
                  </div>}
              </>}
          </CardContent>
        </Card>
      </div>

      {/* Student Detail Modal */}
      <Dialog open={studentModalOpen} onOpenChange={setStudentModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedStudent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary">{selectedStudent?.avgScore.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Average Score / 10</p>
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

            {/* Assessment Run Selector */}
            {loadingRuns ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Loading assessment details...</p>
              </div>
            ) : studentRuns.length > 0 ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Assessment</label>
                  <Select value={selectedRunId || ''} onValueChange={setSelectedRunId}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select an assessment" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentRuns.map((run) => (
                        <SelectItem key={run.id} value={run.id}>
                          {new Date(run.created_at).toLocaleDateString()} - Score: {run.score_json?.percentage || 0}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rubric Breakdown */}
                {selectedRunId && (() => {
                  const selectedRun = studentRuns.find(r => r.id === selectedRunId);
                  const scoreData = selectedRun?.score_json;
                  
                  if (!scoreData?.sections) {
                    return <p className="text-muted-foreground text-center py-4">No detailed rubric data available</p>;
                  }

                  return (
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-lg">Rubric Breakdown</CardTitle>
                        <CardDescription>
                          Total: {scoreData.totalPoints?.toFixed(1) || 0} / {scoreData.maxPoints || 0} points ({scoreData.percentage || 0}%)
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {scoreData.sections.map((section: any, idx: number) => (
                          <div key={idx} className="border rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-foreground">{section.section}</h4>
                              <Badge variant={section.score >= section.max * 0.8 ? "default" : section.score >= section.max * 0.5 ? "secondary" : "destructive"} className="rounded-full">
                                {section.score.toFixed(1)} / {section.max}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2">
                              {section.items.map((item: any, itemIdx: number) => (
                                <div key={itemIdx} className={`flex items-start gap-3 p-3 rounded-lg ${
                                  item.achieved === 1 ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900' :
                                  item.achieved === 0.5 ? 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900' :
                                  'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900'
                                }`}>
                                  <div className="mt-0.5">
                                    {item.achieved === 1 ? (
                                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                        <span className="text-white text-xs">✓</span>
                                      </div>
                                    ) : item.achieved === 0.5 ? (
                                      <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                                        <span className="text-white text-xs">~</span>
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                        <span className="text-white text-xs">✗</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm text-foreground">{item.text}</p>
                                    {item.evidence && (
                                      <p className="text-xs text-muted-foreground mt-1 italic">
                                        Evidence: {item.evidence}
                                      </p>
                                    )}
                                    {item.tip && !item.achieved && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        💡 {item.tip}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })()}
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">No completed assessments found</p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => handleExport('csv')}>
                Export Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default AdminLeaderboard;