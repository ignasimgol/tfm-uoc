import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import Sidebar from './Sidebar'
import { supabase, type UserRole } from '../lib/supabase'

type SessionLite = {
  date: string
  created_at?: string | null
  duration: number
  intensity: number
  activity_type: string
}

const rewardThresholds = [100, 250, 500, 750, 1000, 1500, 2000, 3000]

const TEAM_SPORTS = ['basketball', 'football', 'volleyball', 'hockey', 'handball'] as const
const OUTDOOR_SPORTS = [
  'running',
  'bikeSports',
  'swimming',
  'climbing',
  'trekking',
  'surfing',
  'skating',
  'walking',
  'raquetSports',
] as const

export default function Rewards({ user }: { user: User }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [sessions, setSessions] = useState<SessionLite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAllSessions = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('training_sessions')
        .select('date,created_at,duration,intensity,activity_type')
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

  const earnedThresholdIndex = rewardThresholds.findIndex((t) => totals.totalMinutes < t)
  const nextTarget =
    earnedThresholdIndex === -1 ? null : rewardThresholds[earnedThresholdIndex]

  const playedTypes = useMemo(() => {
    const set = new Set<string>()
    for (const s of sessions) {
      if (s.activity_type) set.add(s.activity_type)
    }
    return set
  }, [sessions])

  const teamCompleted = TEAM_SPORTS.filter((t) => playedTypes.has(t))
  const outdoorCompleted = OUTDOOR_SPORTS.filter((t) => playedTypes.has(t))
  const teamAchieved = teamCompleted.length === TEAM_SPORTS.length
  const outdoorAchieved = outdoorCompleted.length === OUTDOOR_SPORTS.length

  return (
    <>
      <Sidebar role={'student' as UserRole} onOpenChange={setIsSidebarOpen} />
      <div className={`min-h-screen bg-gray-50 ${isSidebarOpen ? 'md:pl-72' : 'md:pl-0'}`}>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-black">Your Rewards</h1>
            </div>

            {loading ? (
              <div className="border-4 border border-gray-200 rounded-lg p-6 bg-white">
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

                {/* Category badges */}
                <div className="rounded-md border bg-white p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Category badges</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Team Sports badge */}
                    <div className={`rounded-md border p-4 ${teamAchieved ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🤝</span>
                          <span className="font-medium text-gray-900">Team Sports</span>
                        </div>
                        <span className={`text-sm ${teamAchieved ? 'text-green-700' : 'text-gray-600'}`}>
                          {teamCompleted.length}/{TEAM_SPORTS.length} completed
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-gray-700">
                        {teamAchieved ? 'Badge earned: played all team sports!' : 'Play all team sports in the list to earn the badge.'}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {TEAM_SPORTS.map((t) => (
                          <span
                            key={t}
                            className={`px-2 py-1 rounded-full text-xs border ${playedTypes.has(t) ? 'bg-green-100 border-green-300 text-green-800' : 'bg-gray-100 border-gray-300 text-gray-700'}`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Outdoor Sports badge */}
                    <div className={`rounded-md border p-4 ${outdoorAchieved ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🌿</span>
                          <span className="font-medium text-gray-900">Outdoor Sports</span>
                        </div>
                        <span className={`text-sm ${outdoorAchieved ? 'text-green-700' : 'text-gray-600'}`}>
                          {outdoorCompleted.length}/{OUTDOOR_SPORTS.length} completed
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-gray-700">
                        {outdoorAchieved ? 'Badge earned: outdoor activities completed!' : 'Make all the outdoor activities to earn the badge.'}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {OUTDOOR_SPORTS.map((t) => (
                          <span
                            key={t}
                            className={`px-2 py-1 rounded-full text-xs border ${playedTypes.has(t) ? 'bg-green-100 border-green-300 text-green-800' : 'bg-gray-100 border-gray-300 text-gray-700'}`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
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