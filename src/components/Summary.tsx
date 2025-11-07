import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import Sidebar from './Sidebar'
import { supabase, type UserRole } from '../lib/supabase'

type Student = { id: string; name: string | null; email: string }
// ... existing code ...
// Minimal session shape used for teacher aggregation (all-time totals)
type MinimalSession = {
  student_id: string
  duration: number
  intensity: number
  date: string
  activity_type: string
}
// ... existing code ...
export default function Summary({ user }: { user: User }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [profileName, setProfileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Teacher data
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<MinimalSession[]>([])

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single()
      setProfileName(data?.name ?? null)
    }
    loadProfile()
  }, [user.id])

  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('groups')
        .select('id,name')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })
      if (!error && data) {
        setGroups(data)
        if (!selectedGroupId && data.length > 0) {
          setSelectedGroupId(data[0].id)
        }
      }
      setLoading(false)
    }
    loadGroups()
  }, [user.id])
  // ... existing code ...
  useEffect(() => {
    const loadGroupDetails = async () => {
      if (!selectedGroupId) return
      setLoading(true)

      // Members → student IDs
      const { data: memberRows, error: membersError } = await supabase
        .from('group_members')
        .select('student_id')
        .eq('group_id', selectedGroupId)

      if (membersError || !memberRows || memberRows.length === 0) {
        setStudents([])
        setSessions([])
        setLoading(false)
        return
      }

      const studentIds = Array.from(new Set(memberRows.map((m) => m.student_id)))

      // Student profiles
      const { data: studentRows, error: studentsError } = await supabase
        .from('users')
        .select('id,name,email')
        .in('id', studentIds)

      setStudents(studentsError || !studentRows ? [] : studentRows)

      // All-time sessions for the group’s students
      const { data: sessionRows, error: sessionsError } = await supabase
        .from('training_sessions')
        .select('student_id,duration,intensity,date,activity_type')
        .in('student_id', studentIds)

      setSessions(sessionsError || !sessionRows ? [] : (sessionRows as MinimalSession[]))
      setLoading(false)
    }
    loadGroupDetails()
  }, [selectedGroupId])
  // ... existing code ...
  const statsByStudent = useMemo(() => {
    const map: Record<string, { minutes: number; sessions: number; avgEnjoyment: number }> = {}
    for (const s of sessions) {
      const id = s.student_id
      if (!map[id]) map[id] = { minutes: 0, sessions: 0, avgEnjoyment: 0 }
      map[id].minutes += s.duration || 0
      map[id].sessions += 1
      map[id].avgEnjoyment += s.intensity || 0
    }
    for (const id of Object.keys(map)) {
      const e = map[id]
      e.avgEnjoyment = e.sessions > 0 ? Number((e.avgEnjoyment / e.sessions).toFixed(2)) : 0
    }
    return map
  }, [sessions])
  // ... existing code ...
  const kpis = useMemo(() => {
    const minutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    const count = sessions.length
    const avgEnjoyment = count > 0
      ? Number((sessions.reduce((sum, s) => sum + (s.intensity || 0), 0) / count).toFixed(2))
      : 0
    return { minutes, count, studentsCount: students.length, avgEnjoyment }
  }, [sessions, students.length])
  // ... existing code ...
  return (
    <>
      <Sidebar role={'teacher' as UserRole} onOpenChange={setIsSidebarOpen} />
      <div className={`min-h-screen bg-gray-50 ${isSidebarOpen ? 'md:pl-72' : 'md:pl-0'}`}>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-black">Class Summary</h1>
              <div className="text-gray-600">{profileName || user.email}</div>
            </div>

            <div className="flex flex-wrap gap-2">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroupId(g.id)}
                  className={`px-3 py-2 rounded-md border ${selectedGroupId === g.id ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}`}
                >
                  {g.name}
                </button>
              ))}
              {groups.length === 0 && (
                <div className="text-gray-600">No groups yet.</div>
              )}
            </div>

            {loading ? (
              <div className="mt-6 border-4 border-dashed border-gray-200 rounded-lg p-6 bg-white">
                Loading…
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {/* KPI cards for selected group */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="rounded-md border bg-white p-4">
                    <div className="text-sm text-gray-600">Students</div>
                    <div className="text-3xl font-semibold text-blue-600">{kpis.studentsCount}</div>
                  </div>
                  <div className="rounded-md border bg-white p-4">
                    <div className="text-sm text-gray-600">Total minutes</div>
                    <div className="text-3xl font-semibold text-green-600">{kpis.minutes}</div>
                  </div>
                  <div className="rounded-md border bg-white p-4">
                    <div className="text-sm text-gray-600">Avg. enjoyment</div>
                    <div className="text-3xl font-semibold text-purple-600">{kpis.avgEnjoyment}</div>
                  </div>
                  <div className="rounded-md border bg-white p-4">
                    <div className="text-sm text-gray-600">Sessions</div>
                    <div className="text-3xl font-semibold text-gray-800">{kpis.count}</div>
                  </div>
                </div>

                {/* Per-student totals */}
                <div className="rounded-md border bg-white p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Students totals (all time)</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-gray-600">
                        <tr>
                          <th className="px-2 py-2 w-1/2">Student</th>
                          <th className="px-2 py-2">Total minutes</th>
                          <th className="px-2 py-2">Avg. enjoyment</th>
                          <th className="px-2 py-2">Sessions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((st) => {
                          const s = statsByStudent[st.id] || { minutes: 0, sessions: 0, avgEnjoyment: 0 }
                          return (
                            <tr key={st.id} className="border-t">
                              <td className="px-2 py-2">
                                <div className="rounded-md border px-3 py-2 bg-gray-50">
                                  <div className="font-medium text-gray-900">{st.name || st.email}</div>
                                  <div className="text-xs text-gray-500">{st.email}</div>
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <div className="rounded-md border px-3 py-2 text-center bg-gray-50">
                                  {s.minutes}
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <div className="rounded-md border px-3 py-2 text-center bg-gray-50">
                                  {s.avgEnjoyment}
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <div className="rounded-md border px-3 py-2 text-center bg-gray-50">
                                  {s.sessions}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}