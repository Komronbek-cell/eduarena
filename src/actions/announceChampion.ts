'use server'

import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function announceChampionAction(data: {
  userId: string
  weekLabel: string
  score: number
  fullName: string
  groupName: string
  createdBy: string | undefined
}) {
  const { data: championData, error: championError } = await adminSupabase
    .from('weekly_champions')
    .insert({
      user_id: data.userId,
      week_label: data.weekLabel,
      score: data.score,
    })
    .select()
    .single()

  if (championError) {
    return { success: false, error: championError.message }
  }

  if (championData) {
    const { error: announcementError } = await adminSupabase
      .from('announcements')
      .insert({
        title: `🏆 Hafta qahramoni: ${data.fullName}`,
        content: `${data.weekLabel} hafatasining eng yaxshi talabasi — ${data.fullName}${data.groupName ? ` (${data.groupName})` : ''}! Jami ball: ${data.score}. Tabriklaymiz! 🎉`,
        is_pinned: true,
        created_by: data.createdBy,
      })

    if (announcementError) {
      return { success: false, error: announcementError.message }
    }
  }

  return { success: true }
}
export async function deleteChampionAction(id: string) {
  const { error } = await adminSupabase
    .from('weekly_champions')
    .delete()
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteAnnouncementAction(id: string) {
  const { error } = await adminSupabase
    .from('announcements')
    .delete()
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}