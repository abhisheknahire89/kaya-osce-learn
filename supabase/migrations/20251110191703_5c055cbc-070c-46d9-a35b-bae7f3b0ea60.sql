-- Add missing RLS policies for analytics_snapshots
CREATE POLICY "Faculty and admin can view analytics"
ON public.analytics_snapshots FOR SELECT
USING (
  public.has_role(auth.uid(), 'faculty') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Faculty and admin can manage analytics"
ON public.analytics_snapshots FOR ALL
USING (
  public.has_role(auth.uid(), 'faculty') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Fix the update_updated_at_column function to set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;