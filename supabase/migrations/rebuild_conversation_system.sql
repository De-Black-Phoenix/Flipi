-- ============================================
-- REBUILD CONVERSATION SYSTEM
-- This migration ensures the conversation system
-- matches the exact requirements
-- ============================================

-- 1. Ensure conversations table has status field
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'));

-- 2. Update existing conversations to have status
UPDATE public.conversations
SET status = 'pending'
WHERE status IS NULL;

-- 3. Ensure unique constraint exists (one conversation per item per requester)
-- This should already exist, but we'll ensure it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversations_item_id_requester_id_key'
  ) THEN
    ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_item_id_requester_id_key 
    UNIQUE (item_id, requester_id);
  END IF;
END $$;

-- 4. Ensure messages table has proper structure (no receiver_id, allow NULL sender_id for system messages)
-- Verify messages table structure is correct
DO $$
BEGIN
  -- Check if receiver_id column exists and remove it if it does
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'receiver_id'
  ) THEN
    ALTER TABLE public.messages DROP COLUMN receiver_id;
  END IF;
  
  -- Allow NULL sender_id for system messages
  ALTER TABLE public.messages
  ALTER COLUMN sender_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Column might already allow NULL, ignore error
    NULL;
END $$;

-- 5. Create index for faster conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversations_item_id ON public.conversations(item_id);
CREATE INDEX IF NOT EXISTS idx_conversations_requester_id ON public.conversations(requester_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner_id ON public.conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);

-- 6. Create index for faster message lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- 7. Function to create system messages
CREATE OR REPLACE FUNCTION public.create_system_message(
  p_conversation_id UUID,
  p_content TEXT
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Insert system message with NULL sender_id (system messages have no sender)
  INSERT INTO public.messages (conversation_id, sender_id, content)
  VALUES (p_conversation_id, NULL, p_content)
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to handle item giving with system messages
CREATE OR REPLACE FUNCTION public.handle_item_given(
  p_item_id UUID,
  p_selected_conversation_id UUID,
  p_selected_requester_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_conversation RECORD;
BEGIN
  -- Update selected conversation
  UPDATE public.conversations
  SET status = 'accepted'
  WHERE id = p_selected_conversation_id;
  
  -- Insert system message for selected requester
  PERFORM public.create_system_message(
    p_selected_conversation_id,
    '🎉 Congratulations! The owner has selected you for this item.'
  );
  
  -- Update all other conversations to rejected and add system messages
  FOR v_conversation IN 
    SELECT id FROM public.conversations
    WHERE item_id = p_item_id
    AND id != p_selected_conversation_id
    AND status = 'pending'
  LOOP
    UPDATE public.conversations
    SET status = 'rejected'
    WHERE id = v_conversation.id;
    
    -- Insert system message for rejected requester
    PERFORM public.create_system_message(
      v_conversation.id,
      'This item has been given to someone else.'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Migration complete!
-- ============================================

