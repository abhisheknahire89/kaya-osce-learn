import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string;
  module_count: number;
  completed_count: number;
}

const StudentLMS = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch published courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("id, title, description")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      // For each course, count modules and completed modules
      const coursesWithProgress = await Promise.all(
        (coursesData || []).map(async (course) => {
          const { count: moduleCount } = await supabase
            .from("modules")
            .select("*", { count: "exact", head: true })
            .eq("course_id", course.id)
            .eq("is_published", true);

          const { count: completedCount } = await supabase
            .from("module_progress")
            .select("*", { count: "exact", head: true })
            .eq("student_id", user.id)
            .eq("is_completed", true)
            .in("module_id", 
              (await supabase
                .from("modules")
                .select("id")
                .eq("course_id", course.id)
                .eq("is_published", true)
              ).data?.map(m => m.id) || []
            );

          return {
            ...course,
            module_count: moduleCount || 0,
            completed_count: completedCount || 0,
          };
        })
      );

      setCourses(coursesWithProgress);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (course: Course) => {
    if (course.module_count === 0) return 0;
    return Math.round((course.completed_count / course.module_count) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopMicroHeader title="My Learning" subtitleHindi="मेरा सीखना" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopMicroHeader title="My Learning" subtitleHindi="मेरा सीखना" />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Available Courses</h1>
          <p className="text-muted-foreground mt-1">Continue your learning journey</p>
        </div>

        {courses.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No courses available</p>
              <p className="text-muted-foreground">Check back later for new courses</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const progress = getProgressPercentage(course);
              return (
                <Card 
                  key={course.id} 
                  className="rounded-2xl hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/student/lms/courses/${course.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <BookOpen className="h-8 w-8 text-primary" />
                      {progress === 100 && (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {course.completed_count} of {course.module_count} modules completed
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLMS;