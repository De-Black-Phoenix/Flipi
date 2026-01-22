-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  region TEXT,
  town TEXT,
  user_type TEXT DEFAULT 'user' CHECK (user_type IN ('user', 'ngo_admin', 'platform_admin')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'platform_admin', 'ngo_admin')),
  points INTEGER DEFAULT 0,
  items_given INTEGER DEFAULT 0,
  campaign_items INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'Seed' CHECK (rank IN ('Seed', 'Helper', 'Giver', 'Hero', 'Champion', 'Guardian')),
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_responses JSONB,
  show_rank BOOLEAN DEFAULT true,
  show_items_given BOOLEAN DEFAULT true,
  request_notifications BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- NGOs
CREATE TABLE IF NOT EXISTS public.ngos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  admin_id UUID REFERENCES public.profiles(id) NOT NULL,
  region TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ngo_id UUID REFERENCES public.ngos(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  items_needed TEXT[],
  region TEXT NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Items
CREATE TABLE IF NOT EXISTS public.items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair')),
  images TEXT[] DEFAULT '{}',
  region TEXT NOT NULL,
  town TEXT NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'given')),
  selected_requester_id UUID REFERENCES public.profiles(id),
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Requests
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) NOT NULL,
  requester_id UUID REFERENCES public.profiles(id) NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(item_id, requester_id)
);

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) NOT NULL,
  requester_id UUID REFERENCES public.profiles(id) NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  owner_unread_count INTEGER DEFAULT 0,
  requester_unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(item_id, requester_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Donations (for Paystack transactions)
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  item_id UUID REFERENCES public.items(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'GHS',
  paystack_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- RLS Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Platform admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'platform_admin' OR profiles.user_type = 'platform_admin')
    )
  );

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- NGOs policies
CREATE POLICY "Everyone can view approved NGOs"
  ON public.ngos FOR SELECT
  USING (status = 'approved' OR auth.uid() = admin_id);

CREATE POLICY "NGO admins can create NGOs"
  ON public.ngos FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "NGO admins can update own NGO"
  ON public.ngos FOR UPDATE
  USING (auth.uid() = admin_id);

CREATE POLICY "Platform admins can approve NGOs"
  ON public.ngos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'platform_admin'
    )
  );

-- Campaigns policies
CREATE POLICY "Everyone can view campaigns"
  ON public.campaigns FOR SELECT
  USING (true);

CREATE POLICY "NGO admins can create campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ngos
      WHERE id = ngo_id AND admin_id = auth.uid()
    )
  );

CREATE POLICY "NGO admins can update own campaigns"
  ON public.campaigns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ngos
      WHERE id = ngo_id AND admin_id = auth.uid()
    )
  );

-- Items policies
CREATE POLICY "Everyone can view available items"
  ON public.items FOR SELECT
  USING (true);

CREATE POLICY "Users can create items"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own items"
  ON public.items FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Platform admins can update items"
  ON public.items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'platform_admin' OR profiles.user_type = 'platform_admin')
    )
  );

CREATE POLICY "Platform admins can update items"
  ON public.items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'platform_admin' OR profiles.user_type = 'platform_admin')
    )
  );

-- Requests policies
CREATE POLICY "Users can view requests for their items or their own requests"
  ON public.requests FOR SELECT
  USING (
    auth.uid() = requester_id OR
    EXISTS (
      SELECT 1 FROM public.items
      WHERE id = item_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create requests"
  ON public.requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Conversations policies
CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = requester_id);

CREATE POLICY "Conversations are created automatically via triggers"
  ON public.conversations FOR INSERT
  WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id AND (owner_id = auth.uid() OR requester_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id AND (owner_id = auth.uid() OR requester_id = auth.uid())
    )
  );

-- Donations policies
CREATE POLICY "Users can view own donations"
  ON public.donations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create donations"
  ON public.donations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Functions and Triggers

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create conversation when request is created
CREATE OR REPLACE FUNCTION public.handle_new_request()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
  v_conversation_id UUID;
