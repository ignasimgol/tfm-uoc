import { useState, useEffect } from 'react'

export type ActivityType =
    | 'running'
  | 'basketball'
  | 'football'
  | 'volleyball'
  | 'hockey'
  | 'handball'
  | 'bikeSports'
  | 'gym'
  | 'yoga'
  | 'swimming'
  | 'climbing'
  | 'trekking'
  | 'pilates'
  | 'dance'
  | 'combatSports'
  | 'surfing'
  | 'raquetSports'
  | 'skating'
  | 'walking'




export interface Activity {
  date: string // YYYY-MM-DD
  durationMinutes: number
  enjoyment: number // 1..5
  type: ActivityType
  notes?: string
}

interface AddActivityProps {
  date: string
  initialActivity?: Activity | null
  onSave: (activity: Activity) => void
  onClose: () => void
}

const activityLabels: Record<ActivityType, string> = {
  running: 'Running',
  basketball: 'Basketball',
  football: 'Football',
  volleyball: 'Volleyball',
  hockey: 'Hockey',
  handball: 'Handball',
  bikeSports: 'Bike Sports',
  gym: 'Gym',
  yoga: 'Yoga',
  swimming: 'Swimming',
  climbing: 'Climbing',
  trekking: 'Trekking',
  pilates: 'Pilates',
  dance: 'Dance',
  combatSports: 'Combat Sports',
  surfing: 'Surfing',
  raquetSports: 'Raquet Sports',
  skating: 'Skating',
  walking: 'Walking',

}

export default function AddActivity({ date, initialActivity, onSave, onClose }: AddActivityProps) {
  const [durationMinutes, setDurationMinutes] = useState<number>(initialActivity?.durationMinutes ?? 30)
  const [enjoyment, setEnjoyment] = useState<number>(initialActivity?.enjoyment ?? 3)
  const [type, setType] = useState<ActivityType>(initialActivity?.type ?? 'running')
  const [notes, setNotes] = useState<string>(initialActivity?.notes ?? '')

  useEffect(() => {
    setDurationMinutes(initialActivity?.durationMinutes ?? 30)
    setEnjoyment(initialActivity?.enjoyment ?? 3)
    setType(initialActivity?.type ?? 'running')
    setNotes(initialActivity?.notes ?? '')
  }, [initialActivity])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const activity: Activity = {
      date,
      durationMinutes: Math.max(0, Number(durationMinutes)),
      enjoyment: Math.min(5, Math.max(1, Number(enjoyment))),
      type,
      notes: notes?.trim() || undefined,
    }
    onSave(activity)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add Activity – {date}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 13H5v-2h14v2z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type of activity</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ActivityType)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(activityLabels).map((key) => (
                <option key={key} value={key}>
                  {activityLabels[key as ActivityType]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <input
              type="number"
              min={0}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Enjoyment</label>
            <input
              type="range"
              min={1}
              max={5}
              value={enjoyment}
              onChange={(e) => setEnjoyment(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-600">1 (low) — 5 (high): {enjoyment}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-md bg-green-700 text-white hover:bg-black">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}