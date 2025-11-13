import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowLeft, FileText, Video, Play, ExternalLink } from "lucide-react";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";
import { toast } from "sonner";

interface Material {
  id: string;
  type: string;
  title: string;
  file_url: string | null;
  content: string | null;
}

const StudentModuleDetail = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState<any>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quiz, setQuiz] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (moduleId) {
      fetchModuleData();
    }
  }, [moduleId]);

  const fetchModuleData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("*, courses(id, title)")
        .eq("id", moduleId)
        .eq("is_published", true)
        .single();

      if (moduleError) throw moduleError;
      setModule(moduleData);

      const { data: materialsData, error: materialsError } = await supabase
        .from("materials")
        .select("*")
        .eq("module_id", moduleId);

      if (materialsError) throw materialsError;
      setMaterials(materialsData || []);

      const { data: quizData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("module_id", moduleId)
        .maybeSingle();

      setQuiz(quizData);

      const { data: progressData } = await supabase
        .from("module_progress")
        .select("is_completed")
        .eq("student_id", user.id)
        .eq("module_id", moduleId)
        .maybeSingle();

      setIsCompleted(progressData?.is_completed || false);
    } catch (error) {
      console.error("Error fetching module:", error);
      toast.error("Failed to load module");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("module_progress")
        .upsert({
          student_id: user.id,
          module_id: moduleId,
          is_completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: "student_id,module_id"
        });

      if (error) throw error;

      setIsCompleted(true);
      toast.success("Module marked as complete!");
    } catch (error) {
      console.error("Error marking complete:", error);
      toast.error("Failed to mark as complete");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopMicroHeader title="Module" subtitleHindi="मॉड्यूल" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-background">
        <TopMicroHeader title="Module Not Found" subtitleHindi="मॉड्यूल नहीं मिला" />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Module not found or not available</p>
          <Button onClick={() => navigate(-1)} className="mt-4 rounded-xl">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopMicroHeader title={module.title} subtitleHindi="मॉड्यूल" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/student/lms/courses/${module.courses.id}`)}
          className="mb-6 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>

        <Card className="rounded-2xl mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl flex items-center gap-3">
                  {module.title}
                  {isCompleted && (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  )}
                </CardTitle>
                <CardDescription className="mt-2">{module.description}</CardDescription>
                <p className="text-sm text-muted-foreground mt-2">
                  Course: {module.courses.title}
                </p>
              </div>
            </div>
          </CardHeader>
          {!isCompleted && (
            <CardContent>
              <Button onClick={handleMarkComplete} className="rounded-xl">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Complete
              </Button>
            </CardContent>
          )}
        </Card>

        <h2 className="text-2xl font-bold mb-6">Learning Materials</h2>

        {materials.length === 0 ? (
          <Card className="rounded-2xl mb-8">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No materials yet</p>
              <p className="text-muted-foreground">Materials will be added soon</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 mb-8">
            {materials.map((material) => (
              <Card key={material.id} className="rounded-2xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {material.type === "text" && <FileText className="h-6 w-6 text-primary" />}
                    {material.type === "video" && <Video className="h-6 w-6 text-primary" />}
                    {material.type === "pdf" && <FileText className="h-6 w-6 text-primary" />}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{material.title}</CardTitle>
                    </div>
                    {material.file_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(material.file_url!, "_blank")}
                        className="rounded-xl"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {material.content && (
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-foreground whitespace-pre-wrap">{material.content}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {quiz && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Module Quiz
              </CardTitle>
              <CardDescription>Test your knowledge with this assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate(`/student/lms/quizzes/${quiz.id}`)}
                className="rounded-xl"
              >
                Start Quiz
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentModuleDetail;