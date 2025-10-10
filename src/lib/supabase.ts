import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rvhrzldmkrifmgapccps.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2aHJ6bGRta3JpZm1nYXBjY3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzEwMTksImV4cCI6MjA3NTQwNzAxOX0.Eo8-q165R8d7UyGL9HpZw4iUiKc-vbKRGXcOOvWd_Dk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'teacher' | 'student'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  school_id: number | null
  created_at: string
}

export interface School {
  id: number
  name: string
  location: string
  created_at: string
}

export interface Group {
  id: number
  name: string
  teacher_id: string
  school_id: number
  created_at: string
}

export interface GroupMember {
  id: number
  group_id: number
  student_id: string
  joined_at: string
}

export interface TrainingSession {
  id: number
  student_id: string
  group_id: number | null
  date: string
  activity_type: string
  duration: number
  intensity: string
  notes: string | null
  created_at: string
}