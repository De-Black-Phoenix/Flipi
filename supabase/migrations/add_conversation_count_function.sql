-- Function to get conversation count for an item (bypasses RLS)
-- This allows anyone to see the total number of requests for an item
CREATE OR REPLACE FUNCTION public.get_item_conversation_count(item_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.conversations
    WHERE item_id = item_uuid
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_item_conversation_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_item_conversation_count(UUID) TO anon;









