-- Update profiles table with new columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS items_given INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS campaign_items INTEGER DEFAULT 0;

-- Update rank check constraint to include new ranks
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_rank_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_rank_check 
CHECK (rank IN ('Seed', 'Helper', 'Giver', 'Hero', 'Champion', 'Guardian'));

-- Update default rank to 'Seed'
ALTER TABLE public.profiles
ALTER COLUMN rank SET DEFAULT 'Seed';

-- Update existing ranks to match new system (migrate old ranks)
UPDATE public.profiles
SET rank = CASE
  WHEN points >= 100 THEN 'Guardian'
  WHEN points >= 60 THEN 'Champion'
  WHEN points >= 30 THEN 'Hero'
  WHEN points >= 15 THEN 'Giver'
  WHEN points >= 5 THEN 'Helper'
  ELSE 'Seed'
END
WHERE rank IN ('Helper', 'Supporter', 'Champion');

-- Create or replace function to update user rank based on points
CREATE OR REPLACE FUNCTION public.update_user_rank()
RETURNS TRIGGER AS $$
BEGIN
  -- New rank tier system
  IF NEW.points >= 100 THEN
    NEW.rank := 'Guardian';
  ELSIF NEW.points >= 60 THEN
    NEW.rank := 'Champion';
  ELSIF NEW.points >= 30 THEN
    NEW.rank := 'Hero';
  ELSIF NEW.points >= 15 THEN
    NEW.rank := 'Giver';
  ELSIF NEW.points >= 5 THEN
    NEW.rank := 'Helper';
  ELSE
    NEW.rank := 'Seed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger for rank update
DROP TRIGGER IF EXISTS on_points_updated ON public.profiles;
CREATE TRIGGER on_points_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.points IS DISTINCT FROM NEW.points)
  EXECUTE FUNCTION public.update_user_rank();

-- Create giver_reviews table
CREATE TABLE IF NOT EXISTS public.giver_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  giver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  review_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on giver_reviews
ALTER TABLE public.giver_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for giver_reviews
CREATE POLICY "Anyone can view reviews"
  ON public.giver_reviews FOR SELECT
  USING (true);

CREATE POLICY "Receivers can create reviews"
  ON public.giver_reviews FOR INSERT
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Receivers can update their own reviews"
  ON public.giver_reviews FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "Receivers can delete their own reviews"
  ON public.giver_reviews FOR DELETE
  USING (auth.uid() = receiver_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_giver_reviews_giver_id ON public.giver_reviews(giver_id);
CREATE INDEX IF NOT EXISTS idx_giver_reviews_item_id ON public.giver_reviews(item_id);

-- Function to award points when item is given
CREATE OR REPLACE FUNCTION public.award_item_points(giver_user_id UUID, item_uuid UUID)
RETURNS void AS $$
DECLARE
  is_campaign_item BOOLEAN;
  item_owner_id UUID;
  item_status TEXT;
BEGIN
  -- Get item details
  SELECT owner_id, status, (campaign_id IS NOT NULL) 
  INTO item_owner_id, item_status, is_campaign_item
  FROM public.items
  WHERE id = item_uuid;
  
  -- Verify item exists, is owned by giver, and status is "given"
  IF item_owner_id IS NULL THEN
    RAISE EXCEPTION 'Item not found';
  END IF;
  
  IF item_owner_id != giver_user_id THEN
    RAISE EXCEPTION 'User does not own this item';
  END IF;
  
  IF item_status != 'given' THEN
    RAISE EXCEPTION 'Item must be marked as given first';
  END IF;
  
  -- Award points based on item type
  IF is_campaign_item THEN
    -- Campaign item: 5 points
    UPDATE public.profiles
    SET 
      campaign_items = campaign_items + 1,
      points = points + 5
    WHERE id = giver_user_id;
  ELSE
    -- Regular item: 1 point
    UPDATE public.profiles
    SET 
      items_given = items_given + 1,
      points = points + 1
    WHERE id = giver_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

