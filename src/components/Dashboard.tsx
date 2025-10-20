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
  const [deleting, setDeleting] = useState(false)

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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'This will permanently delete your account and related data. This action cannot be undone. Do you want to continue?'
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      // Delete data depending on role
      if (profile?.role === 'student') {
        // Student-owned data
        await supabase.from('training_sessions').delete().eq('student_id', user.id)
        await supabase.from('group_members').delete().eq('student_id', user.id)
      } else if (profile?.role === 'teacher') {
        // Teacher-owned groups and related data
        const { data: teacherGroups, error: groupsErr } = await supabase
          .from('groups')
          .select('id')
          .eq('teacher_id', user.id)

        if (groupsErr) throw groupsErr
        const groupIds = (teacherGroups ?? []).map((g) => g.id)

        if (groupIds.length > 0) {
          await supabase.from('group_members').delete().in('group_id', groupIds)
          await supabase.from('training_sessions').delete().in('group_id', groupIds)
          await supabase.from('groups').delete().in('id', groupIds)
        }
      }

      // Delete app profile row
      const { error: userDeleteErr } = await supabase.from('users').delete().eq('id', user.id)
      if (userDeleteErr) throw userDeleteErr

      // Sign out from auth (note: deleting the Auth user requires a server-side service role)
      await supabase.auth.signOut()
    } catch (err: any) {
      console.error('Error deleting account:', err)
      alert('Failed to delete your account. Please try again or contact support.')
    } finally {
      setDeleting(false)
    }
  }

  // Estado para el despliegue de la Danger Zone
  const [dangerOpen, setDangerOpen] = useState(false)

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
                <h1 className="text-2xl font-bold text-black">STEP</h1>
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
                {/* Removed Delete Account from header */}
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
                  Welcome {profile?.name || user.email}!
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone at bottom */}
            <div className="mt-8">
              <div className="border border-red-300 bg-red-50 rounded-md">
                <button
                  type="button"
                  onClick={() => setDangerOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  aria-expanded={dangerOpen}
                  aria-controls="danger-content"
                >
                  <span className="text-lg font-semibold text-red-700">Danger Zone</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 text-red-700"
                  >
                    {dangerOpen ? (
                      // Chevron up
                      <path d="M6.293 14.707a1 1 0 0 0 1.414 0L12 10.414l4.293 4.293a1 1 0 0 0 1.414-1.414l-5-5a1 1 0 0 0-1.414 0l-5 5a1 1 0 0 0 0 1.414z" />
                    ) : (
                      // Chevron down
                      <path d="M6.293 9.293a1 1 0 0 1 1.414 0L12 13.586l4.293-4.293a1 1 0 0 1 1.414 1.414l-5 5a1 1 0 0 1-1.414 0l-5-5a1 1 0 0 1 0-1.414z" />
                    )}
                  </svg>
                </button>

                <div id="danger-content" className={`${dangerOpen ? 'block' : 'hidden'} px-4 pb-4`}>
                  <p className="text-sm text-red-700 mt-1">
                    Permanently delete your account and all related data. This action cannot be undone.
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className={`px-4 py-2 rounded-md text-sm font-medium
                        ${deleting
                          ? 'bg-red-100 text-red-500 border border-red-300 cursor-not-allowed'
                          : 'border border-red-600 text-red-600 hover:bg-red-50'
                        }`}
                      aria-label="Delete account"
                      title="Delete account and all related data"
                    >
                      {deleting ? 'Deleting…' : 'Delete Account'}
                    </button>
                  </div>
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