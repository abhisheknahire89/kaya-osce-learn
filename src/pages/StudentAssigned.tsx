import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, BookOpen, PlayCircle, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const StudentAssigned = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      // Fetch assignments available to all students (cohort_id is null)
      const { data: assignmentsData, error } = await supabase
        .from("assignments")
        .select(`
          *,
          cases (
            id,
            title,
            subject,
            difficulty,
            clinical_json
          )
        `)
        .is("cohort_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssignments(assignmentsData || []);
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
      toast({
        title: "Failed to load assignments",
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

  const isActive = (startAt: string, endAt: string) => {
    const now = new Date();
    const start = new Date(startAt);
    const end = new Date(endAt);
    return now >= start && now <= end;
  };

  return (
    <div className="min-h-screen bg-background">
      <TopMicroHeader
        title="Assigned Cases"
        subtitleHindi="आवंटित मामले"
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              Your Assigned Cases
            </CardTitle>
            <CardDescription>
              View and complete cases assigned by your faculty
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading assignments...</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-6">
                  No cases assigned yet. Check back later.
                </p>
                <Button asChild className="rounded-xl">
                  <Link to="/student">Back to Dashboard</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => {
                  const caseData = assignment.cases;
                  const active = isActive(assignment.start_at, assignment.end_at);
                  
                  return (
                    <Card 
                      key={assignment.id} 
                      className={`rounded-2xl ${active ? 'border-primary/20' : 'border-border'}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{caseData?.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {caseData?.subject}
                            </CardDescription>
                          </div>
                          <Badge 
                            variant={active ? "default" : "secondary"} 
                            className="rounded-full"
                          >
                            {active ? "Active" : "Upcoming"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(assignment.start_at).toLocaleDateString()} - {new Date(assignment.end_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Time remaining: {getTimeRemaining(assignment.end_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          <span>Duration: {assignment.time_limit} minutes</span>
                        </div>
                        {active && (
                          <Button 
                            asChild 
                            className="w-full rounded-2xl bg-gradient-to-r from-primary to-[#7AA86E]"
                          >
                            <Link to={`/simulation/${assignment.id}`}>
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Start Assessment
                            </Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAssigned;
