-- Add share_count to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- Create item_shares table
CREATE TABLE IF NOT EXISTS public.item_shares (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(item_id, user_id)
);

-- Enable RLS on item_shares
ALTER TABLE public.item_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for item_shares
CREATE POLICY "Anyone can view shares"
  ON public.item_shares FOR SELECT
  USING (true);

CREATE POLICY "Users can share items"
  ON public.item_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unshare items"
  ON public.item_shares FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_item_shares_item_id ON public.item_shares(item_id);
CREATE INDEX IF NOT EXISTS idx_item_shares_user_id ON public.item_shares(user_id);

-- Function to update share_count when shares are added/removed
CREATE OR REPLACE FUNCTION update_item_share_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.items
    SET share_count = COALESCE(share_count, 0) + 1
    WHERE id = NEW.item_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.items
    SET share_count = GREATEST(COALESCE(share_count, 0) - 1, 0)
    WHERE id = OLD.item_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update share_count
DROP TRIGGER IF EXISTS trigger_update_item_share_count ON public.item_shares;
CREATE TRIGGER trigger_update_item_share_count
  AFTER INSERT OR DELETE ON public.item_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_item_share_count();
