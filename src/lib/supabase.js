import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
// Publishable key (sb_publishable_…) эсвэл хуучин anon key аль нь ч болно
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

// .env тохируулаагүй бол demo горим (өгөгдөл зөвхөн энэ хөтөчийн localStorage-д)
export const supabase = url && key ? createClient(url, key) : null
export const isDemo = !supabase
// Байршуулсан сайт дээр түлхүүр алга бол хариултыг хөтөчид чимээгүй хадгалахгүй, алдаа гаргана
export const isMisconfigured = isDemo && import.meta.env.PROD
if (isMisconfigured) console.error('Supabase тохиргоо алга: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY')
