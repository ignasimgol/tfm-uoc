import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TotalStatsGroup({ groupId }: { groupId: string | null }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Array<{ duration: number; intensity: number; student_id: string }>>([])
  const [studentIds, setStudentIds] = useState<string[]>([])

  useEffect(() => {
    const loadTotals = async () => {
      if (!groupId) {
        setSessions([])
        setStudentIds([])
        return
      }
      setLoading(true)
      setError(null)
      try {
        // Distinct students via group_members
        const { data: membersRows, error: membersErr } = await supabase
          .from('group_members')
          .select('student_id')
          .eq('group_id', groupId)
        if (membersErr) throw membersErr
        const ids = Array.from(new Set((membersRows ?? []).map((m) => m.student_id)))
        setStudentIds(ids)

        // All sessions for the group
        const { data: sessionRows, error: sessionsErr } = await supabase
          .from('training_sessions')
          .select('student_id,duration,intensity')
          .eq('group_id', groupId)
        if (sessionsErr) throw sessionsErr
        setSessions((sessionRows ?? []) as Array<{ duration: number; intensity: number; student_id: string }>)
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadTotals()
  }, [groupId])

  const totals = useMemo(() => {
    const totalSessions = sessions.length
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    const avgEnjoyment =
      totalSessions > 0
        ? Number(
            (
              sessions.reduce((sum, s) => sum + (s.intensity || 0), 0) / totalSessions
            ).toFixed(2)
          )
        : 0
    const distinctStudents = new Set(sessions.map((s) => s.student_id)).size || studentIds.length
    return { totalSessions, totalMinutes, avgEnjoyment, distinctStudents }
  }, [sessions, studentIds])

  return (
    <div className="rounded-md border bg-white p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
      </div>
      {loading && <div className="text-black">Loading…</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-md border bg-gray-50 p-4 text-center">
            <div className="text-sm text-gray-700">Students</div>
            <div className="text-2xl font-bold text-blue-600">{totals.distinctStudents}</div>
          </div>
          <div className="rounded-md border bg-gray-50 p-4 text-center">
            <div className="text-sm text-gray-700">Sessions</div>
            <div className="text-2xl font-bold text-gray-800">{totals.totalSessions}</div>
          </div>
          <div className="rounded-md border bg-gray-50 p-4 text-center">
            <div className="text-sm text-gray-700">Total minutes</div>
            <div className="text-2xl font-bold text-green-600">{totals.totalMinutes}</div>
          </div>
          <div className="rounded-md border bg-gray-50 p-4 text-center">
            <div className="text-sm text-gray-700">Avg enjoyment</div>
            <div className="text-2xl font-bold text-purple-600">{totals.avgEnjoyment}</div>
          </div>
        </div>
      )}
    </div>
  )
}