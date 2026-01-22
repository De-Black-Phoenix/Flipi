-- Add suspension flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

-- Allow platform admins to update profiles (suspension)
CREATE POLICY "Platform admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'platform_admin' OR profiles.user_type = 'platform_admin')
    )
  );
