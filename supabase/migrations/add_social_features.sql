  -- Add like_count to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- Create item_likes table
CREATE TABLE IF NOT EXISTS public.item_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(item_id, user_id)
);

-- Enable RLS on item_likes
ALTER TABLE public.item_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for item_likes
CREATE POLICY "Anyone can view likes"
  ON public.item_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like items"
  ON public.item_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike items"
  ON public.item_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create saved_items table
CREATE TABLE IF NOT EXISTS public.saved_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(item_id, user_id)
);

-- Enable RLS on saved_items
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_items
CREATE POLICY "Anyone can view saved items count"
  ON public.saved_items FOR SELECT
  USING (true);

CREATE POLICY "Users can save items"
  ON public.saved_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave items"
  ON public.saved_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create item_reports table
CREATE TABLE IF NOT EXISTS public.item_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS on item_reports
ALTER TABLE public.item_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for item_reports
CREATE POLICY "Users can view their own reports"
  ON public.item_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON public.item_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'platform_admin' OR profiles.user_type = 'platform_admin')
    )
  );

CREATE POLICY "Users can report items"
  ON public.item_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS on follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows
CREATE POLICY "Anyone can view follows"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_item_likes_item_id ON public.item_likes(item_id);
CREATE INDEX IF NOT EXISTS idx_item_likes_user_id ON public.item_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON public.saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_item_id ON public.saved_items(item_id);
CREATE INDEX IF NOT EXISTS idx_item_reports_item_id ON public.item_reports(item_id);
CREATE INDEX IF NOT EXISTS idx_item_reports_reporter_id ON public.item_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- Function to update like_count when likes are added/removed
CREATE OR REPLACE FUNCTION update_item_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.items
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = NEW.item_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.items
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = OLD.item_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update like_count
DROP TRIGGER IF EXISTS trigger_update_item_like_count ON public.item_likes;
CREATE TRIGGER trigger_update_item_like_count
  AFTER INSERT OR DELETE ON public.item_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_item_like_count();

