-- ============================================
-- COMPLETE SUPABASE SETUP FOR THOVEN APP
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- STEP 1: Fix the authentication trigger
-- ----------------------------------------
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_for_user();

-- Create function to automatically create profile
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

-- Create trigger for new user signups
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
-- Function to get teacher details
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
    t.bio,
    t.instruments,
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

-- Function to search teachers
CREATE OR REPLACE FUNCTION search_teachers_by_instrument(search_instrument TEXT)
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
    t.bio,
    t.instruments,
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
      OR search_instrument = ANY(t.instruments)
      OR LOWER(search_instrument) = ANY(SELECT LOWER(unnest(t.instruments)))
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

-- STEP 4: Create sample teachers for testing
-- ------------------------------------------
-- Update any existing teacher records with sample data
UPDATE teachers SET
  bio = CASE 
    WHEN bio IS NULL OR bio = '' THEN 'Experienced music teacher passionate about helping students achieve their musical goals.'
    ELSE bio
  END,
  instruments = CASE
    WHEN instruments IS NULL OR array_length(instruments, 1) IS NULL THEN ARRAY['Piano', 'Guitar']::text[]
    ELSE instruments
  END,
  specialties = CASE
    WHEN specialties IS NULL OR array_length(specialties, 1) IS NULL THEN ARRAY['Classical', 'Contemporary']::text[]
    ELSE specialties
  END,
  hourly_rate = CASE
    WHEN hourly_rate IS NULL THEN 75.00
    ELSE hourly_rate
  END,
  years_experience = CASE
    WHEN years_experience IS NULL THEN 5
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

-- STEP 5: Verify the setup
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
  t.instruments,
  t.hourly_rate,
  t.is_active,
  t.verified
FROM teachers t
JOIN profiles p ON t.id = p.id
ORDER BY t.created_at DESC
LIMIT 10;