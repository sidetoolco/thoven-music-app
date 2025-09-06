// Script to create sample teacher accounts for testing
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gswgawmeyifchjshbajd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2dhd21leWlmY2hqc2hiYWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg5NTksImV4cCI6MjA3Mjc0NDk1OX0.-F9QfL9gIWChxzATNojm_d56b-ExLao3rnCxVYa6W2U'

const supabase = createClient(supabaseUrl, supabaseKey)

const sampleTeachers = [
  {
    email: 'sarah.johnson@music.com',
    password: 'Teacher123!',
    first_name: 'Sarah',
    last_name: 'Johnson',
    bio: 'Classically trained pianist with over 10 years of teaching experience. I specialize in helping beginners build a strong foundation while making learning fun and engaging.',
    instruments: ['Piano', 'Keyboard'],
    specialties: ['Classical', 'Music Theory', 'Sight Reading'],
    hourly_rate: 75,
    years_experience: 10
  },
  {
    email: 'mike.williams@music.com',
    password: 'Teacher123!',
    first_name: 'Michael',
    last_name: 'Williams',
    bio: 'Professional guitarist and session musician. I teach rock, blues, and jazz guitar to students of all levels. My approach focuses on practical skills and real-world application.',
    instruments: ['Guitar', 'Bass', 'Ukulele'],
    specialties: ['Rock', 'Blues', 'Jazz', 'Improvisation'],
    hourly_rate: 65,
    years_experience: 8
  },
  {
    email: 'emma.davis@music.com',
    password: 'Teacher123!',
    first_name: 'Emma',
    last_name: 'Davis',
    bio: 'Violin instructor with a passion for classical and contemporary music. I help students develop proper technique while exploring their musical interests.',
    instruments: ['Violin', 'Viola'],
    specialties: ['Classical', 'Contemporary', 'Orchestra Preparation'],
    hourly_rate: 80,
    years_experience: 12
  }
]

async function createSampleTeachers() {
  console.log('🎵 Creating sample teacher accounts...\n')
  
  for (const teacher of sampleTeachers) {
    console.log(`Creating teacher: ${teacher.first_name} ${teacher.last_name}`)
    
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: teacher.email,
        password: teacher.password,
        options: {
          data: {
            first_name: teacher.first_name,
            last_name: teacher.last_name,
            role: 'teacher'
          }
        }
      })
      
      if (authError) {
        console.error(`  ❌ Auth error: ${authError.message}`)
        continue
      }
      
      console.log(`  ✅ Auth user created: ${authData.user?.id}`)
      
      // 2. Wait for profile to be created by trigger
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 3. Update teacher record with details
      const { error: teacherError } = await supabase
        .from('teachers')
        .upsert({
          id: authData.user?.id,
          bio: teacher.bio,
          instruments: teacher.instruments,
          specialties: teacher.specialties,
          hourly_rate: teacher.hourly_rate,
          years_experience: teacher.years_experience,
          is_active: true,
          verified: true,
          profile_image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.email}`
        })
      
      if (teacherError) {
        console.error(`  ❌ Teacher record error: ${teacherError.message}`)
      } else {
        console.log(`  ✅ Teacher profile updated`)
      }
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`)
    }
    
    // Small delay between creations
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // Verify teachers were created
  console.log('\n📊 Verifying teacher creation...')
  const { data: teachers, error } = await supabase
    .from('teachers')
    .select(`
      id,
      bio,
      instruments,
      hourly_rate,
      profiles!inner(first_name, last_name, email)
    `)
    .eq('is_active', true)
  
  if (error) {
    console.error('❌ Error fetching teachers:', error.message)
  } else {
    console.log(`\n✅ Successfully created ${teachers?.length || 0} active teachers:`)
    teachers?.forEach(t => {
      console.log(`   - ${t.profiles.first_name} ${t.profiles.last_name} (${t.profiles.email})`)
      console.log(`     Instruments: ${t.instruments?.join(', ')}`)
      console.log(`     Rate: $${t.hourly_rate}/hour`)
    })
  }
  
  console.log('\n🎉 Sample teachers created! You can now:')
  console.log('1. Go to http://localhost:3000')
  console.log('2. Sign up as a parent using "Find a Teacher"')
  console.log('3. Browse and book lessons with these teachers')
  console.log('\nTeacher login credentials:')
  sampleTeachers.forEach(t => {
    console.log(`   ${t.email} / ${t.password}`)
  })
}

createSampleTeachers().catch(console.error)