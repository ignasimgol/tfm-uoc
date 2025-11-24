import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Group } from '../lib/supabase'
import Sidebar from './Sidebar'
import { useGroupTotals, fetchStudentsByIds } from './DataDealer'
import TotalStatsGroup from './TotalStatsGroup'

interface GroupsManagerProps {
  user: User
}

interface Student {
  id: string
  name: string
  email: string
}

export default function GroupsManager({ user }: GroupsManagerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
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
    const loadMembers = async () => {
      setLoading(true)
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
      setLoading(false)
    }
    loadMembers()
  }, [selectedGroupId])

  const {
    students: totalsStudents,
    statsByStudent,
    loading: totalsLoading,
    error: totalsError,
    topActivities,
  } = useGroupTotals(selectedGroupId)

  const [fallbackStudents, setFallbackStudents] = useState<Student[]>([])

  useEffect(() => {
    // Si no hay alumnos pero sí stats, intentamos cargar por los IDs que falten
    const loadMissingProfiles = async () => {
      if (!selectedGroupId) {
        setFallbackStudents([])
        return
      }

      const statsIds = Object.keys(statsByStudent)
      if (statsIds.length === 0) {
        setFallbackStudents([])
        return
      }

      const knownIds = new Set<string>([
        ...totalsStudents.map((s) => s.id),
        ...students.map((s) => s.id),
        ...fallbackStudents.map((s) => s.id),
      ])

      const missingIds = statsIds.filter((id) => !knownIds.has(id))
      if (missingIds.length === 0) return

      try {
        const rows = await fetchStudentsByIds(missingIds)
        setFallbackStudents((prev) => {
          const merged = [...prev]
          for (const s of rows ?? []) {
            if (!merged.find((m) => m.id === s.id)) {
              merged.push({ id: s.id, name: s.name ?? '', email: s.email })
            }
          }
          return merged
        })
      } catch (e) {
        console.error('Error loading missing student profiles', e)
      }
    }

    loadMissingProfiles()
  }, [selectedGroupId, statsByStudent, totalsStudents, students, fallbackStudents])

  // Diccionario de perfiles por ID, combinando todas las fuentes disponibles
  const studentById: Record<string, { name: string | null; email: string } | undefined> = {}
  ;[...students, ...totalsStudents, ...fallbackStudents].forEach((s) => {
    studentById[s.id] = { name: s.name, email: s.email }
  })

  return (
    <>
      <Sidebar role="teacher" onOpenChange={setIsSidebarOpen} />
      <div className={`min-h-screen bg-gray-50 ${isSidebarOpen ? 'md:pl-72' : 'md:pl-0'}`}>
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-green-700">Groups</h1>
              {/* Selector de grupo: dropdown + botones */}
              <div className="flex items-center gap-3">
                <label className="sr-only" htmlFor="groupSelect">Seleccionar grupo</label>
                <select
                  id="groupSelect"
                  value={selectedGroupId ?? ''}
                  onChange={(e) => setSelectedGroupId(e.target.value || null)}
                  className="px-3 py-2 rounded-md border bg-white text-gray-700"
                  aria-label="Seleccionar grupo"
                >
                  {groups.length === 0 ? (
                    <option value="">No hay grupos</option>
                  ) : (
                    groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))
                  )}
                </select>
                
              </div>
            </div>
          
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border border-gray-200 rounded-lg p-6 bg-white">
              {(loading || totalsLoading) && <div className="text-black">Loading…</div>}
              {totalsError && <div className="text-red-600">Error: {totalsError}</div>}
              <TotalStatsGroup groupId={selectedGroupId} />

              {/* Top 5 activities */}
              {!totalsLoading && topActivities.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Top 5 activities</h2>
                  <div className="overflow-x-auto mt-2">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100 text-left text-gray-900">
                        <tr>
                          <th className="px-3 py-2">Activity</th>
                          <th className="px-3 py-2">Sessions</th>
                          <th className="px-3 py-2">Total minutes</th>
                          <th className="px-3 py-2">Avg enjoyment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {topActivities.map((a) => (
                          <tr key={a.activity}>
                            <td className="px-3 py-2 text-black">{a.activity}</td>
                            <td className="px-3 py-2 text-black">{a.sessions}</td>
                            <td className="px-3 py-2 text-black">{a.totalMinutes}</td>
                            <td className="px-3 py-2 text-black">{a.avgEnjoyment}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Students totals */}
              {!(loading || totalsLoading) && Object.keys(statsByStudent).length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Students totals</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100 text-left text-gray-900">
                        <tr>
                          <th className="px-3 py-2">Student</th>
                          <th className="px-3 py-2">Total sessions</th>
                          <th className="px-3 py-2">Total minutes</th>
                          <th className="px-3 py-2">Avg enjoyment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {Object.keys(statsByStudent).map((id) => {
                          const stats = statsByStudent[id] || { totalMinutes: 0, avgEnjoyment: 0, sessions: 0 }
                          const profile = studentById[id]
                          return (
                            <tr key={id}>
                              <td className="px-3 py-2 text-black">{profile ? (profile.name || profile.email) : 'Student not found'}</td>
                              <td className="px-3 py-2 text-black">{stats.sessions}</td>
                              <td className="px-3 py-2 text-black">{stats.totalMinutes}</td>
                              <td className="px-3 py-2 text-black">{stats.avgEnjoyment}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!(loading || totalsLoading) &&
                (totalsStudents.length === 0 && students.length === 0 && fallbackStudents.length === 0) &&
                Object.keys(statsByStudent).length === 0 && (
                  <div className="text-black">No hay alumnos para este grupo.</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}