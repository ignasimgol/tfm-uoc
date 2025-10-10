import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ... existing code ...
export type UserRole = 'teacher' | 'student'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  school_id: string | null
  is_admin?: boolean
  created_at: string
}

export interface School {
  id: string
  name: string
  location: string | null
  invite_code: string
  created_at: string
}

export interface Group {
  id: string
  name: string
  school_id: string
  teacher_id: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  student_id: string
  joined_at: string
}

export interface TrainingSession {
  id: string
  student_id: string
  group_id: string
  date: string
  activity_type: string
  duration: number
  notes: string | null
  created_at: string
}