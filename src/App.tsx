import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from './lib/supabase'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'
import SchoolLinking from './components/SchoolLinking'
import Track from './components/Track'
import './index.css'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUserProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSchoolLinkingComplete = () => {
    if (user) {
      fetchUserProfile(user.id)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If user is not logged in, show landing page
  if (!user) {
    return (
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </div>
      </Router>
    )
  }

  // If user is logged in but doesn't have a school, show school linking
  if (user && userProfile && !userProfile.school_id) {
    return <SchoolLinking user={user} onComplete={handleSchoolLinkingComplete} />
  }

  // If user is logged in and has a school, show dashboard
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/" 
            element={<Dashboard user={user} />} 
          />
          <Route 
            path="/dashboard" 
            element={<Dashboard user={user} />} 
          />
          <Route
            path="/track"
            element={
              // Track is a standalone student page (no user prop needed here)
              // If you ever need user info inside Track, you can pass it.
              // For now it uses localStorage only.
              // Import added at the top: `import Track from './components/Track'`
              <Track />
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App