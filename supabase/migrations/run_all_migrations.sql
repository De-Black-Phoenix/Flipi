-- ============================================
-- FLIPI DATABASE MIGRATIONS
-- Run this file in your Supabase SQL Editor
-- ============================================

-- Migration 1: Add onboarding fields to profiles
-- (Safe to run even if already exists - uses IF NOT EXISTS)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_responses JSONB;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON public.profiles(onboarding_completed);

-- Migration 2: Add status field to conversations table
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Update existing conversations to have status
UPDATE public.conversations
SET status = 'pending'
WHERE status IS NULL;

-- ============================================
-- Migration complete!
-- ============================================

