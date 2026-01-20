-- Fix RLS policy for saved_items to allow counting
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own saved items" ON public.saved_items;

-- Create new policy that allows anyone to view (for counting purposes)
CREATE POLICY "Anyone can view saved items count"
  ON public.saved_items FOR SELECT
  USING (true);







