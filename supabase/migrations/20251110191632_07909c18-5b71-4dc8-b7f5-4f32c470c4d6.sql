-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('faculty', 'student', 'admin');

-- Create enum for case status
CREATE TYPE public.case_status AS ENUM ('draft', 'pending', 'approved', 'archived');

-- Create enum for Miller levels
CREATE TYPE public.miller_level AS ENUM ('Knows', 'KnowsHow', 'ShowsHow', 'Does');

-- Users table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT NOT NULL,
    institution_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Cohorts table
CREATE TABLE public.cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    institution_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cases table
CREATE TABLE public.cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    clinical_json JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    status case_status DEFAULT 'draft',
    cbdc_tags JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create GIN index for JSONB fields
CREATE INDEX idx_cases_clinical_json ON public.cases USING GIN (clinical_json);
CREATE INDEX idx_cases_cbdc_tags ON public.cases USING GIN (cbdc_tags);

-- Case versions table
CREATE TABLE public.case_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    clinical_json JSONB NOT NULL,
    change_log TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments table
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    cohort_id UUID REFERENCES public.cohorts(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    time_limit INTEGER, -- in minutes
    attempts_allowed INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simulation runs table
CREATE TABLE public.simulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ DEFAULT NOW(),
    end_at TIMESTAMPTZ,
    transcript JSONB DEFAULT '[]',
    actions JSONB DEFAULT '[]',
    score_json JSONB,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rubrics table
CREATE TABLE public.rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    rubric_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MCQs table
CREATE TABLE public.mcqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    question_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics snapshots table
CREATE TABLE public.analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    cohort_id UUID REFERENCES public.cohorts(id),
    coverage_metrics JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CBDC matrix table
CREATE TABLE public.cbdc_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competency_id TEXT NOT NULL,
    slo_id TEXT NOT NULL,
    description TEXT,
    source_pdf_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (competency_id, slo_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbdc_matrix ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users can read own profile, faculty/admin can read all
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Faculty and admin can view all profiles"
ON public.profiles FOR SELECT
USING (
  public.has_role(auth.uid(), 'faculty') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Cases: faculty own cases, students can view approved
CREATE POLICY "Faculty can manage own cases"
ON public.cases FOR ALL
USING (created_by = auth.uid() AND public.has_role(auth.uid(), 'faculty'));

CREATE POLICY "Students can view approved cases"
ON public.cases FOR SELECT
USING (status = 'approved' AND public.has_role(auth.uid(), 'student'));

CREATE POLICY "Faculty can view all cases"
ON public.cases FOR SELECT
USING (public.has_role(auth.uid(), 'faculty'));

-- Simulation runs: students own their runs, faculty can view
CREATE POLICY "Students can manage own runs"
ON public.simulation_runs FOR ALL
USING (student_id = auth.uid() AND public.has_role(auth.uid(), 'student'));

CREATE POLICY "Faculty can view all runs"
ON public.simulation_runs FOR SELECT
USING (public.has_role(auth.uid(), 'faculty'));

-- User roles: only admins can modify
CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Cohorts: faculty and admin can manage
CREATE POLICY "Faculty and admin can manage cohorts"
ON public.cohorts FOR ALL
USING (
  public.has_role(auth.uid(), 'faculty') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Assignments: faculty can manage, students can view assigned
CREATE POLICY "Faculty can manage assignments"
ON public.assignments FOR ALL
USING (public.has_role(auth.uid(), 'faculty'));

CREATE POLICY "Students can view assignments"
ON public.assignments FOR SELECT
USING (public.has_role(auth.uid(), 'student'));

-- CBDC matrix: everyone can read
CREATE POLICY "Everyone can view CBDC matrix"
ON public.cbdc_matrix FOR SELECT
USING (true);

CREATE POLICY "Faculty and admin can manage CBDC matrix"
ON public.cbdc_matrix FOR ALL
USING (
  public.has_role(auth.uid(), 'faculty') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cohorts_updated_at
BEFORE UPDATE ON public.cohorts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
BEFORE UPDATE ON public.cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();