// Тайлан (график, CSV)-д орох чиглэлүүд: идэвхтэй бүх чиглэл + хариултад байгаа хасагдсан чиглэлүүд.
export function topicsForReport(rows, topics) {
  const used = new Set(rows.flatMap((r) => Object.keys(r.info_adequacy || {})))
  const known = new Set(topics.map((t) => t.key))
  const list = topics
    .filter((t) => t.active || used.has(t.key))
    .map((t) => (t.active ? t : { ...t, label: `${t.label} (хасагдсан)` }))
  for (const key of used) if (!known.has(key)) list.push({ key, label: key, active: false, sort: 999 })
  return list
}
