import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import Sidebar from './Sidebar'
import { supabase, type UserRole } from '../lib/supabase'

type SessionLite = {
  date: string
  duration: number
  intensity: number
  activity_type: string
}

const rewardThresholds = [100, 250, 500, 1000, 2000]

export default function Rewards({ user }: { user: User }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [sessions, setSessions] = useState<SessionLite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAllSessions = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('training_sessions')
        .select('date,duration,intensity,activity_type')
        .eq('student_id', user.id)
        .order('date', { ascending: false })

      if (!error && data) {
        setSessions(data as SessionLite[])
      }
      setLoading(false)
    }
    loadAllSessions()
  }, [user.id])

  const totals = useMemo(() => {
    const sessionsCount = sessions.length
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    const avgEnjoyment =
      sessionsCount > 0
        ? Number(
            (sessions.reduce((sum, s) => sum + (s.intensity || 0), 0) / sessionsCount).toFixed(2)
          )
        : 0
    return { sessionsCount, totalMinutes, avgEnjoyment }
  }, [sessions])

  const byMonth = useMemo(() => {
    const map: Record<string, { minutes: number; sessions: number }> = {}
    for (const s of sessions) {
      const d = new Date(s.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!map[key]) map[key] = { minutes: 0, sessions: 0 }
      map[key].minutes += s.duration || 0
      map[key].sessions += 1
    }
    // sort desc by month key
    return Object.entries(map)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 12)
  }, [sessions])

  const earnedThresholdIndex = rewardThresholds.findIndex((t) => totals.totalMinutes < t)
  const nextTarget =
    earnedThresholdIndex === -1 ? null : rewardThresholds[earnedThresholdIndex]

  return (
    <>
      <Sidebar role={'student' as UserRole} onOpenChange={setIsSidebarOpen} />
      <div className={`min-h-screen bg-gray-50 ${isSidebarOpen ? 'md:pl-72' : 'md:pl-0'}`}>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-black">Your Rewards</h1>
              <div className="text-sm text-gray-600">
                Total minutes: <span className="font-semibold">{totals.totalMinutes}</span>
              </div>
            </div>

            {loading ? (
              <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 bg-white">
                Loading…
              </div>
            ) : (
              <div className="space-y-6">
                {/* KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-md border bg-white p-4">
                    <div className="text-sm text-gray-600">Total minutes (all time)</div>
                    <div className="text-3xl font-semibold text-green-600">{totals.totalMinutes}</div>
                  </div>
                  <div className="rounded-md border bg-white p-4">
                    <div className="text-sm text-gray-600">Sessions (all time)</div>
                    <div className="text-3xl font-semibold text-blue-600">{totals.sessionsCount}</div>
                  </div>
                  <div className="rounded-md border bg-white p-4">
                    <div className="text-sm text-gray-600">Avg. enjoyment</div>
                    <div className="text-3xl font-semibold text-purple-600">{totals.avgEnjoyment}</div>
                  </div>
                </div>

                {/* Rewards grid */}
                <div className="rounded-md border bg-white p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Time-based rewards</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {rewardThresholds.map((t) => {
                      const achieved = totals.totalMinutes >= t
                      return (
                        <div
                          key={t}
                          className={`rounded-md border p-4 text-center ${
                            achieved ? 'bg-green-50 border-green-300' : 'bg-gray-50'
                          }`}
                        >
                          <div className="text-2xl">🏆</div>
                          <div className="mt-2 font-medium text-gray-900">{t} minutes</div>
                          <div className={`text-sm ${achieved ? 'text-green-700' : 'text-gray-600'}`}>
                            {achieved ? 'Achieved' : `${totals.totalMinutes}/${t}`}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {nextTarget && (
                    <div className="mt-3 text-sm text-gray-700">
                      Next reward at {nextTarget} minutes — keep going!
                    </div>
                  )}
                </div>

                {/* Monthly breakdown */}
                <div className="rounded-md border bg-white p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Monthly totals</h2>
                  {byMonth.length === 0 ? (
                    <div className="text-gray-600">No sessions yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="text-left text-gray-600">
                          <tr>
                            <th className="px-2 py-1">Month</th>
                            <th className="px-2 py-1">Minutes</th>
                            <th className="px-2 py-1">Sessions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {byMonth.map(([month, stats]) => (
                            <tr key={month} className="border-t">
                              <td className="px-2 py-1">{month}</td>
                              <td className="px-2 py-1">{stats.minutes}</td>
                              <td className="px-2 py-1">{stats.sessions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}