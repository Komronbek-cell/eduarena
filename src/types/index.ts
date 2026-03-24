export type UserRole = 'student' | 'admin'

export interface Group {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  email: string
  group_id?: string
  role: UserRole
  avatar_url?: string
  total_score: number
  streak: number
  last_active?: string
  created_at: string
  groups?: Group
}

export interface Quiz {
  id: string
  title: string
  description?: string
  type: 'daily' | 'weekly'
  status: 'draft' | 'active' | 'finished'
  time_limit: number
  score_per_question: number
  starts_at?: string
  ends_at?: string
  created_at: string
}

export interface Question {
  id: string
  quiz_id: string
  question_text: string
  options: string[]
  correct_answer: string
  order_num: number
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  score: number
  total_questions: number
  correct_answers: number
  time_spent: number
  completed_at: string
}

export interface Achievement {
  id: string
  title: string
  description?: string
  icon?: string
  condition_type: string
  condition_value: number
}

export interface StudentAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  achievements?: Achievement
}

export interface Announcement {
  id: string
  title: string
  content: string
  is_pinned: boolean
  created_by?: string
  created_at: string
}