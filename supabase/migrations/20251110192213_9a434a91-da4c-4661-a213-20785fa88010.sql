-- Add policy to allow users to insert their own role during signup
CREATE POLICY "Users can insert own role during signup"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Also allow users to insert their own profile during signup
CREATE POLICY "Users can insert own profile during signup"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);