import { useEffect, useMemo, useState } from 'react'
import { IoIosSwap } from 'react-icons/io'
import { supabase } from '../lib/supabase'
import Sidebar from './Sidebar'
import type { Group, GroupMember, UserProfile, UserRole } from '../lib/supabase'

// Teachers-only: list students (filter by group) and reassign student group
const ManageLists = () => {
  const [loading, setLoading] = useState(true)
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [students, setStudents] = useState<UserProfile[]>([])
  const [membershipByStudent, setMembershipByStudent] = useState<Record<string, string | null>>({})
  const [filterGroupId, setFilterGroupId] = useState<string>('') // empty = All groups
  const [swapRowStudentId, setSwapRowStudentId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Guard: only teachers can view
  const isTeacher = currentUser?.role === 'teacher' || currentUser?.is_admin === true

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        // Get current user
        const { data: userRes, error: userErr } = await supabase.auth.getUser()
        if (userErr) throw userErr
        const userId = userRes.user?.id
        if (!userId) throw new Error('Not authenticated')

        // Fetch profile
        const { data: profileRows, error: profileErr } = await supabase
          .from('users')
          .select('id,email,name,role,school_id,is_admin,created_at')
          .eq('id', userId)
          .limit(1)
        if (profileErr) throw profileErr
        const profile = (profileRows && profileRows[0]) as UserProfile | undefined
        if (!profile) throw new Error('User profile not found')
        setCurrentUser(profile)

        if (profile.role !== 'teacher' && !profile.is_admin) {
          setGroups([])
          setStudents([])
          setMembershipByStudent({})
          return
        }

        // Load groups for the teacher's school
        if (!profile.school_id) {
          setGroups([])
          setStudents([])
          setMembershipByStudent({})
          return
        }
        const { data: groupsData, error: groupsErr } = await supabase
          .from('groups')
          .select('id,name,school_id,teacher_id,created_at')
          .eq('school_id', profile.school_id)
          .order('name', { ascending: true })
        if (groupsErr) throw groupsErr
        const schoolGroupIds = (groupsData ?? []).map((g) => g.id)
        setGroups(groupsData ?? [])

        // Load students for the same school
        const { data: studentsData, error: studentsErr } = await supabase
          .from('users')
          .select('id,email,name,role,school_id,is_admin,created_at')
          .eq('role', 'student')
          .eq('school_id', profile.school_id)
          .order('name', { ascending: true })
        if (studentsErr) throw studentsErr
        setStudents(studentsData ?? [])

        // Load memberships for these students within school groups
        let map: Record<string, string | null> = {}
        if ((studentsData?.length ?? 0) > 0 && schoolGroupIds.length > 0) {
          const { data: memberships, error: memErr } = await supabase
            .from('group_members')
            .select('id,group_id,student_id,joined_at')
            .in('group_id', schoolGroupIds)
            .in('student_id', (studentsData ?? []).map((s: UserProfile) => s.id))
          if (memErr) throw memErr
          // Choose the most recent membership per student (or first available)
          const byStudent: Record<string, GroupMember[]> = {}
          const membershipRows = ((memberships ?? []) as unknown as GroupMember[])
          membershipRows.forEach((m: GroupMember) => {
            const sid = m.student_id
            byStudent[sid] = byStudent[sid] || []
            byStudent[sid].push(m)
          })
          Object.keys(byStudent).forEach((sid) => {
            const list = byStudent[sid]
            list.sort((a: GroupMember, b: GroupMember) => (a.joined_at > b.joined_at ? -1 : 1))
            map[sid] = list[0]?.group_id ?? null
          })
        }
        // Default to null (unassigned) for students without membership
        (studentsData ?? []).forEach((s) => {
          if (map[s.id] === undefined) map[s.id] = null
        })
        setMembershipByStudent(map)
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredStudents = useMemo(() => {
    if (!filterGroupId) return students
    return students.filter((s) => membershipByStudent[s.id] === filterGroupId)
  }, [students, membershipByStudent, filterGroupId])

  const handleReassign = async (studentId: string, newGroupId: string | '') => {
    if (!currentUser?.school_id) return
    try {
      setSavingStudentId(studentId)
      setError(null)

      // Find all groups of this school
      const schoolGroupIds = groups.map((g) => g.id)
      // Remove existing memberships for this student within the school
      if (schoolGroupIds.length > 0) {
        const { error: delErr } = await supabase
          .from('group_members')
          .delete()
          .in('group_id', schoolGroupIds)
          .eq('student_id', studentId)
        if (delErr) throw delErr
      }

      // Insert new membership if a group was selected
      if (newGroupId) {
        const { error: insErr } = await supabase
          .from('group_members')
          .insert([{ group_id: newGroupId, student_id: studentId, joined_at: new Date().toISOString() }])
        if (insErr) throw insErr
      }

      // Move existing sessions of the student in school groups to the new group
      if (schoolGroupIds.length > 0) {
        const { error: updErr } = await supabase
          .from('training_sessions')
          .update({ group_id: newGroupId || null })
          .eq('student_id', studentId)
          .in('group_id', schoolGroupIds)
        if (updErr) throw updErr
      }

      setMembershipByStudent((prev) => ({ ...prev, [studentId]: newGroupId || null }))
    } catch (err: any) {
      setError(err.message || 'Failed to reassign student')
    } finally {
      setSavingStudentId(null)
    }
  }

  if (loading) {
    return (
      <>
        <Sidebar role={(currentUser?.role ?? 'teacher') as UserRole} onOpenChange={setIsSidebarOpen} />
        <div className={`min-h-screen bg-gray-50 ${isSidebarOpen ? 'md:pl-72' : 'md:pl-0'}`}>
          <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-black">STEP</h1>
                  <span className="ml-4 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {currentUser?.role === 'teacher' ? 'Teacher' : 'Student'}
                  </span>
                  {currentUser?.is_admin && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Welcome, {currentUser?.name || currentUser?.email}</span>
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
          <div className="p-6">
            <div className="text-gray-700">Loading…</div>
          </div>
        </div>
      </>
    )
  }

  if (!isTeacher) {
    return (
      <>
        <Sidebar role={(currentUser?.role ?? 'teacher') as UserRole} onOpenChange={setIsSidebarOpen} />
        <div className={`min-h-screen bg-gray-50 ${isSidebarOpen ? 'md:pl-72' : 'md:pl-0'}`}>
          <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-black">STEP</h1>
                  <span className="ml-4 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {currentUser?.role === 'teacher' ? 'Teacher' : 'Student'}
                  </span>
                  {currentUser?.is_admin && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Welcome, {currentUser?.name || currentUser?.email}</span>
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
          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">
              This section is for teachers only.
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Sidebar role={(currentUser?.role ?? 'teacher') as UserRole} onOpenChange={setIsSidebarOpen} />
      <div className={`min-h-screen bg-gray-50 ${isSidebarOpen ? 'md:pl-72' : 'md:pl-0'}`}>
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-black">STEP</h1>
                <span className="ml-4 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {currentUser?.role === 'teacher' ? 'Teacher' : 'Student'}
                </span>
                {currentUser?.is_admin && (
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Admin
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {currentUser?.name || currentUser?.email}</span>
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
        <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Manage Students</h2>
        </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by group</label>
          <select
            value={filterGroupId}
            onChange={(e) => setFilterGroupId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
          >
            <option value="">All groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map((s) => {
              const currentGroupId = membershipByStudent[s.id] ?? null
              const currentGroupName = groups.find((g) => g.id === currentGroupId)?.name ?? 'Unassigned'
              return (
                <tr key={s.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="relative flex items-center gap-3">
                      {swapRowStudentId === s.id ? (
                        <select
                          value={currentGroupId ?? ''}
                          onChange={(e) => {
                            handleReassign(s.id, e.target.value)
                            setSwapRowStudentId(null)
                          }}
                          className={`w-56 px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 ring-green-500 border-green-500 bg-white text-gray-900 appearance-none`}
                        >
                          <option value="">Unassigned</option>
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                          {currentGroupName}
                        </span>
                      )}
                      <button
                        type="button"
                        title="Swap group"
                        aria-label="Swap group"
                        className={`inline-flex items-center justify-center h-9 w-9 rounded-md border ${swapRowStudentId === s.id ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-300 text-gray-600 bg-white'} hover:bg-gray-50 transition`}
                        onClick={() => setSwapRowStudentId((prev) => (prev === s.id ? null : s.id))}
                      >
                        <IoIosSwap size={18} />
                      </button>
                      {swapRowStudentId === s.id && (
                        <span className="text-xs text-green-700">Select a group to apply.</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {savingStudentId === s.id && (
                      <span className="inline-flex items-center text-gray-500">
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving…
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
            {filteredStudents.length === 0 && (
              <tr>
                <td className="px-6 py-4 text-sm text-gray-500" colSpan={4}>
                  No students found for the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </div>
      </div>
    </>
  )
}

export default ManageLists
