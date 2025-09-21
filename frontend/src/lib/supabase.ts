import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface User {
  id?: string
  first_name: string
  last_name: string
  created_at?: string
  updated_at?: string
}

export interface QuizSession {
  id?: string
  user_id: string
  round_number: number
  status: 'pending' | 'in_progress' | 'completed'
  score?: number
  total_questions?: number
  correct_answers?: number
  started_at?: string
  completed_at?: string
  created_at?: string
}

export interface QuizAnswer {
  id?: string
  session_id: string
  question_id: string
  selected_answer: string
  is_correct: boolean
  answered_at?: string
}