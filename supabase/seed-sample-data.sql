-- Sample data for testing the Thoven app
-- Run this after running database-functions.sql

-- First, create some test teacher accounts using auth.users
-- NOTE: You'll need to create these users through the Supabase dashboard or using the signup flow
-- since we can't directly insert into auth.users from SQL

-- Insert sample teacher profiles (assuming these auth users exist)
-- You can create them via the signup flow with these emails:
-- teacher1@example.com (password: Teacher123!)
-- teacher2@example.com (password: Teacher123!)
-- teacher3@example.com (password: Teacher123!)

-- If you have existing users, update their profiles to be teachers:
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find any existing users and make some of them teachers for testing
  FOR user_record IN 
    SELECT id, email 
    FROM profiles 
    WHERE role = 'teacher'
    LIMIT 3
  LOOP
    -- Check if teacher record exists
    IF NOT EXISTS (SELECT 1 FROM teachers WHERE id = user_record.id) THEN
      INSERT INTO teachers (
        id,
        bio,
        instruments,
        specialties,
        hourly_rate,
        years_experience,
        is_active,
        verified,
        profile_image_url
      ) VALUES (
        user_record.id,
        'Passionate music teacher with years of experience helping students achieve their musical goals.',
        ARRAY['Piano', 'Guitar']::text[],
        ARRAY['Classical', 'Jazz', 'Pop']::text[],
        75.00,
        5 + floor(random() * 10)::int,
        true,
        true,
        'https://api.dicebear.com/7.x/avataaars/svg?seed=' || user_record.id
      );
      
      RAISE NOTICE 'Created teacher record for %', user_record.email;
    END IF;
  END LOOP;
END $$;

-- Update existing teachers with more realistic data
UPDATE teachers SET
  bio = CASE 
    WHEN random() < 0.33 THEN 'Classically trained pianist with over 10 years of teaching experience. Specializing in helping beginners build a strong foundation.'
    WHEN random() < 0.66 THEN 'Professional guitarist and music educator. I love helping students discover their musical potential through personalized lessons.'
    ELSE 'Experienced music teacher passionate about nurturing young talent. My approach focuses on making learning fun and engaging.'
  END,
  instruments = CASE
    WHEN random() < 0.25 THEN ARRAY['Piano']::text[]
    WHEN random() < 0.5 THEN ARRAY['Guitar']::text[]
    WHEN random() < 0.75 THEN ARRAY['Piano', 'Keyboard']::text[]
    ELSE ARRAY['Guitar', 'Bass', 'Ukulele']::text[]
  END,
  specialties = CASE
    WHEN random() < 0.33 THEN ARRAY['Classical', 'Music Theory']::text[]
    WHEN random() < 0.66 THEN ARRAY['Rock', 'Blues', 'Jazz']::text[]
    ELSE ARRAY['Pop', 'Contemporary', 'Songwriting']::text[]
  END,
  hourly_rate = 50 + floor(random() * 100),
  years_experience = 2 + floor(random() * 15)::int
WHERE bio IS NULL OR bio = '';

-- Make sure all teachers are active and verified for testing
UPDATE teachers SET 
  is_active = true,
  verified = true
WHERE is_active IS NULL OR verified IS NULL;

-- Add some variety to teacher profiles
UPDATE profiles p
SET 
  first_name = CASE 
    WHEN random() < 0.2 THEN 'Sarah'
    WHEN random() < 0.4 THEN 'Michael'
    WHEN random() < 0.6 THEN 'Emma'
    WHEN random() < 0.8 THEN 'David'
    ELSE 'Lisa'
  END,
  last_name = CASE
    WHEN random() < 0.2 THEN 'Johnson'
    WHEN random() < 0.4 THEN 'Williams'
    WHEN random() < 0.6 THEN 'Brown'
    WHEN random() < 0.8 THEN 'Davis'
    ELSE 'Miller'
  END
WHERE p.id IN (SELECT id FROM teachers)
  AND (p.first_name = '' OR p.first_name IS NULL);

-- Display the sample teachers
SELECT 
  p.email,
  p.first_name || ' ' || p.last_name as full_name,
  t.instruments,
  t.hourly_rate,
  t.years_experience
FROM teachers t
JOIN profiles p ON t.id = p.id
WHERE t.is_active = true;