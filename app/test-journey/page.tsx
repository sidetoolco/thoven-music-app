'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/supabase/auth-v2'
import { supabase } from '@/lib/supabase/client'

export default function TestJourneyPage() {
  const router = useRouter()
  const [results, setResults] = useState<string[]>([])
  const [currentTest, setCurrentTest] = useState('')

  const log = (message: string, isError = false) => {
    console.log(message)
    setResults(prev => [...prev, `${isError ? '❌' : '✅'} ${message}`])
  }

  const testParentJourney = async () => {
    setCurrentTest('Parent Journey')
    setResults([])
    
    try {
      // 1. Sign up as parent
      log('Testing parent signup...')
      const parentEmail = `parent${Date.now()}@test.com`
      const { error: signupError } = await authService.signUp({
        email: parentEmail,
        password: 'Test123!',
        first_name: 'Test',
        last_name: 'Parent',
        role: 'parent'
      })
      
      if (signupError) throw signupError
      log('Parent account created')
      
      // 2. Check session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session after signup')
      log('Session established')
      
      // 3. Check profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (!profile) throw new Error('Profile not created')
      log(`Profile created with role: ${profile.role}`)
      
      // 4. Search for teachers
      log('Searching for teachers...')
      const { data: teachers, error: searchError } = await supabase
        .from('teachers')
        .select(`
          *,
          profiles!inner(first_name, last_name, email)
        `)
        .eq('is_active', true)
        .limit(5)
      
      if (searchError) throw searchError
      log(`Found ${teachers?.length || 0} active teachers`)
      
      // 5. Test navigation
      log('Testing navigation to parent dashboard...')
      setTimeout(() => {
        router.push('/app/parent/dashboard')
      }, 2000)
      
    } catch (error: any) {
      log(`Error: ${error.message}`, true)
    }
  }

  const testTeacherJourney = async () => {
    setCurrentTest('Teacher Journey')
    setResults([])
    
    try {
      // 1. Sign up as teacher
      log('Testing teacher signup...')
      const teacherEmail = `teacher${Date.now()}@test.com`
      const { error: signupError, user } = await authService.signUp({
        email: teacherEmail,
        password: 'Test123!',
        first_name: 'Test',
        last_name: 'Teacher',
        role: 'teacher'
      })
      
      if (signupError) throw signupError
      log('Teacher account created')
      
      // 2. Check teacher record
      const { data: teacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', user?.id)
        .single()
      
      if (!teacher) {
        log('Creating teacher record...')
        const { error: createError } = await supabase
          .from('teachers')
          .insert({
            id: user?.id,
            bio: 'Test teacher bio',
            instruments: ['Piano', 'Guitar'],
            hourly_rate: 50,
            is_active: true,
            verified: true
          })
        
        if (createError) throw createError
      }
      log('Teacher record exists')
      
      // 3. Update teacher profile
      log('Updating teacher profile...')
      const { error: updateError } = await supabase
        .from('teachers')
        .update({
          bio: 'Experienced music teacher',
          instruments: ['Piano', 'Guitar', 'Violin'],
          specialties: ['Classical', 'Jazz'],
          hourly_rate: 75,
          years_experience: 5
        })
        .eq('id', user?.id)
      
      if (updateError) throw updateError
      log('Teacher profile updated')
      
      // 4. Test navigation
      log('Testing navigation to teacher dashboard...')
      setTimeout(() => {
        router.push('/app/teacher/dashboard')
      }, 2000)
      
    } catch (error: any) {
      log(`Error: ${error.message}`, true)
    }
  }

  const testFindTeacherFlow = async () => {
    setCurrentTest('Find Teacher Flow')
    setResults([])
    
    try {
      // 1. Ensure we have a session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        log('No active session, please login first', true)
        return
      }
      log('Session active')
      
      // 2. Navigate to find teachers
      log('Navigating to find teachers page...')
      router.push('/app/find-teachers')
      
    } catch (error: any) {
      log(`Error: ${error.message}`, true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">End-to-End Journey Test</h1>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={testParentJourney}
            className="bg-blue-500 text-white p-6 rounded-lg hover:bg-blue-600 transition"
          >
            <h2 className="text-xl font-semibold mb-2">Test Parent Journey</h2>
            <p className="text-sm opacity-90">Sign up → Find teachers → Book lesson</p>
          </button>
          
          <button
            onClick={testTeacherJourney}
            className="bg-green-500 text-white p-6 rounded-lg hover:bg-green-600 transition"
          >
            <h2 className="text-xl font-semibold mb-2">Test Teacher Journey</h2>
            <p className="text-sm opacity-90">Sign up → Create profile → Manage lessons</p>
          </button>
          
          <button
            onClick={testFindTeacherFlow}
            className="bg-purple-500 text-white p-6 rounded-lg hover:bg-purple-600 transition"
          >
            <h2 className="text-xl font-semibold mb-2">Test Find Teacher</h2>
            <p className="text-sm opacity-90">Search → View profile → Book</p>
          </button>
        </div>

        {currentTest && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Testing: {currentTest}</h2>
            <div className="space-y-2 font-mono text-sm">
              {results.map((result, i) => (
                <div 
                  key={i}
                  className={result.includes('❌') ? 'text-red-600' : 'text-green-600'}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold mb-2">Setup Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Run <code className="bg-yellow-200 px-1">supabase/COMPLETE-SETUP.sql</code> in Supabase SQL Editor</li>
            <li>Test each journey using the buttons above</li>
            <li>Check the console for detailed logs</li>
            <li>Verify you can access the dashboards after signup</li>
          </ol>
        </div>
      </div>
    </div>
  )
}