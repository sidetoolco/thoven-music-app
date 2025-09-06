-- ============================================
-- FIX TEACHERS TABLE - Add missing columns
-- Run this FIRST before COMPLETE-SETUP.sql
-- ============================================

-- Add missing columns to teachers table if they don't exist
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS instruments TEXT[],
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Migrate existing data from old column names to new ones
UPDATE teachers SET
  instruments = COALESCE(instruments, instruments_taught),
  bio = COALESCE(bio, introduction)
WHERE instruments IS NULL OR bio IS NULL;

-- Now run the complete setup
-- ============================================
-- COMPLETE SUPABASE SETUP FOR THOVEN APP
-- ============================================

-- STEP 1: Fix the authentication trigger
-- ----------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_for_user();

CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent')::user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();
  
  -- If the user is a teacher, also create a teacher record
  IF NEW.raw_user_meta_data->>'role' = 'teacher' THEN
    INSERT INTO public.teachers (
      id,
      is_active,
      verified,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      true,
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_user();

-- Fix any existing users without profiles
INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', ''),
  COALESCE(u.raw_user_meta_data->>'last_name', ''),
  COALESCE(u.raw_user_meta_data->>'role', 'parent')::user_role,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- STEP 2: Create database functions
-- ----------------------------------
CREATE OR REPLACE FUNCTION get_teacher_details(teacher_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  bio TEXT,
  instruments TEXT[],
  specialties TEXT[],
  hourly_rate DECIMAL,
  is_active BOOLEAN,
  verified BOOLEAN,
  years_experience INTEGER,
  profile_image_url TEXT,
  total_students BIGINT,
  total_lessons BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    p.email,
    p.first_name,
    p.last_name,
    COALESCE(t.bio, t.introduction) as bio,
    COALESCE(t.instruments, t.instruments_taught) as instruments,
    t.specialties,
    t.hourly_rate,
    t.is_active,
    t.verified,
    t.years_experience,
    t.profile_image_url,
    (SELECT COUNT(*) FROM students s WHERE s.teacher_id = t.id) as total_students,
    (SELECT COUNT(*) FROM bookings b WHERE b.teacher_id = t.id) as total_lessons
  FROM teachers t
  JOIN profiles p ON t.id = p.id
  WHERE t.id = teacher_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_teachers_by_instrument(search_instrument TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  bio TEXT,
  instruments TEXT[],
  specialties TEXT[],
  hourly_rate DECIMAL,
  years_experience INTEGER,
  profile_image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    p.email,
    p.first_name,
    p.last_name,
    COALESCE(t.bio, t.introduction) as bio,
    COALESCE(t.instruments, t.instruments_taught) as instruments,
    t.specialties,
    t.hourly_rate,
    t.years_experience,
    t.profile_image_url
  FROM teachers t
  JOIN profiles p ON t.id = p.id
  WHERE t.is_active = true
    AND (
      search_instrument IS NULL 
      OR search_instrument = '' 
      OR search_instrument = ANY(COALESCE(t.instruments, t.instruments_taught))
      OR LOWER(search_instrument) = ANY(SELECT LOWER(unnest(COALESCE(t.instruments, t.instruments_taught))))
    )
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Grant permissions
-- -------------------------
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- STEP 4: Update teacher data for testing
-- ----------------------------------------
UPDATE teachers SET
  bio = CASE 
    WHEN bio IS NULL OR bio = '' THEN COALESCE(introduction, 'Experienced music teacher passionate about helping students achieve their musical goals.')
    ELSE bio
  END,
  instruments = CASE
    WHEN instruments IS NULL OR array_length(instruments, 1) IS NULL 
    THEN COALESCE(instruments_taught, ARRAY['Piano', 'Guitar']::text[])
    ELSE instruments
  END,
  specialties = CASE
    WHEN specialties IS NULL OR array_length(specialties, 1) IS NULL 
    THEN ARRAY['Classical', 'Contemporary']::text[]
    ELSE specialties
  END,
  hourly_rate = CASE
    WHEN hourly_rate IS NULL THEN 75.00
    ELSE hourly_rate
  END,
  years_experience = CASE
    WHEN years_experience IS NULL OR years_experience = 0 THEN 5
    ELSE years_experience
  END,
  is_active = COALESCE(is_active, true),
  verified = COALESCE(verified, true),
  profile_image_url = CASE
    WHEN profile_image_url IS NULL OR profile_image_url = '' 
    THEN 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id::text
    ELSE profile_image_url
  END
WHERE EXISTS (SELECT 1 FROM profiles WHERE profiles.id = teachers.id);

-- STEP 5: Create some sample teachers if none exist
-- --------------------------------------------------
DO $$
DECLARE
  teacher_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO teacher_count FROM teachers WHERE is_active = true;
  
  IF teacher_count = 0 THEN
    RAISE NOTICE 'No active teachers found. Please create teacher accounts through the signup flow.';
  ELSE
    RAISE NOTICE 'Found % active teachers', teacher_count;
  END IF;
END $$;

-- STEP 6: Verify the setup
-- ------------------------
DO $$
DECLARE
  user_count INTEGER;
  profile_count INTEGER;
  teacher_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO teacher_count FROM public.teachers;
  
  RAISE NOTICE '✅ Setup Complete!';
  RAISE NOTICE '   - Users: %', user_count;
  RAISE NOTICE '   - Profiles: %', profile_count;
  RAISE NOTICE '   - Teachers: %', teacher_count;
  
  IF user_count > profile_count THEN
    RAISE WARNING '⚠️  Some users do not have profiles. Run this script again.';
  END IF;
END $$;

-- Display active teachers
SELECT 
  p.email,
  p.first_name || ' ' || p.last_name as full_name,
  COALESCE(t.instruments, t.instruments_taught) as instruments,
  t.hourly_rate,
  t.is_active,
  t.verified
FROM teachers t
JOIN profiles p ON t.id = p.id
WHERE t.is_active = true
ORDER BY t.created_at DESC
LIMIT 10;