BEGIN
  -- Get item owner
  SELECT owner_id INTO v_owner_id FROM public.items WHERE id = NEW.item_id;
  
  -- Create conversation
  INSERT INTO public.conversations (item_id, requester_id, owner_id)
  VALUES (NEW.item_id, NEW.requester_id, v_owner_id)
  ON CONFLICT (item_id, requester_id) DO NOTHING
  RETURNING id INTO v_conversation_id;
  
  -- Add initial message
  IF v_conversation_id IS NOT NULL THEN
    INSERT INTO public.messages (conversation_id, sender_id, content)
    VALUES (v_conversation_id, NEW.requester_id, NEW.message);
    
    -- Update unread count for owner
    UPDATE public.conversations
    SET owner_unread_count = owner_unread_count + 1
    WHERE id = v_conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new requests
DROP TRIGGER IF EXISTS on_request_created ON public.requests;
CREATE TRIGGER on_request_created
  AFTER INSERT ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_request();

-- Function to update unread counts
CREATE OR REPLACE FUNCTION public.update_unread_count()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
  v_requester_id UUID;
BEGIN
  SELECT owner_id, requester_id INTO v_owner_id, v_requester_id
  FROM public.conversations WHERE id = NEW.conversation_id;
  
  IF NEW.sender_id = v_owner_id THEN
    UPDATE public.conversations
    SET requester_unread_count = requester_unread_count + 1,
        last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
  ELSE
    UPDATE public.conversations
    SET owner_unread_count = owner_unread_count + 1,
        last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new messages
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_unread_count();

-- Function to update user rank based on points
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

-- Trigger for rank update
DROP TRIGGER IF EXISTS on_points_updated ON public.profiles;
CREATE TRIGGER on_points_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.points IS DISTINCT FROM NEW.points)
  EXECUTE FUNCTION public.update_user_rank();

-- Giver Reviews
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

-- Platform Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_settings
CREATE POLICY "Anyone can view platform settings"
  ON public.platform_settings FOR SELECT
  USING (true);

CREATE POLICY "Platform admins can update settings"
  ON public.platform_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'platform_admin' OR profiles.user_type = 'platform_admin')
    )
  );

CREATE POLICY "Platform admins can insert settings"
  ON public.platform_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'platform_admin' OR profiles.user_type = 'platform_admin')
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(key);

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

-- Social Features Tables
-- Item Likes
CREATE TABLE IF NOT EXISTS public.item_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(item_id, user_id)
);

ALTER TABLE public.item_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON public.item_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like items"
  ON public.item_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike items"
  ON public.item_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Saved Items
CREATE TABLE IF NOT EXISTS public.saved_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(item_id, user_id)
);

ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved items"
  ON public.saved_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save items"
  ON public.saved_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave items"
  ON public.saved_items FOR DELETE
  USING (auth.uid() = user_id);

-- Item Reports
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

ALTER TABLE public.item_reports ENABLE ROW LEVEL SECURITY;

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

-- Follows
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Indexes for social features
CREATE INDEX IF NOT EXISTS idx_item_likes_item_id ON public.item_likes(item_id);
CREATE INDEX IF NOT EXISTS idx_item_likes_user_id ON public.item_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON public.saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_item_id ON public.saved_items(item_id);
CREATE INDEX IF NOT EXISTS idx_item_reports_item_id ON public.item_reports(item_id);
CREATE INDEX IF NOT EXISTS idx_item_reports_reporter_id ON public.item_reports(reporter_id);

-- Reports (items + users)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'actioned');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT reports_target_required CHECK (
    reported_item_id IS NOT NULL OR reported_user_id IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS reports_unique_item_report
  ON public.reports (reporter_id, reported_item_id)
  WHERE reported_item_id IS NOT NULL;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports insert own"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reports select own"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Reports select admin"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'platform_admin' OR profiles.user_type = 'platform_admin')
    )
  );

CREATE POLICY "Reports update admin"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'platform_admin' OR profiles.user_type = 'platform_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'platform_admin' OR profiles.user_type = 'platform_admin')
    )
  );
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- Function to update like_count
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
