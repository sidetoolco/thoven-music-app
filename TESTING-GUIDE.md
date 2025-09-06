# Thoven App - Testing Guide

## ✅ Setup Completed
You've successfully run the database setup scripts. Now let's test the complete user experience.

## 🎯 Quick Test URLs

1. **Main Website**: http://localhost:3000
2. **Test Journey Page**: http://localhost:3000/test-journey
3. **Auth Test Page**: http://localhost:3000/test-auth

## 🧪 Manual Testing Steps

### 1. Test Parent Journey
1. Go to http://localhost:3000
2. Click **"Find a Teacher"** button (pink button)
3. Sign up with:
   - Select "Find lessons for myself or my child"
   - Enter your details
   - Create account
4. You'll be redirected to `/app/parent/dashboard`
5. Click "Find a Teacher" to browse available teachers

### 2. Test Teacher Journey
1. Go to http://localhost:3000
2. Click **"Become a Teacher"** button (orange button)
3. Fill out the teacher application form
4. Or sign up directly with:
   - Select "Teach music lessons"
   - Enter your details
   - Create account
5. You'll be redirected to `/app/teacher/dashboard`

### 3. Create Sample Teachers (Manual Method)
Since email confirmation is disabled, you can create teachers directly:

1. **Sign up as a teacher** at http://localhost:3000
2. Use these sample details:
   ```
   Teacher 1:
   - Name: Sarah Johnson
   - Email: sarah.teacher@example.com
   - Role: Teacher
   - Password: Teacher123!
   
   Teacher 2:
   - Name: Mike Williams  
   - Email: mike.teacher@example.com
   - Role: Teacher
   - Password: Teacher123!
   ```

3. After signup, run this SQL in Supabase to make them discoverable:
   ```sql
   UPDATE teachers 
   SET 
     bio = 'Experienced music teacher passionate about helping students learn.',
     instruments = ARRAY['Piano', 'Guitar'],
     specialties = ARRAY['Classical', 'Jazz'],
     hourly_rate = 75,
     years_experience = 5,
     is_active = true,
     verified = true,
     profile_image_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id
   WHERE id IN (
     SELECT id FROM profiles WHERE role = 'teacher'
   );
   ```

## 🔍 Verify Everything Works

Run this command to check your setup:
```bash
node verify-setup.js
```

## 🎉 Features to Test

### For Parents:
- ✅ Sign up / Sign in
- ✅ Browse teacher profiles
- ✅ Search by instrument
- ✅ View teacher details
- ✅ Book lessons (coming soon)

### For Teachers:
- ✅ Sign up / Sign in  
- ✅ Create profile
- ✅ Set availability
- ✅ Manage students
- ✅ View bookings

## 🐛 Troubleshooting

### "Database error saving new user"
- This usually means email confirmation is still enabled
- Go to Supabase Dashboard → Authentication → Email Auth
- Disable "Confirm email"

### No teachers showing up
- Create teacher accounts manually through the UI
- Run the UPDATE SQL above to make them discoverable

### Can't access dashboard after login
- Check browser console for errors
- Verify session is created: `localStorage.getItem('supabase.auth.token')`
- Try refreshing the page

## 📝 Test Checklist

- [ ] Main page loads correctly
- [ ] "Find a Teacher" button opens signup modal
- [ ] "Become a Teacher" button opens application modal  
- [ ] Parent signup works → redirects to parent dashboard
- [ ] Teacher signup works → redirects to teacher dashboard
- [ ] Teachers appear in discovery page
- [ ] Search/filter functionality works
- [ ] Profile pages load correctly

## 🚀 Next Steps

Once testing is complete:
1. Deploy to Vercel (frontend)
2. Ensure Supabase environment variables are set in Vercel
3. Test production deployment
4. Add payment integration for booking lessons