import { useState } from 'react'

/**
 * Админы жагсаалт засагч (хичээл, 6-р асуултын чиглэл).
 * items: [{ id, label, active? }]; бүх үйлдэл шинэ жагсаалт буцаах Promise.
 * onRestore өгвөл хасах нь нуух (active=false) бөгөөд хасагдсан мөрүүдийг сэргээж болно.
 */
export default function ListEditor({
  title, description, items, onChange, onAdd, onRename, onRemove, onRestore,
  addPlaceholder, addButton, removeConfirm, disabledNote,
}) {
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const shown = items.filter((i) => i.active !== false)
  const hidden = onRestore ? items.filter((i) => i.active === false) : []
  const disabled = Boolean(disabledNote) || busy

  async function run(fn) {
    setErr('')
    setBusy(true)
    try { onChange(await fn()) } catch { setErr('Хадгалж чадсангүй. Ижил нэр аль хэдийн байгаа эсэхийг шалгана уу (хасагдсан жагсаалтад ч байж болно).') }
    finally { setBusy(false) }
  }

  return (
    <section className="panel p-5 sm:p-6">
      <h2 className="text-[18px] font-bold text-ink">{title}</h2>
      <p className="mt-1 text-[14px] text-plum">{description}</p>
      {disabledNote && <p role="alert" className="mt-3 rounded-xl border-2 border-ink bg-white p-3 text-[15px] font-bold text-ink">{disabledNote}</p>}

      <ul className="mt-4 flex flex-col divide-y divide-line">
        {shown.map((s) => (
          <li key={s.id} className="flex min-h-[48px] items-center gap-1">
            {editing?.id === s.id ? (
              <form
                className="flex flex-1 items-center gap-1"
                onSubmit={(e) => { e.preventDefault(); const v = editing.label.trim(); if (v && v !== s.label) run(() => onRename(s.id, v)); setEditing(null) }}
              >
                <input className="input !min-h-[44px] flex-1 !py-2" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} aria-label="Шинэ нэр" maxLength={80} autoFocus />
                <button type="submit" className="btn btn-text !px-3 text-[15px]">Хадгалах</button>
                <button type="button" className="btn btn-text !px-3 text-[15px]" onClick={() => setEditing(null)}>Болих</button>
              </form>
            ) : (
              <>
                <span className="flex-1 py-2 text-[16px] text-ink">{s.label}</span>
                <button type="button" disabled={disabled} className="btn btn-text !px-3 text-[15px]" onClick={() => setEditing({ id: s.id, label: s.label })} aria-label={`${s.label} засах`}>
                  Засах
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  className="btn btn-text !px-3 text-[15px]"
                  onClick={() => { if (confirm(removeConfirm(s.label))) run(() => onRemove(s)) }}
                  aria-label={`${s.label} хасах`}
                >
                  Хасах
                </button>
              </>
            )}
          </li>
        ))}
        {shown.length === 0 && <li className="py-4 text-plum">Жагсаалт хоосон байна. Доороос нэмнэ үү.</li>}
      </ul>

      <form
        className="mt-4 flex flex-wrap gap-2"
        onSubmit={(e) => { e.preventDefault(); const v = name.trim(); if (!v) return; run(() => onAdd(v)); setName('') }}
      >
        <input className="input max-w-[320px] flex-1" placeholder={addPlaceholder} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-label={addPlaceholder} disabled={Boolean(disabledNote)} />
        <button type="submit" className="btn btn-secondary" disabled={disabled}>{addButton}</button>
      </form>

      {hidden.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-[14px] text-plum">Хасагдсан (судалгаанд харагдахгүй, өмнөх хариулт нь тайланд хэвээр):</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {hidden.map((s) => (
              <li key={s.id} className="flex items-center gap-1 rounded-xl border border-line bg-white pl-3">
                <span className="text-[15px] text-plum">{s.label}</span>
                <button type="button" disabled={disabled} className="btn btn-text !min-h-[44px] !px-3 text-[15px]" onClick={() => run(() => onRestore(s))}>
                  Сэргээх
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {err && <p role="alert" className="mt-3 font-bold text-ink">{err}</p>}
    </section>
  )
}
