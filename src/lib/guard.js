// Нэг төхөөрөмжөөс давхар илгээхээс сэргийлэх хөнгөн хамгаалалт
const DEVICE_KEY = 'odorlog.device'
const SENT_KEY = 'odorlog.sent'
const COOLDOWN_MS = 10 * 60 * 1000
const MAX_IN_WINDOW = 2

function safeGet(k) {
  try { return localStorage.getItem(k) } catch { return null }
}
function safeSet(k, v) {
  try { localStorage.setItem(k, v) } catch { /* private mode */ }
}

export function getDeviceId() {
  let id = safeGet(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()
    safeSet(DEVICE_KEY, id)
  }
  return id
}

function sentLog() {
  try { return JSON.parse(safeGet(SENT_KEY) || '[]') } catch { return [] }
}

/** @returns {{ ok: boolean, waitMin?: number, sentBefore: boolean }} */
export function checkGuard() {
  const now = Date.now()
  const log = sentLog()
  const recent = log.filter((e) => now - e.t < COOLDOWN_MS)
  if (recent.length >= MAX_IN_WINDOW) {
    const waitMin = Math.ceil((COOLDOWN_MS - (now - recent[0].t)) / 60000)
    return { ok: false, waitMin, sentBefore: true }
  }
  return { ok: true, sentBefore: log.length > 0 }
}

export function hasSentStudent(name, cls) {
  const key = `${name.trim().toLowerCase()}|${cls}`
  return sentLog().some((e) => e.k === key)
}

export function recordSent(name, cls) {
  const log = sentLog()
  log.push({ t: Date.now(), k: `${name.trim().toLowerCase()}|${cls}` })
  safeSet(SENT_KEY, JSON.stringify(log.slice(-20)))
}
