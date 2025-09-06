'use client'

import { useState } from 'react'
import { authService } from '@/lib/supabase/auth-v2'
import { useRouter } from 'next/navigation'

export default function TestAuthPage() {
  const router = useRouter()
  const [status, setStatus] = useState<string[]>([])
  const [email] = useState(`test${Date.now()}@example.com`)
  const [password] = useState('TestPassword123!')

  const addStatus = (msg: string) => {
    setStatus(prev => [...prev, msg])
    console.log(msg)
  }

  const testSignup = async () => {
    addStatus('Starting signup test...')
    
    const result = await authService.signUp({
      email,
      password,
      first_name: 'Test',
      last_name: 'User',
      role: 'parent'
    })

    if (result.error) {
      addStatus(`❌ Signup failed: ${result.error}`)
      return false
    }

    addStatus(`✅ Signup successful! User: ${result.user?.id}`)
    addStatus(`✅ Profile: ${result.profile ? 'Created' : 'Missing'}`)
    addStatus(`✅ Session: ${result.session ? 'Active' : 'None'}`)
    
    return true
  }

  const testSignin = async () => {
    addStatus('Starting signin test...')
    
    const result = await authService.signIn({
      email,
      password
    })

    if (result.error) {
      addStatus(`❌ Signin failed: ${result.error}`)
      return false
    }

    addStatus(`✅ Signin successful! User: ${result.user?.id}`)
    addStatus(`✅ Profile: ${result.profile ? 'Loaded' : 'Missing'}`)
    addStatus(`✅ Session: ${result.session ? 'Active' : 'None'}`)
    
    if (result.profile?.role === 'parent') {
      addStatus('Redirecting to parent dashboard...')
      setTimeout(() => router.push('/app/parent/dashboard'), 1000)
    }
    
    return true
  }

  const runFullTest = async () => {
    setStatus([])
    addStatus(`Testing with email: ${email}`)
    
    const signupSuccess = await testSignup()
    if (!signupSuccess) return
    
    addStatus('Waiting 2 seconds...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    await testSignin()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Credentials</h2>
          <p>Email: {email}</p>
          <p>Password: {password}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <button
            onClick={runFullTest}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Run Full Auth Test
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="font-mono text-sm space-y-1">
            {status.map((msg, i) => (
              <div key={i} className={msg.includes('❌') ? 'text-red-600' : msg.includes('✅') ? 'text-green-600' : ''}>
                {msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}