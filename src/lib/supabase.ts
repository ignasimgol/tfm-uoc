import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rvhrzldmkrifmgapccps.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2aHJ6bGRta3JpZm1nYXBjY3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzEwMTksImV4cCI6MjA3NTQwNzAxOX0.Eo8-q165R8d7UyGL9HpZw4iUiKc-vbKRGXcOOvWd_Dk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'teacher' | 'student'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  created_at: string
}