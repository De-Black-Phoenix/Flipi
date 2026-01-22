-- Allow platform admins to update items (moderation actions)
CREATE POLICY "Platform admins can update items"
  ON public.items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'platform_admin' OR profiles.user_type = 'platform_admin')
    )
  );
