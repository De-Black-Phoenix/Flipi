-- Add status field to conversations table
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Update existing conversations to have status
UPDATE public.conversations
SET status = 'pending'
WHERE status IS NULL;

