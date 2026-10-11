import { createClient } from '@supabase/supabase-js'

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

// true = ใส่ค่า Supabase ครบแล้ว (รองรับทั้งคีย์ anon แบบเก่า และ publishable แบบใหม่)
export const isSupabaseReady =
  url.startsWith('https://') && (key.startsWith('eyJ') || key.startsWith('sb_publishable_'))

// ยังไม่ตั้งค่า = ใช้ค่าหลอกไว้ก่อน หน้าเว็บจะไม่พังทั้งหน้า แต่จะขึ้นแถบแดงเตือน
export const supabase = createClient(
  isSupabaseReady ? url : 'https://example.supabase.co',
  isSupabaseReady ? key : 'not-configured'
)
