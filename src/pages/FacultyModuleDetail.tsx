import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft, FileText, Video, Upload, Sparkles, Loader2 } from "lucide-react";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Material {
  id: string;
  type: string;
  title: string;
  file_url: string | null;
  content: string | null;
}

const FacultyModuleDetail = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState<any>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    type: "text",
    title: "",
    content: "",
    file_url: ""
  });

  useEffect(() => {
    if (moduleId) {
      fetchModuleData();
    }
  }, [moduleId]);

  const fetchModuleData = async () => {
    try {
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("*, courses(id, title)")
        .eq("id", moduleId)
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
    } catch (error) {
      console.error("Error fetching module:", error);
      toast.error("Failed to load module");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.title.trim()) {
      toast.error("Please enter a material title");
      return;
    }

    if (newMaterial.type === "text" && !newMaterial.content.trim()) {
      toast.error("Please enter content");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("materials")
        .insert([{
          module_id: moduleId,
          type: newMaterial.type,
          title: newMaterial.title,
          content: newMaterial.type === "text" ? newMaterial.content : null,
          file_url: newMaterial.type !== "text" ? newMaterial.file_url : null
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success("Material added successfully");
      setAddMaterialOpen(false);
      setNewMaterial({ type: "text", title: "", content: "", file_url: "" });
      setMaterials([...materials, data]);
    } catch (error) {
      console.error("Error adding material:", error);
      toast.error("Failed to add material");
    }
  };

  const handleGenerateQuiz = async () => {
    if (materials.length === 0) {
      toast.error("Add learning materials first");
      return;
    }

    setGeneratingQuiz(true);
    try {
      // Gather all text content
      const content = materials
        .filter(m => m.type === "text" && m.content)
        .map(m => m.content)
        .join("\n\n");

      if (!content) {
        toast.error("No text content available for quiz generation");
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate_quiz", {
        body: {
          content,
          moduleTitle: module.title,
          numQuestions: 5
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to generate quiz");
      }

      // Create quiz
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .insert([{
          module_id: moduleId,
          title: `${module.title} Quiz`
        }])
        .select()
        .single();

      if (quizError) throw quizError;

      // Add questions
      const questions = data.questions.map((q: any) => ({
        quiz_id: quizData.id,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation
      }));

      const { error: questionsError } = await supabase
        .from("quiz_questions")
        .insert(questions);

      if (questionsError) throw questionsError;

      toast.success("Quiz generated successfully!");
      setQuiz(quizData);
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      toast.error(error.message || "Failed to generate quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const toggleModulePublish = async () => {
    try {
      const { error } = await supabase
        .from("modules")
        .update({ is_published: !module.is_published })
        .eq("id", moduleId);

      if (error) throw error;

      setModule({ ...module, is_published: !module.is_published });
      toast.success(module.is_published ? "Module unpublished" : "Module published");
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast.error("Failed to update module");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopMicroHeader title="Module Details" subtitleHindi="मॉड्यूल विवरण" />
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
          <p>Module not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4 rounded-xl">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopMicroHeader title={module.title} subtitleHindi="मॉड्यूल प्रबंधन" />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/faculty/lms/courses/${module.courses.id}`)}
          className="mb-6 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>

        <Card className="rounded-2xl mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl">{module.title}</CardTitle>
                <CardDescription className="mt-2">{module.description}</CardDescription>
                <p className="text-sm text-muted-foreground mt-2">
                  Course: {module.courses.title}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label>Published</Label>
                <Switch 
                  checked={module.is_published}
                  onCheckedChange={toggleModulePublish}
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{materials.length}</p>
              <p className="text-sm text-muted-foreground">Learning resources</p>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Quiz</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{quiz ? "1" : "0"}</p>
              <p className="text-sm text-muted-foreground">Assessment quiz</p>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-lg font-semibold ${module.is_published ? 'text-green-600' : 'text-yellow-600'}`}>
                {module.is_published ? "Published" : "Draft"}
              </p>
              <p className="text-sm text-muted-foreground">Visibility status</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Learning Materials</h2>
          <div className="flex gap-3">
            {!quiz && (
              <Button 
                onClick={handleGenerateQuiz}
                disabled={generatingQuiz || materials.length === 0}
                className="rounded-xl"
                variant="outline"
              >
                {generatingQuiz ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Quiz with AI
                  </>
                )}
              </Button>
            )}
            <Dialog open={addMaterialOpen} onOpenChange={setAddMaterialOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Add Learning Material</DialogTitle>
                  <DialogDescription>
                    Upload or create new learning content
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Material Type</Label>
                    <Select 
                      value={newMaterial.type}
                      onValueChange={(value) => setNewMaterial({ ...newMaterial, type: value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Lesson</SelectItem>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="ppt">Presentation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material-title">Title</Label>
                    <Input
                      id="material-title"
                      placeholder="Lesson title"
                      value={newMaterial.title}
                      onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  {newMaterial.type === "text" ? (
                    <div className="space-y-2">
                      <Label htmlFor="material-content">Content</Label>
                      <Textarea
                        id="material-content"
                        placeholder="Enter lesson content..."
                        value={newMaterial.content}
                        onChange={(e) => setNewMaterial({ ...newMaterial, content: e.target.value })}
                        className="rounded-xl min-h-32"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="file-url">File URL</Label>
                      <Input
                        id="file-url"
                        placeholder="https://example.com/file.pdf"
                        value={newMaterial.file_url}
                        onChange={(e) => setNewMaterial({ ...newMaterial, file_url: e.target.value })}
                        className="rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground">For video, you can use YouTube embed links</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddMaterialOpen(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button onClick={handleAddMaterial} className="rounded-xl">
                    Add Material
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {materials.length === 0 ? (
          <Card className="rounded-2xl mb-8">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No materials yet</p>
              <p className="text-muted-foreground mb-6">Add learning materials to this module</p>
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
                    {(material.type === "pdf" || material.type === "ppt") && <Upload className="h-6 w-6 text-primary" />}
                    <div>
                      <CardTitle className="text-lg">{material.title}</CardTitle>
                      <CardDescription>Type: {material.type.toUpperCase()}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {material.content && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{material.content}</p>
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
                <Sparkles className="h-5 w-5 text-primary" />
                {quiz.title}
              </CardTitle>
              <CardDescription>AI-generated assessment quiz</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate(`/faculty/lms/quizzes/${quiz.id}`)}
                className="rounded-xl"
              >
                View Quiz Details
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FacultyModuleDetail;