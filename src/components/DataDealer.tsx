import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase, type TrainingSession } from '../lib/supabase'

export interface Student {
  id: string
  name: string | null
  email: string
}

export interface StudentStats {
  totalMinutes: number
  sessions: number
  avgEnjoyment: number
}

export interface ActivityAgg {
  activity: string
  sessions: number
  totalMinutes: number
  avgEnjoyment: number
}

export type StatsByStudent = Record<string, StudentStats>

async function getGroupMemberIds(groupId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('student_id')
    .eq('group_id', groupId)
  if (error) throw error
  const ids = (data ?? []).map((m: { student_id: string }) => m.student_id)
  console.log('[getGroupMemberIds]', { groupId, count: ids.length, ids })
  return ids
}

async function getUsersByIds(ids: string[]): Promise<Student[]> {
  console.log('[getUsersByIds] input ids', ids)
  if (!ids.length) return []
  const { data, error } = await supabase
    .from('users')
    .select('id,name,email')
    .in('id', ids)
  if (error) throw error
  const rows = (data ?? []) as Student[]
  console.log('[getUsersByIds] rows via IN', rows.length, rows)


  if (rows.length === 0 && ids.length === 1) {
    const singleId = ids[0]
    const { data: eqData, error: eqErr } = await supabase
      .from('users')
      .select('id,name,email')
      .eq('id', singleId)
    if (eqErr) throw eqErr
    const eqRows = (eqData ?? []) as Student[]
    console.log('[getUsersByIds] rows via EQ fallback', eqRows.length, eqRows)
    return eqRows
  }

  return rows
}

async function getSessionsByGroup(groupId: string): Promise<TrainingSession[]> {
  const { data, error } = await supabase
    .from('training_sessions')
    .select('id,student_id,group_id,date,activity_type,duration,intensity,notes,created_at')
    .eq('group_id', groupId)
    .order('date', { ascending: false })
  if (error) throw error
  const rows = (data ?? []) as TrainingSession[]
  console.log('[getSessionsByGroup]', { groupId, count: rows.length })
  return rows
}

export function computeStatsByStudent(sessions: TrainingSession[]): StatsByStudent {
  const acc: Record<string, { totalMinutes: number; intSum: number; count: number }> = {}
  for (const s of sessions) {
    const id = s.student_id
    if (!acc[id]) acc[id] = { totalMinutes: 0, intSum: 0, count: 0 }
    acc[id].totalMinutes += s.duration || 0
    acc[id].intSum += s.intensity || 0
    acc[id].count += 1
  }
  const out: StatsByStudent = {}
  for (const id of Object.keys(acc)) {
    const count = acc[id].count
    out[id] = {
      totalMinutes: acc[id].totalMinutes,
      sessions: count,
      avgEnjoyment: count ? Number((acc[id].intSum / count).toFixed(2)) : 0,
    }
  }
  return out
}

function computeTopActivities(sessions: TrainingSession[]): ActivityAgg[] {
  const acc: Record<string, { sessions: number; minutes: number; intSum: number }> = {}
  for (const s of sessions) {
    const key = s.activity_type || 'Unknown'
    if (!acc[key]) acc[key] = { sessions: 0, minutes: 0, intSum: 0 }
    acc[key].sessions += 1
    acc[key].minutes += s.duration || 0
    acc[key].intSum += s.intensity || 0
  }
  const rows: ActivityAgg[] = Object.keys(acc).map((k) => {
    const a = acc[k]
    const avg = a.sessions ? Number((a.intSum / a.sessions).toFixed(2)) : 0
    return { activity: k, sessions: a.sessions, totalMinutes: a.minutes, avgEnjoyment: avg }
  })
  rows.sort((a, b) => (b.sessions - a.sessions) || (b.totalMinutes - a.totalMinutes))
  return rows.slice(0, 5)
}

export async function fetchGroupTotals(groupId: string): Promise<{
  students: Student[]
  statsByStudent: StatsByStudent
  topActivities: ActivityAgg[]
}> {
  const memberIds = await getGroupMemberIds(groupId)
  const [students, sessions] = await Promise.all([
    getUsersByIds(memberIds),
    getSessionsByGroup(groupId),
  ])
  const statsByStudent = computeStatsByStudent(sessions)
  const topActivities = computeTopActivities(sessions)
  return { students, statsByStudent, topActivities }
}

export async function fetchStudentsByIds(ids: string[]): Promise<Student[]> {
  return getUsersByIds(ids)
}

export function useGroupTotals(groupId: string | null) {
  const [students, setStudents] = useState<Student[]>([])
  const [statsByStudent, setStatsByStudent] = useState<StatsByStudent>({})
  const [topActivities, setTopActivities] = useState<ActivityAgg[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!groupId) {
      setStudents([])
      setStatsByStudent({})
      setTopActivities([])
      return
    }
    setLoading(true)
    setError(null)
    console.log('[useGroupTotals] fetch start', { groupId })
    try {
      const { students, statsByStudent, topActivities } = await fetchGroupTotals(groupId)
      setStudents(students)
      setStatsByStudent(statsByStudent)
      setTopActivities(topActivities)
      console.log('[useGroupTotals] fetch success', {
        studentsCount: students.length,
        statsKeys: Object.keys(statsByStudent).length,
        topActivities: topActivities.map((a) => `${a.activity}:${a.sessions}`),
      })
    } catch (e: any) {
      const msg = e?.message ?? 'Unknown error'
      setError(msg)
      console.error('[useGroupTotals] fetch error', msg, e)
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    load()
  }, [load])

  const hasData = useMemo(() => students.length > 0, [students])

  return {
    students,
    statsByStudent,
    topActivities,
    loading,
    error,
    hasData,
    refresh: load,
  }
}

export default function DataDealer({
  groupId,
  children,
}: {
  groupId: string | null
  children: (data: {
    students: Student[]
    statsByStudent: StatsByStudent
    topActivities: ActivityAgg[]
    loading: boolean
    error: string | null
    hasData: boolean
    refresh: () => Promise<void>
  }) => ReactNode
}) {
  const data = useGroupTotals(groupId)
  return <>{children(data)}</>
}