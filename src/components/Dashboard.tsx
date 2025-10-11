import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../lib/supabase'
import Sidebar from './Sidebar'

interface DashboardProps {
  user: User
}

function Dashboard({ user }: DashboardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <Sidebar role={profile?.role ?? 'student'} onOpenChange={setIsSidebarOpen} />
      <div className={`min-h-screen bg-gray-50 ${isSidebarOpen ? 'md:pl-72' : 'md:pl-0'}`}>
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">EduTracker</h1>
                <span className="ml-4 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {profile?.role === 'teacher' ? 'Teacher' : 'Student'}
                </span>
                {profile?.is_admin && (
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Admin
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {profile?.name || user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                  Welcome to your Dashboard!
                </h2>
                
                {profile?.role === 'teacher' ? (
                  <div className="space-y-4">
                    <p className="text-lg text-gray-600">
                      As a teacher, you can manage your students' exercise progress and create workout plans.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Students</h3>
                        <p className="text-3xl font-bold text-blue-600">0</p>
                        <p className="text-sm text-gray-500">Total students</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Workouts</h3>
                        <p className="text-3xl font-bold text-green-600">0</p>
                        <p className="text-sm text-gray-500">Created workouts</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Progress</h3>
                        <p className="text-3xl font-bold text-purple-600">0%</p>
                        <p className="text-sm text-gray-500">Average completion</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-lg text-gray-600">
                      As a student, you can track your exercise progress and view assignments from your teachers.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Exercises</h3>
                        <p className="text-3xl font-bold text-blue-600">0</p>
                        <p className="text-sm text-gray-500">Completed today</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Streak</h3>
                        <p className="text-3xl font-bold text-green-600">0</p>
                        <p className="text-sm text-gray-500">Days in a row</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Goals</h3>
                        <p className="text-3xl font-bold text-purple-600">0</p>
                        <p className="text-sm text-gray-500">Goals achieved</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-lg font-medium">
                    {profile?.role === 'teacher' ? 'Create New Workout' : 'Start Exercise'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export default Dashboard