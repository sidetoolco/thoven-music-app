// Test script to verify authentication flow
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gswgawmeyifchjshbajd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2dhd21leWlmY2hqc2hiYWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg5NTksImV4cCI6MjA3Mjc0NDk1OX0.-F9QfL9gIWChxzATNojm_d56b-ExLao3rnCxVYa6W2U'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  console.log('🧪 Testing authentication flow...\n')
  
  // Test user credentials
  const testEmail = `test.parent.${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  
  console.log('1️⃣ Testing signup...')
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        first_name: 'Test',
        last_name: 'Parent',
        role: 'parent'
      }
    }
  })
  
  if (signUpError) {
    console.error('❌ Signup failed:', signUpError)
    return
  }
  
  console.log('✅ Signup successful:', signUpData.user?.id)
  
  // Wait for profile creation
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  console.log('\n2️⃣ Testing signin...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  })
  
  if (signInError) {
    console.error('❌ Signin failed:', signInError)
    return
  }
  
  console.log('✅ Signin successful:', signInData.user?.id)
  console.log('📍 Session:', signInData.session ? 'Active' : 'None')
  
  console.log('\n3️⃣ Checking profile...')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', signInData.user?.id)
    .single()
  
  if (profileError) {
    console.error('❌ Profile fetch failed:', profileError)
  } else {
    console.log('✅ Profile found:', {
      id: profile.id,
      email: profile.email,
      name: `${profile.first_name} ${profile.last_name}`,
      role: profile.role
    })
  }
  
  console.log('\n4️⃣ Testing session retrieval...')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('❌ Session retrieval failed:', sessionError)
  } else {
    console.log('✅ Session active:', session ? 'Yes' : 'No')
  }
  
  console.log('\n5️⃣ Cleaning up...')
  await supabase.auth.signOut()
  console.log('✅ Test complete!')
}

testAuth().catch(console.error)