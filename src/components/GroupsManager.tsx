import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Group } from '../lib/supabase'
import Sidebar from './Sidebar'

interface GroupsManagerProps {
  user: User
}

interface Student {
  id: string
  name: string
  email: string
}

interface SessionRow {
  id: string
  student_id: string
  date: string
  activity_type: string
  duration: number
  intensity: number
  notes: string | null
}

export default function GroupsManager({ user }: GroupsManagerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadGroups = async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading groups:', error)
        return
      }
      setGroups(data ?? [])
      if (data && data.length && !selectedGroupId) {
        setSelectedGroupId(data[0].id)
      }
    }
    loadGroups()
  }, [user.id])

  useEffect(() => {
    if (!selectedGroupId) return
    const loadMembersAndSessions = async () => {
      setLoading(true)

      // miembros del grupo
      const { data: memberRows, error: membersError } = await supabase
        .from('group_members')
        .select('student_id')
        .eq('group_id', selectedGroupId)

      if (membersError) {
        console.error('Error loading members:', membersError)
        setLoading(false)
        return
      }

      const studentIds = (memberRows ?? []).map((m) => m.student_id)
      const { data: studentRows, error: studentsError } = await supabase
        .from('users')
        .select('id,name,email')
        .in('id', studentIds)

      if (studentsError) {
        console.error('Error loading students:', studentsError)
        setLoading(false)
        return
      }

      setStudents(studentRows ?? [])

      // sesiones recientes del grupo (últimos 60 días)
      const since = new Date()
      since.setDate(since.getDate() - 60)
      const sinceStr = since.toISOString().slice(0, 10)

      const { data: sessionRows, error: sessionsError } = await supabase
        .from('training_sessions')
        .select('id,student_id,date,activity_type,duration,intensity,notes')
        .eq('group_id', selectedGroupId)
        .gte('date', sinceStr)
        .order('date', { ascending: false })

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError)
        setLoading(false)
        return
      }

      setSessions(sessionRows ?? [])
      setLoading(false)
    }

    loadMembersAndSessions()
  }, [selectedGroupId])

  const latestByStudent: Record<string, SessionRow | undefined> = {}
  for (const s of sessions) {
    if (!latestByStudent[s.student_id]) latestByStudent[s.student_id] = s
  }

  return (
    <>
      <Sidebar role="teacher" onOpenChange={setIsSidebarOpen} />
      <div className={`min-h-screen bg-gray-50 ${isSidebarOpen ? 'md:pl-72' : 'md:pl-0'}`}>
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-blue-600">Groups</h1>
              <div className="flex gap-2">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`px-3 py-2 rounded-md border ${selectedGroupId === g.id ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 bg-white">
              {loading && <div className="text-gray-600">Loading…</div>}

              {!loading && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">Students overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((st) => {
                      const last = latestByStudent[st.id]
                      return (
                        <div key={st.id} className="rounded-md border p-4 bg-gray-50">
                          <div className="font-medium text-gray-900">{st.name || st.email}</div>
                          {last ? (
                            <div className="mt-2 text-sm text-gray-700">
                              <div>Last: {last.date}</div>
                              <div>Type: {last.activity_type}</div>
                              <div>Duration: {last.duration} min</div>
                              <div>Enjoyment: {last.intensity}/5</div>
                              {last.notes && <div>Notes: {last.notes}</div>}
                            </div>
                          ) : (
                            <div className="mt-2 text-sm text-gray-500">No recent activity</div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900 mt-6">Recent sessions</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-gray-600">
                        <tr>
                          <th className="px-2 py-1">Date</th>
                          <th className="px-2 py-1">Student</th>
                          <th className="px-2 py-1">Type</th>
                          <th className="px-2 py-1">Duration</th>
                          <th className="px-2 py-1">Enjoyment</th>
                          <th className="px-2 py-1">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((s) => {
                          const student = students.find((st) => st.id === s.student_id)
                          return (
                            <tr key={s.id} className="border-t">
                              <td className="px-2 py-1">{s.date}</td>
                              <td className="px-2 py-1">{student?.name || student?.email || s.student_id}</td>
                              <td className="px-2 py-1">{s.activity_type}</td>
                              <td className="px-2 py-1">{s.duration} min</td>
                              <td className="px-2 py-1">{s.intensity}/5</td>
                              <td className="px-2 py-1">{s.notes || '-'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}