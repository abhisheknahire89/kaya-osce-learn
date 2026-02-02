import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowLeft, Lock } from "lucide-react";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type CourseRow = Tables<"courses">;
type ModuleRow = Tables<"modules">;

interface Module extends ModuleRow {
  is_completed: boolean;
}

const StudentCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseRow | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .eq("is_published", true)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData as CourseRow);

      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (modulesError) throw modulesError;

      // Check completion status for each module
      const modulesWithProgress = await Promise.all(
        ((modulesData as ModuleRow[]) || []).map(async (module) => {
          const { data: progressData } = await supabase
            .from("module_progress")
            .select("is_completed")
            .eq("student_id", user.id)
            .eq("module_id", module.id)
            .maybeSingle();

          return {
            ...module,
            is_completed: progressData?.is_completed || false
          };
        })
      );

      setModules(modulesWithProgress);
    } catch (error) {
      console.error("Error fetching course:", error);
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const getProgress = () => {
    if (modules.length === 0) return 0;
    const completed = modules.filter(m => m.is_completed).length;
    return Math.round((completed / modules.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopMicroHeader title="Course" subtitleHindi="पाठ्यक्रम" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <TopMicroHeader title="Course Not Found" subtitleHindi="पाठ्यक्रम नहीं मिला" />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Course not found or not available</p>
          <Button onClick={() => navigate("/student/lms")} className="mt-4 rounded-xl">
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopMicroHeader title={course.title} subtitleHindi="पाठ्यक्रम" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/student/lms")}
          className="mb-6 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Learning
        </Button>

        <Card className="rounded-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{course.title}</CardTitle>
            <CardDescription className="mt-2">{course.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Course Progress</span>
                <span className="font-medium">{getProgress()}%</span>
              </div>
              <Progress value={getProgress()} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {modules.filter(m => m.is_completed).length} of {modules.length} modules completed
              </p>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-6">Course Modules</h2>

        {modules.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Lock className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No modules available</p>
              <p className="text-muted-foreground">This course is still being prepared</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {modules.map((module, index) => (
              <Card 
                key={module.id}
                className="rounded-2xl hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/student/lms/modules/${module.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 rounded-full h-12 w-12 flex items-center justify-center text-primary font-semibold text-lg flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {module.title}
                        {module.is_completed && (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        )}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourseDetail;
