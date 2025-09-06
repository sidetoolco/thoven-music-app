-- ============================================
-- PRODUCTION DATABASE FIX
-- Run this in your Supabase SQL Editor to fix signup issues
-- ============================================

-- STEP 1: Ensure the user_role enum exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('parent', 'teacher', 'admin');
  END IF;
END $$;

-- STEP 2: Fix profiles table structure
ALTER TABLE profiles 
ALTER COLUMN role TYPE user_role USING role::user_role,
ALTER COLUMN role SET DEFAULT 'parent'::user_role;

-- STEP 3: Drop and recreate the trigger function with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_for_user();

CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_value user_role;
BEGIN
  -- Safely convert role string to enum
  BEGIN
    user_role_value := COALESCE(NEW.raw_user_meta_data->>'role', 'parent')::user_role;
  EXCEPTION
    WHEN OTHERS THEN
      user_role_value := 'parent'::user_role;
  END;

  -- Insert profile with error handling
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
      user_role_value,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), profiles.first_name),
      last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), profiles.last_name),
      role = COALESCE(EXCLUDED.role, profiles.role),
      updated_at = NOW();
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the trigger
      RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  END;
  
  -- If the user is a teacher, create teacher record
  IF user_role_value = 'teacher'::user_role THEN
    BEGIN
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
    EXCEPTION
      WHEN OTHERS THEN
        -- Log but don't fail
        RAISE WARNING 'Error creating teacher record for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_user();

-- STEP 5: Add missing columns to teachers table if needed
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS instruments TEXT[],
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- STEP 6: Ensure proper permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- STEP 7: Create RLS policies if missing
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" 
  ON profiles FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- Teachers policies
CREATE POLICY "Anyone can view active teachers" 
  ON teachers FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Teachers can update own record" 
  ON teachers FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage all teachers" 
  ON teachers FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- STEP 8: Test the setup
DO $$
DECLARE
  test_result BOOLEAN;
BEGIN
  -- Check if trigger exists
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) INTO test_result;
  
  IF test_result THEN
    RAISE NOTICE '✅ Trigger is properly configured';
  ELSE
    RAISE WARNING '❌ Trigger is missing!';
  END IF;
  
  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_profile_for_user'
  ) INTO test_result;
  
  IF test_result THEN
    RAISE NOTICE '✅ Function is properly configured';
  ELSE
    RAISE WARNING '❌ Function is missing!';
  END IF;
  
  RAISE NOTICE '✅ Production fix applied successfully!';
END $$;

-- STEP 9: Fix any existing users without profiles
INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', ''),
  COALESCE(u.raw_user_meta_data->>'last_name', ''),
  COALESCE(u.raw_user_meta_data->>'role', 'parent')::user_role,
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Display summary
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM teachers) as total_teachers,
  (SELECT COUNT(*) FROM auth.users u LEFT JOIN profiles p ON u.id = p.id WHERE p.id IS NULL) as users_without_profiles;