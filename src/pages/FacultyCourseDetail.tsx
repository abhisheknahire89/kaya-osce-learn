import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft, FileText } from "lucide-react";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  is_published: boolean;
}

const FacultyCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModuleOpen, setCreateModuleOpen] = useState(false);
  const [newModule, setNewModule] = useState({ title: "", description: "" });
  const [publishLoading, setPublishLoading] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (modulesError) throw modulesError;
      setModules(modulesData || []);
    } catch (error) {
      console.error("Error fetching course:", error);
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async () => {
    if (!newModule.title.trim()) {
      toast.error("Please enter a module title");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("modules")
        .insert([{
          course_id: courseId,
          title: newModule.title,
          description: newModule.description,
          order_index: modules.length,
          is_published: false
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success("Module created successfully");
      setCreateModuleOpen(false);
      setNewModule({ title: "", description: "" });
      setModules([...modules, data]);
    } catch (error) {
      console.error("Error creating module:", error);
      toast.error("Failed to create module");
    }
  };

  const toggleCoursePublish = async () => {
    setPublishLoading(true);
    try {
      const { error } = await supabase
        .from("courses")
        .update({ is_published: !course.is_published })
        .eq("id", courseId);

      if (error) throw error;

      setCourse({ ...course, is_published: !course.is_published });
      toast.success(course.is_published ? "Course unpublished" : "Course published");
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast.error("Failed to update course");
    } finally {
      setPublishLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopMicroHeader title="Course Details" subtitleHindi="पाठ्यक्रम विवरण" />
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
          <p>Course not found</p>
          <Button onClick={() => navigate("/faculty/lms")} className="mt-4 rounded-xl">
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopMicroHeader title={course.title} subtitleHindi="पाठ्यक्रम प्रबंधन" />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/faculty/lms")}
          className="mb-6 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>

        <Card className="rounded-2xl mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl">{course.title}</CardTitle>
                <CardDescription className="mt-2">{course.description}</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label>Published</Label>
                  <Switch 
                    checked={course.is_published}
                    onCheckedChange={toggleCoursePublish}
                    disabled={publishLoading}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Course Modules</h2>
          <Dialog open={createModuleOpen} onOpenChange={setCreateModuleOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Create New Module</DialogTitle>
                <DialogDescription>
                  Add a new learning module to this course
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="module-title">Module Title</Label>
                  <Input
                    id="module-title"
                    placeholder="Unit 1: Introduction"
                    value={newModule.title}
                    onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module-description">Description</Label>
                  <Textarea
                    id="module-description"
                    placeholder="Module overview..."
                    value={newModule.description}
                    onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                    className="rounded-xl min-h-24"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateModuleOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handleCreateModule} className="rounded-xl">
                  Create Module
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {modules.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No modules yet</p>
              <p className="text-muted-foreground mb-6">Add your first module to this course</p>
              <Button onClick={() => setCreateModuleOpen(true)} className="rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Add First Module
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {modules.map((module, index) => (
              <Card 
                key={module.id}
                className="rounded-2xl hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/faculty/lms/modules/${module.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 rounded-full h-10 w-10 flex items-center justify-center text-primary font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{module.title}</CardTitle>
                          <CardDescription className="mt-1">{module.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      module.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {module.is_published ? 'Published' : 'Draft'}
                    </span>
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

export default FacultyCourseDetail;