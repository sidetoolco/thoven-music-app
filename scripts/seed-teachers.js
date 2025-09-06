// Run this script with: node scripts/seed-teachers.js
// Make sure to install dotenv first: npm install dotenv

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // You'll need to add this to .env.local

if (!supabaseServiceKey) {
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file')
  console.error('You can find this in your Supabase dashboard under Settings > API')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const teachers = [
  {
    email: 'sarah.johnson@example.com',
    password: 'Teacher123!',
    first_name: 'Sarah',
    last_name: 'Johnson',
    city: 'New York',
    state: 'NY',
    bio: 'Experienced piano teacher with a passion for classical music and over 10 years of teaching experience.',
    teacher_data: {
      instruments_taught: ['Piano', 'Music Theory'],
      age_groups_taught: ['Children (5-12)', 'Teens (13-17)', 'Adults (18+)'],
      years_experience: 10,
      hourly_rate: 75,
      online_lessons: true,
      in_person_lessons: true,
      teaching_method: 'I focus on building strong fundamentals while keeping lessons engaging and fun.',
      introduction: 'I have been teaching piano for over 10 years and love helping students discover their musical potential.',
      verified: true
    }
  },
  {
    email: 'michael.chen@example.com',
    password: 'Teacher123!',
    first_name: 'Michael',
    last_name: 'Chen',
    city: 'Los Angeles',
    state: 'CA',
    bio: 'Guitar instructor specializing in rock, blues, and jazz with 8 years of teaching experience.',
    teacher_data: {
      instruments_taught: ['Guitar', 'Bass', 'Ukulele'],
      age_groups_taught: ['Teens (13-17)', 'Adults (18+)'],
      years_experience: 8,
      hourly_rate: 60,
      online_lessons: true,
      in_person_lessons: false,
      teaching_method: 'Learning by playing songs you love, covering technique, theory, and improvisation.',
      introduction: 'Rock, blues, and jazz guitarist helping students develop their own style.',
      verified: true
    }
  },
  {
    email: 'emily.rodriguez@example.com',
    password: 'Teacher123!',
    first_name: 'Emily',
    last_name: 'Rodriguez',
    city: 'Chicago',
    state: 'IL',
    bio: 'Professional violinist with the Chicago Symphony, teaching students of all ages for 15 years.',
    teacher_data: {
      instruments_taught: ['Violin', 'Viola'],
      age_groups_taught: ['Children (5-12)', 'Teens (13-17)', 'Adults (18+)'],
      years_experience: 15,
      hourly_rate: 85,
      online_lessons: true,
      in_person_lessons: true,
      teaching_method: 'Classical training with emphasis on proper posture and bow technique.',
      introduction: 'Professional violinist passionate about sharing the joy of string instruments.',
      verified: true
    }
  },
  {
    email: 'david.williams@example.com',
    password: 'Teacher123!',
    first_name: 'David',
    last_name: 'Williams',
    city: 'Austin',
    state: 'TX',
    bio: 'Professional drummer and percussionist with 12 years of teaching experience.',
    teacher_data: {
      instruments_taught: ['Drums', 'Percussion'],
      age_groups_taught: ['Children (5-12)', 'Teens (13-17)', 'Adults (18+)'],
      years_experience: 12,
      hourly_rate: 65,
      online_lessons: true,
      in_person_lessons: true,
      teaching_method: 'From basic beats to complex rhythms through technique and playing along to songs.',
      introduction: 'Specializing in rock, pop, and jazz drumming with focus on timing and expression.',
      verified: true
    }
  },
  {
    email: 'maria.gonzalez@example.com',
    password: 'Teacher123!',
    first_name: 'Maria',
    last_name: 'Gonzalez',
    city: 'Miami',
    state: 'FL',
    bio: 'Vocal coach specializing in contemporary styles with 7 years of teaching experience.',
    teacher_data: {
      instruments_taught: ['Voice', 'Music Theory'],
      age_groups_taught: ['Teens (13-17)', 'Adults (18+)'],
      years_experience: 7,
      hourly_rate: 70,
      online_lessons: true,
      in_person_lessons: true,
      teaching_method: 'Healthy vocal technique, breath support, and performance confidence.',
      introduction: 'Professional vocalist helping students find their unique voice.',
      verified: false
    }
  },
  {
    email: 'james.taylor@example.com',
    password: 'Teacher123!',
    first_name: 'James',
    last_name: 'Taylor',
    city: 'Boston',
    state: 'MA',
    bio: 'Jazz saxophonist with 20 years of performance and teaching experience.',
    teacher_data: {
      instruments_taught: ['Saxophone', 'Clarinet', 'Flute'],
      age_groups_taught: ['Teens (13-17)', 'Adults (18+)'],
      years_experience: 20,
      hourly_rate: 90,
      online_lessons: true,
      in_person_lessons: true,
      teaching_method: 'Jazz improvisation, classical technique, and music theory integrated.',
      introduction: 'Berklee College of Music graduate exploring the world of woodwinds.',
      verified: true
    }
  }
]

async function seedTeachers() {
  console.log('Starting to seed teachers...')

  for (const teacher of teachers) {
    try {
      // 1. Create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: teacher.email,
        password: teacher.password,
        email_confirm: true,
        user_metadata: {
          first_name: teacher.first_name,
          last_name: teacher.last_name,
          role: 'teacher'
        }
      })

      if (authError) {
        console.error(`Error creating auth user for ${teacher.email}:`, authError)
        continue
      }

      console.log(`✓ Created auth user: ${teacher.email}`)

      // 2. Update the profile with additional information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          city: teacher.city,
          state: teacher.state,
          bio: teacher.bio
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.error(`Error updating profile for ${teacher.email}:`, profileError)
      } else {
        console.log(`✓ Updated profile for: ${teacher.email}`)
      }

      // 3. Create the teacher record
      const { error: teacherError } = await supabase
        .from('teachers')
        .upsert({
          id: authData.user.id,
          instruments_taught: teacher.teacher_data.instruments_taught,
          age_groups_taught: teacher.teacher_data.age_groups_taught,
          years_experience: teacher.teacher_data.years_experience,
          hourly_rate: teacher.teacher_data.hourly_rate,
          online_lessons: teacher.teacher_data.online_lessons,
          in_person_lessons: teacher.teacher_data.in_person_lessons,
          teaching_method: teacher.teacher_data.teaching_method,
          introduction: teacher.teacher_data.introduction,
          is_active: true,
          verified: teacher.teacher_data.verified
        })

      if (teacherError) {
        console.error(`Error creating teacher record for ${teacher.email}:`, teacherError)
      } else {
        console.log(`✓ Created teacher record for: ${teacher.email}`)
      }

      console.log(`✅ Successfully seeded teacher: ${teacher.first_name} ${teacher.last_name}\n`)

    } catch (error) {
      console.error(`Failed to seed teacher ${teacher.email}:`, error)
    }
  }

  console.log('\n🎉 Teacher seeding complete!')
  console.log('Teachers can now log in with their email and password: Teacher123!')
}

seedTeachers().catch(console.error)