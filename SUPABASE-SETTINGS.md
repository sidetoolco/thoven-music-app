# Supabase Configuration Checklist

## ⚠️ CRITICAL: Fix "Database error saving new user"

### 1. Disable Email Confirmation (MOST IMPORTANT)
1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Click on **Email** provider
3. **DISABLE** "Confirm email" toggle
4. **DISABLE** "Secure email change" toggle
5. Click **Save**

### 2. Run the Production Fix SQL
1. Go to **SQL Editor** in Supabase
2. Copy and paste the contents of `supabase/PRODUCTION-FIX.sql`
3. Click **Run**
4. Check for any errors in the output

### 3. Verify Authentication Settings
1. Go to **Authentication** → **URL Configuration**
2. Ensure these URLs are set:
   - Site URL: `https://thoven-music-app-two.vercel.app` (or your production URL)
   - Redirect URLs: Add both:
     - `https://thoven-music-app-two.vercel.app/*`
     - `http://localhost:3000/*`

### 4. Check Rate Limits
1. Go to **Authentication** → **Rate Limits**
2. Ensure these are reasonable:
   - Email sending: At least 10 per hour
   - User signups: At least 100 per hour

### 5. Verify Environment Variables in Vercel
1. Go to your **Vercel Dashboard**
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Ensure these are set:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://gswgawmeyifchjshbajd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 6. Test Signup Flow
After making these changes:
1. Go to your production site
2. Click "Find a Teacher" to sign up as a parent
3. Fill in the form and submit
4. You should be redirected to `/app/parent/dashboard`

## 🔍 Debugging Tips

### If signup still fails:
1. **Check browser console** for specific error messages
2. **Check Supabase logs**:
   - Go to **Logs** → **Auth**
   - Look for failed signup attempts
3. **Verify the trigger is working**:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

### Common Issues and Solutions:

| Error | Solution |
|-------|----------|
| "Database error saving new user" | Email confirmation is enabled - disable it |
| "User already registered" | Email already exists - try different email |
| "Invalid email or password" | Check password requirements (min 6 chars) |
| Profile not created | Run PRODUCTION-FIX.sql to fix trigger |

## ✅ Success Indicators
- Users can sign up without email confirmation
- After signup, users are automatically logged in
- Profiles are created automatically
- Users are redirected to correct dashboard based on role

## 📝 Quick SQL Checks

Run these in SQL Editor to verify setup:

```sql
-- Check if trigger exists
SELECT EXISTS (
  SELECT 1 FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created'
);

-- Check recent signups
SELECT 
  u.email,
  u.created_at,
  p.role,
  CASE WHEN p.id IS NULL THEN 'Missing Profile!' ELSE 'OK' END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- Check if any users are missing profiles
SELECT COUNT(*) as users_without_profiles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;
```