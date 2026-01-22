-- Report status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'actioned');
  END IF;
END $$;

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_item_id uuid REFERENCES public.items(id) ON DELETE SET NULL,
  reported_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status report_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_target_required CHECK (
    reported_item_id IS NOT NULL OR reported_user_id IS NOT NULL
  )
);

-- Prevent duplicate item reports by same reporter
CREATE UNIQUE INDEX IF NOT EXISTS reports_unique_item_report
  ON public.reports (reporter_id, reported_item_id)
  WHERE reported_item_id IS NOT NULL;

-- RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports
CREATE POLICY "reports_insert_own"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can read their own reports
CREATE POLICY "reports_select_own"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Admins can read all reports
CREATE POLICY "reports_select_admin"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'platform_admin' OR p.user_type = 'platform_admin')
    )
  );

-- Admins can update report status
CREATE POLICY "reports_update_admin"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'platform_admin' OR p.user_type = 'platform_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'platform_admin' OR p.user_type = 'platform_admin')
    )
  );
