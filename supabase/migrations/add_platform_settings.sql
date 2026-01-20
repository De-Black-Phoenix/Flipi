-- Add role field to profiles table if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'platform_admin', 'ngo_admin'));

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can read
CREATE POLICY "Anyone can view platform settings"
  ON public.platform_settings FOR SELECT
  USING (true);

-- Only platform admins can update
CREATE POLICY "Platform admins can update settings"
  ON public.platform_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'platform_admin' OR profiles.user_type = 'platform_admin')
    )
  );

-- Only platform admins can insert
CREATE POLICY "Platform admins can insert settings"
  ON public.platform_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'platform_admin' OR profiles.user_type = 'platform_admin')
    )
  );

-- Seed default entries
INSERT INTO public.platform_settings (key, value) VALUES
  ('support_email', 'support@flipi.com'),
  ('support_phone', '+233 XX XXX XXXX'),
  ('about_us', 'Flipi is a friendly community platform where kindness flows. Give what you don''t need, find what you can''t afford.'),
  ('privacy_policy', 'Privacy Policy content will be managed here.'),
  ('terms_of_service', 'Terms of Service content will be managed here.'),
  ('instagram_link', ''),
  ('twitter_link', ''),
  ('tiktok_link', ''),
  ('website_link', '')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(key);

