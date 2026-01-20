-- Add read fields to conversations table for notification tracking
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS is_read_by_owner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_read_by_requester BOOLEAN DEFAULT false;

-- Create index for faster unread queries
CREATE INDEX IF NOT EXISTS idx_conversations_owner_unread ON public.conversations(owner_id, is_read_by_owner) WHERE is_read_by_owner = false;
CREATE INDEX IF NOT EXISTS idx_conversations_requester_unread ON public.conversations(requester_id, is_read_by_requester) WHERE is_read_by_requester = false;













