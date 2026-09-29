import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
// Publishable key (sb_publishable_…) эсвэл хуучин anon key аль нь ч болно
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

// .env тохируулаагүй бол demo горим (өгөгдөл зөвхөн энэ хөтөчийн localStorage-д)
export const supabase = url && key ? createClient(url, key) : null
export const isDemo = !supabase
