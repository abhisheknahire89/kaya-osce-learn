-- Add missing RLS policies for case_versions
CREATE POLICY "Faculty can view case versions"
ON public.case_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = case_versions.case_id 
    AND (cases.created_by = auth.uid() OR public.has_role(auth.uid(), 'faculty'))
  )
);

CREATE POLICY "Faculty can manage case versions"
ON public.case_versions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = case_versions.case_id 
    AND cases.created_by = auth.uid() 
    AND public.has_role(auth.uid(), 'faculty')
  )
);

-- Add missing RLS policies for rubrics
CREATE POLICY "Faculty can view rubrics"
ON public.rubrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = rubrics.case_id 
    AND (cases.created_by = auth.uid() OR public.has_role(auth.uid(), 'faculty'))
  )
);

CREATE POLICY "Students can view approved case rubrics"
ON public.rubrics FOR SELECT
USING (
  public.has_role(auth.uid(), 'student') AND
  EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = rubrics.case_id 
    AND cases.status = 'approved'
  )
);

CREATE POLICY "Faculty can manage rubrics"
ON public.rubrics FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = rubrics.case_id 
    AND cases.created_by = auth.uid() 
    AND public.has_role(auth.uid(), 'faculty')
  )
);

-- Add missing RLS policies for mcqs
CREATE POLICY "Faculty can view mcqs"
ON public.mcqs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = mcqs.case_id 
    AND (cases.created_by = auth.uid() OR public.has_role(auth.uid(), 'faculty'))
  )
);

CREATE POLICY "Students can view mcqs for approved cases"
ON public.mcqs FOR SELECT
USING (
  public.has_role(auth.uid(), 'student') AND
  EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = mcqs.case_id 
    AND cases.status = 'approved'
  )
);

CREATE POLICY "Faculty can manage mcqs"
ON public.mcqs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = mcqs.case_id 
    AND cases.created_by = auth.uid() 
    AND public.has_role(auth.uid(), 'faculty')
  )
);