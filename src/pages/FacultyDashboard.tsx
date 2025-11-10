import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Users, BarChart3, Eye, Edit, TrendingUp, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardHeader } from "@/components/faculty/DashboardHeader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CasePreviewModal } from "@/components/faculty/CasePreviewModal";
import { AssignCohortModal } from "@/components/faculty/AssignCohortModal";

const FacultyDashboard = () => {
  const { toast } = useToast();
  const [cases, setCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCases: 0,
    pendingCases: 0,
    approvedCases: 0,
    avgCompletion: 0,
  });
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchCases();
    fetchStats();
  }, []);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setCases(data || []);
    } catch (error: any) {
      console.error("Error fetching cases:", error);
      toast({
        title: "Error loading cases",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: total } = await supabase
        .from("cases")
        .select("*", { count: "exact", head: true });

      const { count: pending } = await supabase
        .from("cases")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: approved } = await supabase
        .from("cases")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      // Calculate average completion rate from simulation runs
      const { data: runs } = await supabase
        .from("simulation_runs")
        .select("id, status");

      const completedRuns = runs?.filter(r => r.status === "scored").length || 0;
      const totalRuns = runs?.length || 0;
      const avgCompletion = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

      setStats({
        totalCases: total || 0,
        pendingCases: pending || 0,
        approvedCases: approved || 0,
        avgCompletion,
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "hard":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

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
            <Button asChild variant="outline" className="h-24 flex-col gap-2 rounded-2xl hover-scale">
              <Link to="/faculty/library">
                <FileText className="h-6 w-6" />
                <span>View All Cases</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex-col gap-2 rounded-2xl hover-scale">
              <Link to="/admin">
                <Users className="h-6 w-6" />
                <span>Manage Students</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex-col gap-2 rounded-2xl hover-scale">
              <Link to="/faculty/analytics">
                <BarChart3 className="h-6 w-6" />
                <span>View Analytics</span>
              </Link>
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
                <CardDescription>Total Cases</CardDescription>
                <CardTitle className="text-3xl">{stats.totalCases}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl border-primary/20 hover-scale">
              <CardHeader className="pb-3">
                <CardDescription>Pending Approvals</CardDescription>
                <CardTitle className="text-3xl">{stats.pendingCases}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl border-primary/20 hover-scale">
              <CardHeader className="pb-3">
                <CardDescription>Approved Cases</CardDescription>
                <CardTitle className="text-3xl">{stats.approvedCases}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl border-primary/20 hover-scale">
              <CardHeader className="pb-3">
                <CardDescription>Avg. Completion</CardDescription>
                <CardTitle className="text-3xl">{stats.avgCompletion}%</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Approved Cases */}
        <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">
              Approved Cases
              <span className="ml-2 text-sm text-muted-foreground" lang="hi">स्वीकृत केस</span>
            </h2>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link to="/faculty/library">View All</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="rounded-2xl">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cases.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No approved cases yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate your first case to get started
                </p>
                <Button asChild className="rounded-xl">
                  <Link to="/faculty/generate-case">
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Case
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cases.map((caseItem) => (
                <Card
                  key={caseItem.id}
                  className="hover:shadow-md transition-all rounded-2xl border-primary/10 group"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-lg leading-tight">
                        {caseItem.title}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={`${getDifficultyColor(caseItem.difficulty)} shrink-0`}
                      >
                        {caseItem.difficulty || "Medium"}
                      </Badge>
                    </div>
                    <CardDescription className="flex flex-col gap-1">
                      <span className="flex items-center gap-1 text-xs">
                        <FileText className="h-3 w-3" />
                        {caseItem.subject}
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        {formatDate(caseItem.created_at)}
                      </span>
                      {caseItem.cbdc_tags?.millerLevel && (
                        <span className="text-xs">
                          Miller: {caseItem.cbdc_tags.millerLevel}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl flex-1 group-hover:bg-accent"
                        onClick={() => {
                          setSelectedCase(caseItem);
                          setShowPreviewModal(true);
                        }}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl flex-1 group-hover:bg-accent"
                        onClick={() => {
                          setSelectedCase(caseItem);
                          setShowAssignModal(true);
                        }}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl group-hover:bg-accent"
                        asChild
                      >
                        <Link to="/faculty/analytics">
                          <TrendingUp className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        {selectedCase && (
          <>
            <CasePreviewModal
              isOpen={showPreviewModal}
              onClose={() => {
                setShowPreviewModal(false);
                setSelectedCase(null);
              }}
              caseData={selectedCase.clinical_json}
              onApprove={() => {
                setShowPreviewModal(false);
                setSelectedCase(null);
              }}
              showAssignButton={false}
            />
            <AssignCohortModal
              isOpen={showAssignModal}
              onClose={() => {
                setShowAssignModal(false);
                setSelectedCase(null);
              }}
              caseId={selectedCase.id}
              onAssignComplete={() => {
                toast({
                  title: "Success",
                  description: "Case assigned to cohort successfully",
                });
                setShowAssignModal(false);
                setSelectedCase(null);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;
