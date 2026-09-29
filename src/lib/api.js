import { supabase, isDemo } from './supabase'
import { DEFAULT_SUBJECTS } from './constants'

const DEMO_RESP = 'odorlog.demo.responses'
const DEMO_SUBJ = 'odorlog.demo.subjects'
const DEMO_AUTH = 'odorlog.demo.admin'

const read = (k, d) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d }
}
const write = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ }
}

export async function submitResponse(row) {
  if (isDemo) {
    const all = read(DEMO_RESP, [])
    all.push({ ...row, id: crypto.randomUUID?.() ?? String(Date.now()), created_at: new Date().toISOString() })
    write(DEMO_RESP, all)
    await new Promise((r) => setTimeout(r, 700))
    return
  }
  // SELECT эрхгүй тул .select() дуудахгүй
  const { error } = await supabase.from('form_responses').insert(row)
  if (error) {
    if (String(error.message).includes('RATE_LIMIT')) throw new Error('RATE_LIMIT')
    throw error
  }
}

export async function fetchSubjects() {
  if (isDemo) return read(DEMO_SUBJ, DEFAULT_SUBJECTS.map((name, i) => ({ id: i + 1, name })))
  const { data, error } = await supabase.from('subjects').select('id,name').order('sort').order('id')
  if (error || !data?.length) return DEFAULT_SUBJECTS.map((name, i) => ({ id: -(i + 1), name }))
  return data
}

export async function addSubject(name) {
  if (isDemo) {
    const all = await fetchSubjects()
    const next = [...all, { id: Date.now(), name }]
    write(DEMO_SUBJ, next)
    return next
  }
  const all = await fetchSubjects()
  const { error } = await supabase.from('subjects').insert({ name, sort: all.length + 1 })
  if (error) throw error
  return fetchSubjects()
}

export async function removeSubject(id) {
  if (isDemo) {
    const next = (await fetchSubjects()).filter((s) => s.id !== id)
    write(DEMO_SUBJ, next)
    return next
  }
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) throw error
  return fetchSubjects()
}

export async function renameSubject(id, name) {
  if (isDemo) {
    const next = (await fetchSubjects()).map((s) => (s.id === id ? { ...s, name } : s))
    write(DEMO_SUBJ, next)
    return next
  }
  const { error } = await supabase.from('subjects').update({ name }).eq('id', id)
  if (error) throw error
  return fetchSubjects()
}

export async function fetchResponses() {
  if (isDemo) return read(DEMO_RESP, []).slice().reverse()
  const rows = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('form_responses')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < PAGE) break
  }
  return rows
}

// ---------- Админ нэвтрэлт ----------
export async function currentAdmin() {
  if (isDemo) return read(DEMO_AUTH, false) ? { email: 'demo' } : null
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user) return null
  const { data: ok } = await supabase.rpc('is_admin')
  return ok ? user : null
}

export async function signIn(email, password) {
  if (isDemo) {
    const expected = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'amjilt2026'
    if (password !== expected) throw new Error('BAD_CREDENTIALS')
    write(DEMO_AUTH, true)
    return { email: 'demo' }
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error('BAD_CREDENTIALS')
  const user = await currentAdmin()
  if (!user) {
    await supabase.auth.signOut()
    throw new Error('NOT_ADMIN')
  }
  return user
}

export async function signOut() {
  if (isDemo) return write(DEMO_AUTH, false)
  await supabase.auth.signOut()
}
