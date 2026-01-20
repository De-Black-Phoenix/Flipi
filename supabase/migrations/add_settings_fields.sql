-- Add privacy and notification settings to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_rank BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_items_given BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS request_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS message_notifications BOOLEAN DEFAULT true;







