import { useEffect, useMemo, useState } from 'react'
import AddActivity, { type Activity, type ActivityType } from './AddActivity'
import Sidebar from './Sidebar'

type UserRole = 'teacher' | 'student'

const typeEmoji: Record<ActivityType, string> = {
  running: '🏃',
  basketball: '🏀',
  football: '⚽',
  cycling: '🚴',
  gym: '🏋️',
  yoga: '🧘',
  swimming: '🏊',
  volleyball: '🏐',
  other: '✅',
}

const STORAGE_KEY = 'studentActivities' // Record<string, Activity>

function getDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function firstDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export default function Track() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [activities, setActivities] = useState<Record<string, Activity>>({})
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setActivities(JSON.parse(raw))
      }
    } catch (err) {
      console.error('Failed to read activities from localStorage', err)
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities))
    } catch (err) {
      console.error('Failed to save activities to localStorage', err)
    }
  }, [activities])

  const monthDays = useMemo(() => {
    const first = firstDayOfMonth(currentMonth)
    const total = daysInMonth(currentMonth)
    // Week starts on Monday. Compute leading blanks.
    const weekday = (first.getDay() + 6) % 7 // 0=Mon ... 6=Sun
    const leadingBlanks = Array.from({ length: weekday }, () => null as number | null)
    const days = Array.from({ length: total }, (_, i) => i + 1)
    return [...leadingBlanks, ...days]
  }, [currentMonth])

  const monthLabel = useMemo(() => {
    return currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  }, [currentMonth])

  const openDay = (dayNum: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum)
    const key = getDateKey(d)
    setSelectedDay(key)
  }

  const closeForm = () => setSelectedDay(null)

  const saveActivity = (activity: Activity) => {
    setActivities((prev) => ({ ...prev, [activity.date]: activity }))
    setSelectedDay(null)
  }

  const removeActivity = (key: string) => {
    setActivities((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const selectedActivity = selectedDay ? activities[selectedDay] ?? null : null

  return (
    <>
      <Sidebar role={'student' as UserRole} onOpenChange={setIsSidebarOpen} />
      <div className={`min-h-screen bg-gray-50 ${isSidebarOpen ? 'md:pl-72' : 'md:pl-0'}`}>
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-blue-600">Track</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                    )
                  }
                  className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
                >
                  ← Prev
                </button>
                <div className="px-3 py-2 text-gray-700">{monthLabel}</div>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                    )
                  }
                  className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 bg-white">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-3 mb-3 text-center text-xs font-medium text-gray-500">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((w) => (
                  <div key={w}>{w}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-3">
                {monthDays.map((d, idx) => {
                  if (d === null) {
                    return <div key={`blank-${idx}`} />
                  }
                  const dateKey = getDateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d))
                  const act = activities[dateKey]
                  const hasActivity = Boolean(act)
                  const emoji = hasActivity ? typeEmoji[act.type] : null

                  return (
                    <button
                      key={dateKey}
                      onClick={() => openDay(d)}
                      className={`relative h-16 rounded-md border-2 transition
                        ${hasActivity ? 'border-blue-400 bg-blue-50 hover:bg-blue-100' : 'border-gray-300 bg-white hover:bg-gray-50'}
                      `}
                    >
                      <span className="absolute top-1 left-1 text-xs text-gray-600">{d}</span>
                      <div className="flex items-center justify-center h-full text-2xl">
                        {emoji ? <span role="img" aria-label={act.type}>{emoji}</span> : null}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Selected day actions */}
              {selectedDay && (
                <AddActivity
                  date={selectedDay}
                  initialActivity={selectedActivity}
                  onSave={saveActivity}
                  onClose={closeForm}
                />
              )}

              {/* Manage existing activity (quick remove) */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">This month summary</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(activities)
                    .filter(([key]) => {
                      const d = new Date(key)
                      return (
                        d.getFullYear() === currentMonth.getFullYear() &&
                        d.getMonth() === currentMonth.getMonth()
                      )
                    })
                    .map(([key, act]) => (
                      <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-md border bg-gray-50">
                        <span className="text-sm text-gray-700">
                          {key} — {typeEmoji[act.type]} {act.type} · {act.durationMinutes}m · Enjoyment {act.enjoyment}
                        </span>
                        <button
                          className="text-red-600 hover:text-red-700 text-xs"
                          onClick={() => removeActivity(key)}
                          title="Remove from this day"
                        >
                          Remove
                        </button>
                        <button
                          className="text-blue-600 hover:text-blue-700 text-xs"
                          onClick={() => setSelectedDay(key)}
                          title="Edit"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  {Object.values(activities).filter((a) => {
                    const d = new Date(a.date)
                    return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth()
                  }).length === 0 && (
                    <div className="text-sm text-gray-500">No activities logged this month.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}