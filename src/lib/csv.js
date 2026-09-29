import { ADEQUACY_TOPICS, ADEQUACY_LEVELS, COUNCIL_OPTIONS } from './constants'

const ADQ = Object.fromEntries(ADEQUACY_LEVELS.map((o) => [o.value, o.label]))
const COUNCIL = Object.fromEntries(COUNCIL_OPTIONS.map((o) => [o.value, o.label]))

const cell = (v) => {
  const s = v == null ? '' : String(v)
  // Excel-ийн томьёо гүйцэтгэхээс сэргийлэх
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

// "1-2", "12-3" зэргийг Excel огноо болгохоос сэргийлж ="…" хэлбэрээр текст болгоно
const textCell = (v) => (v ? `"=""${String(v).replace(/"/g, '')}"""` : '""')
const CLASS_COL = 2

export function downloadCsv(rows, scope = '') {
  const header = [
    'Огноо', 'Сурагчийн нэр', 'Анги бүлэг', 'Асран хамгаалагч', 'Мэдээлэл авсан суваг',
    'Зохион байгуулалт (1-5)',
    ...ADEQUACY_TOPICS.map((t) => `Мэдээлэл: ${t.label}`),
    'Ойлгомжтой хичээл', 'Эцэг эхийн зөвлөл', 'Санал хүсэлт', 'Мэйл',
  ]
  const lines = rows.map((r) => [
    new Date(r.created_at).toLocaleString('mn-MN'),
    r.student_name,
    r.class_group,
    r.guardian === 'Бусад' && r.guardian_other ? `Бусад: ${r.guardian_other}` : r.guardian,
    (r.info_sources || []).map((s) => (s === 'Бусад' && r.info_source_other ? `Бусад: ${r.info_source_other}` : s)).join('; '),
    r.org_rating ?? '',
    ...ADEQUACY_TOPICS.map((t) => ADQ[r.info_adequacy?.[t.key]] ?? ''),
    (r.clear_subjects || []).map((s) => (s === 'Бусад' && r.subject_other ? `Бусад: ${r.subject_other}` : s)).join('; '),
    COUNCIL[r.join_council] ?? '',
    r.feedback ?? '',
    r.email ?? '',
  ])
  const csv = '﻿' + [
    header.map(cell).join(','),
    ...lines.map((l) => l.map((v, i) => (i === CLASS_COL ? textCell(v) : cell(v))).join(',')),
  ].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  const date = new Date().toISOString().slice(0, 10)
  a.download = `odorlog-sudalgaa_${scope.replace(/\s+/g, '-')}_${date}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
