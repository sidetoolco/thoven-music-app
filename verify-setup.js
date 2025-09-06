// Quick verification script to check if everything is set up correctly
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gswgawmeyifchjshbajd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2dhd21leWlmY2hqc2hiYWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg5NTksImV4cCI6MjA3Mjc0NDk1OX0.-F9QfL9gIWChxzATNojm_d56b-ExLao3rnCxVYa6W2U'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySetup() {
  console.log('🔍 Verifying Thoven App Setup...\n')
  
  let allGood = true
  
  try {
    // 1. Check profiles table
    console.log('1️⃣ Checking profiles table...')
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(5)
    
    if (profileError) {
      console.error('❌ Profiles table error:', profileError.message)
      allGood = false
    } else {
      console.log(`✅ Profiles table OK - Found ${profiles?.length || 0} profiles`)
    }
    
    // 2. Check teachers table with new columns
    console.log('\n2️⃣ Checking teachers table columns...')
    const { data: teachers, error: teacherError } = await supabase
      .from('teachers')
      .select('id, bio, instruments, specialties, profile_image_url, hourly_rate')
      .limit(5)
    
    if (teacherError) {
      console.error('❌ Teachers table error:', teacherError.message)
      allGood = false
    } else {
      console.log(`✅ Teachers table OK - Found ${teachers?.length || 0} teachers`)
      if (teachers && teachers.length > 0) {
        const hasNewColumns = teachers[0].bio !== undefined && 
                              teachers[0].instruments !== undefined
        console.log(`   New columns present: ${hasNewColumns ? '✅' : '❌'}`)
      }
    }
    
    // 3. Check active teachers for discovery
    console.log('\n3️⃣ Checking active teachers for discovery...')
    const { data: activeTeachers, error: activeError } = await supabase
      .from('teachers')
      .select(`
        id,
        bio,
        instruments,
        hourly_rate,
        profiles!inner(first_name, last_name, email)
      `)
      .eq('is_active', true)
      .limit(10)
    
    if (activeError) {
      console.error('❌ Active teachers query error:', activeError.message)
      allGood = false
    } else {
      console.log(`✅ Found ${activeTeachers?.length || 0} active teachers`)
      if (activeTeachers && activeTeachers.length > 0) {
        console.log('   Sample teacher:')
        const teacher = activeTeachers[0]
        console.log(`   - Name: ${teacher.profiles?.first_name} ${teacher.profiles?.last_name}`)
        console.log(`   - Instruments: ${teacher.instruments?.join(', ') || 'None'}`)
        console.log(`   - Rate: $${teacher.hourly_rate}/hour`)
      }
    }
    
    // 4. Test search function
    console.log('\n4️⃣ Testing teacher search function...')
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_teachers_by_instrument', { search_instrument: null })
    
    if (searchError) {
      console.error('❌ Search function error:', searchError.message)
      allGood = false
    } else {
      console.log(`✅ Search function works - Found ${searchResults?.length || 0} teachers`)
    }
    
    // 5. Check authentication
    console.log('\n5️⃣ Testing authentication...')
    const testEmail = `verify${Date.now()}@test.com`
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'Test123!',
      options: {
        data: {
          first_name: 'Verify',
          last_name: 'Test',
          role: 'parent'
        }
      }
    })
    
    if (authError) {
      console.error('❌ Auth signup error:', authError.message)
      allGood = false
    } else {
      console.log('✅ Authentication works')
      
      // Wait and check if profile was created
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user?.id)
        .single()
      
      if (newProfile) {
        console.log('✅ Profile auto-creation works')
      } else {
        console.log('⚠️  Profile not auto-created (trigger may need to be re-run)')
      }
      
      // Cleanup
      await supabase.auth.signOut()
    }
    
    // Summary
    console.log('\n' + '='.repeat(50))
    if (allGood) {
      console.log('✅ All checks passed! Your app is ready to use.')
      console.log('\nYou can now:')
      console.log('1. Visit http://localhost:3000 to use the app')
      console.log('2. Click "Find a Teacher" to sign up as a parent')
      console.log('3. Click "Become a Teacher" to apply as a teacher')
      console.log('4. Visit http://localhost:3000/test-journey for testing')
    } else {
      console.log('⚠️  Some issues were found. Please check the errors above.')
      console.log('\nTry running these SQL files in order:')
      console.log('1. supabase/FIX-TEACHERS-TABLE.sql')
      console.log('2. supabase/COMPLETE-SETUP.sql (if needed)')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

verifySetup().catch(console.error)