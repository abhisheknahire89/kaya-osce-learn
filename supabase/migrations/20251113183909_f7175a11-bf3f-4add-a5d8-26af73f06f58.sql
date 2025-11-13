-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  faculty_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_published BOOLEAN DEFAULT false
);

-- Create modules table
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create materials table
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'ppt', 'video', 'text')),
  title TEXT NOT NULL,
  file_url TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER,
  answers JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments_lms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create assignment_submissions table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments_lms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT,
  grade INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create progress table
CREATE TABLE IF NOT EXISTS public.module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(student_id, module_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments_lms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Faculty can manage own courses" ON public.courses
  FOR ALL USING (faculty_id = auth.uid() AND has_role(auth.uid(), 'faculty'::app_role));

CREATE POLICY "Students can view published courses" ON public.courses
  FOR SELECT USING (is_published = true AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Faculty can view all courses" ON public.courses
  FOR SELECT USING (has_role(auth.uid(), 'faculty'::app_role));

-- RLS Policies for modules
CREATE POLICY "Faculty can manage modules" ON public.modules
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.faculty_id = auth.uid()
  ) AND has_role(auth.uid(), 'faculty'::app_role));

CREATE POLICY "Students can view published modules" ON public.modules
  FOR SELECT USING (is_published = true AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Faculty can view all modules" ON public.modules
  FOR SELECT USING (has_role(auth.uid(), 'faculty'::app_role));

-- RLS Policies for materials
CREATE POLICY "Faculty can manage materials" ON public.materials
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.modules 
    JOIN public.courses ON courses.id = modules.course_id
    WHERE modules.id = materials.module_id AND courses.faculty_id = auth.uid()
  ) AND has_role(auth.uid(), 'faculty'::app_role));

CREATE POLICY "Students can view published materials" ON public.materials
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.modules WHERE modules.id = materials.module_id AND modules.is_published = true
  ) AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Faculty can view all materials" ON public.materials
  FOR SELECT USING (has_role(auth.uid(), 'faculty'::app_role));

-- RLS Policies for quizzes
CREATE POLICY "Faculty can manage quizzes" ON public.quizzes
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.modules 
    JOIN public.courses ON courses.id = modules.course_id
    WHERE modules.id = quizzes.module_id AND courses.faculty_id = auth.uid()
  ) AND has_role(auth.uid(), 'faculty'::app_role));

CREATE POLICY "Students can view published quizzes" ON public.quizzes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.modules WHERE modules.id = quizzes.module_id AND modules.is_published = true
  ) AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Faculty can view all quizzes" ON public.quizzes
  FOR SELECT USING (has_role(auth.uid(), 'faculty'::app_role));

-- RLS Policies for quiz_questions
CREATE POLICY "Faculty can manage quiz questions" ON public.quiz_questions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.quizzes
    JOIN public.modules ON modules.id = quizzes.module_id
    JOIN public.courses ON courses.id = modules.course_id
    WHERE quizzes.id = quiz_questions.quiz_id AND courses.faculty_id = auth.uid()
  ) AND has_role(auth.uid(), 'faculty'::app_role));

CREATE POLICY "Students can view published quiz questions" ON public.quiz_questions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.quizzes
    JOIN public.modules ON modules.id = quizzes.module_id
    WHERE quizzes.id = quiz_questions.quiz_id AND modules.is_published = true
  ) AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Faculty can view all quiz questions" ON public.quiz_questions
  FOR SELECT USING (has_role(auth.uid(), 'faculty'::app_role));

-- RLS Policies for quiz_attempts
CREATE POLICY "Students can manage own attempts" ON public.quiz_attempts
  FOR ALL USING (student_id = auth.uid() AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Faculty can view all attempts" ON public.quiz_attempts
  FOR SELECT USING (has_role(auth.uid(), 'faculty'::app_role));

-- RLS Policies for assignments_lms
CREATE POLICY "Faculty can manage assignments" ON public.assignments_lms
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.modules 
    JOIN public.courses ON courses.id = modules.course_id
    WHERE modules.id = assignments_lms.module_id AND courses.faculty_id = auth.uid()
  ) AND has_role(auth.uid(), 'faculty'::app_role));

CREATE POLICY "Students can view published assignments" ON public.assignments_lms
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.modules WHERE modules.id = assignments_lms.module_id AND modules.is_published = true
  ) AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Faculty can view all assignments" ON public.assignments_lms
  FOR SELECT USING (has_role(auth.uid(), 'faculty'::app_role));

-- RLS Policies for assignment_submissions
CREATE POLICY "Students can manage own submissions" ON public.assignment_submissions
  FOR ALL USING (student_id = auth.uid() AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Faculty can view and grade submissions" ON public.assignment_submissions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.assignments_lms
    JOIN public.modules ON modules.id = assignments_lms.module_id
    JOIN public.courses ON courses.id = modules.course_id
    WHERE assignments_lms.id = assignment_submissions.assignment_id AND courses.faculty_id = auth.uid()
  ) AND has_role(auth.uid(), 'faculty'::app_role));

-- RLS Policies for module_progress
CREATE POLICY "Students can manage own progress" ON public.module_progress
  FOR ALL USING (student_id = auth.uid() AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Faculty can view all progress" ON public.module_progress
  FOR SELECT USING (has_role(auth.uid(), 'faculty'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_modules_course_id ON public.modules(course_id);
CREATE INDEX idx_materials_module_id ON public.materials(module_id);
CREATE INDEX idx_quizzes_module_id ON public.quizzes(module_id);
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_attempts_student_id ON public.quiz_attempts(student_id);
CREATE INDEX idx_assignments_module_id ON public.assignments_lms(module_id);
CREATE INDEX idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX idx_module_progress_student_id ON public.module_progress(student_id);

-- Trigger for updating courses.updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();