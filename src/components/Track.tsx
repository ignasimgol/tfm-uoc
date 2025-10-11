// Top-level module (imports + helpers)
import { useEffect, useMemo, useState } from 'react'
import Sidebar from './Sidebar'
import AddActivity, { type Activity, type ActivityType } from './AddActivity'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

type UserRole = 'teacher' | 'student'

const typeEmoji: Record<ActivityType, string> = {
  running: '🏃',
  basketball: '🏀',
  football: '⚽',
  volleyball: '🏐',
  hockey: '🏒',
  handball: '🤾', 
  bikeSports: '🚴',
  gym: '🏋️',
  yoga: '🧘',
  swimming: '🏊',
  climbing: '🧗',
  trekking: '🥾',
  pilates: '🧘‍♀️',
  dance: '💃',
  combatSports: '🥊',
  surfing: '🏄',
  raquetSports: '🎾',
  skating: '🛹',
  walking: '🚶',

}

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

// Componente principal
function Track({ user }: { user: User }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [activities, setActivities] = useState<Record<string, Activity>>({})
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const todayKey = getDateKey(new Date())

  // Cargar el primer grupo al que pertenece el alumno
  useEffect(() => {
    const fetchGroup = async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('student_id', user.id)

      if (!error && data && data[0]) {
        setGroupId(data[0].group_id)
      }
    }
    fetchGroup()
  }, [user.id])

  // Cargar sesiones del mes desde Supabase
  useEffect(() => {
    const loadMonthSessions = async () => {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      const startStr = start.toISOString().slice(0, 10)
      const endStr = end.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('student_id', user.id)
        .gte('date', startStr)
        .lte('date', endStr)

      if (!error && data) {
        const map: Record<string, Activity> = {}
        for (const row of data) {
          map[row.date] = {
            date: row.date,
            durationMinutes: row.duration,
            enjoyment: row.intensity ?? 3,
            type: (row.activity_type as ActivityType) ?? 'other',
            notes: row.notes ?? undefined,
          }
        }
        setActivities(map)
      }
    }
    loadMonthSessions()
  }, [currentMonth, user.id])

  const monthDays = useMemo(() => {
    const first = firstDayOfMonth(currentMonth)
    const total = daysInMonth(currentMonth)
    const weekday = (first.getDay() + 6) % 7 // 0=Mon ... 6=Sun
    const leadingBlanks = Array.from({ length: weekday }, () => null as number | null)
    const days = Array.from({ length: total }, (_, i) => i + 1)
    return [...leadingBlanks, ...days]
  }, [currentMonth])


  // Helpers for month/year controls in the calendar toolbar
  const currentYear = currentMonth.getFullYear()
  const currentMonthIndex = currentMonth.getMonth()
  const months: string[] = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]
  const yearOptions: number[] = useMemo(() => {
    // Show a range around current year (adjust as needed)
    const start = currentYear - 4
    return Array.from({ length: 9 }, (_, i) => start + i)
  }, [currentYear])

  const openDay = (dayNum: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum)
    const key = getDateKey(d)
    setSelectedDay(key)
  }

  const closeForm = () => setSelectedDay(null)

  // Guardar/actualizar en Supabase
  const saveActivity = async (activity: Activity) => {
    const { data: existing, error: findError } = await supabase
      .from('training_sessions')
      .select('id')
      .eq('student_id', user.id)
      .eq('date', activity.date)
      .limit(1)

    if (!findError && existing && existing.length > 0) {
      await supabase
        .from('training_sessions')
        .update({
          group_id: groupId,
          activity_type: activity.type,
          duration: activity.durationMinutes,
          intensity: activity.enjoyment,
          notes: activity.notes ?? null,
        })
        .eq('id', existing[0].id)
    } else {
      await supabase
        .from('training_sessions')
        .insert([
          {
            student_id: user.id,
            group_id: groupId,
            date: activity.date,
            activity_type: activity.type,
            duration: activity.durationMinutes,
            intensity: activity.enjoyment,
            notes: activity.notes ?? null,
          },
        ])
    }

    setActivities((prev) => ({ ...prev, [activity.date]: activity }))
    setSelectedDay(null)
  }

  // Borrar en Supabase y del estado local
  const removeActivity = async (key: string) => {
    await supabase
      .from('training_sessions')
      .delete()
      .eq('student_id', user.id)
      .eq('date', key)

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
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-black">Track your exercise</h1>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Select month"
                  value={currentMonthIndex}
                  onChange={(e) =>
                    setCurrentMonth(new Date(currentYear, Number(e.target.value), 1))
                  }
                  className="px-2 py-2 rounded-md border bg-white text-gray-700"
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>

                <select
                  aria-label="Select year"
                  value={currentYear}
                  onChange={(e) =>
                    setCurrentMonth(new Date(Number(e.target.value), currentMonthIndex, 1))
                  }
                  className="px-2 py-2 rounded-md border bg-white text-gray-700"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calendario */}
            <div className="border-4 border-solid border-[#2E7915] rounded-lg p-6 bg-white">
              <div className="grid grid-cols-7 gap-3 mb-3 text-center text-xs font-medium text-gray-500">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((w) => (
                  <div key={w}>{w}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-3">
                {monthDays.map((d, idx) => {
                  if (d === null) return <div key={`blank-${idx}`} />
                  const dateKey = getDateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d))
                  const act = activities[dateKey]
                  const hasActivity = Boolean(act)
                  const emoji = hasActivity ? typeEmoji[act.type] : null
                  const isToday = dateKey === todayKey

                  return (
                    <button
                      key={dateKey}
                      onClick={() => openDay(d)}
                      aria-current={isToday ? 'date' : undefined}
                      className={`relative h-16 rounded-md border-2 transition
                        ${hasActivity ? 'border-blue-400 bg-blue-50 hover:bg-blue-100' : 'border-gray-300 bg-white hover:bg-gray-50'}
                        ${isToday ? 'border-green-600 ring-2 ring-green-300' : ''}
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

              {selectedDay && (
                <AddActivity
                  date={selectedDay}
                  initialActivity={selectedActivity}
                  onSave={saveActivity}
                  onClose={closeForm}
                />
              )}

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
                    return (
                      d.getFullYear() === currentMonth.getFullYear() &&
                      d.getMonth() === currentMonth.getMonth()
                    )
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

export default Track