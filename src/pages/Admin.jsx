import { useEffect, useMemo, useState } from 'react'
import { ChartPanel, HBar, StackedAdequacy, Donut } from '../components/Charts'
import ListEditor from '../components/ListEditor'
import {
  SCHOOL_NAME, GUARDIANS, INFO_SOURCES, ADEQUACY_LEVELS, COUNCIL_OPTIONS,
  CLASS_GROUPS, GRADES, gradeOf,
} from '../lib/constants'
import {
  currentAdmin, signIn, signOut, fetchResponses, fetchSubjects, addSubject, removeSubject, renameSubject,
  fetchTopics, addTopic, renameTopic, setTopicActive,
} from '../lib/api'
import { topicsForReport } from '../lib/topics'
import { isDemo } from '../lib/supabase'
import { downloadCsv } from '../lib/csv'

const COUNCIL_LABEL = Object.fromEntries(COUNCIL_OPTIONS.map((o) => [o.value, o.label]))
const p2 = (n) => String(n).padStart(2, '0')
const fmtDate = (s) => {
  const d = new Date(s)
  return `${d.getFullYear()}.${p2(d.getMonth() + 1)}.${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`
}
const guardianName = (r) => (r.guardian === 'Бусад' ? r.guardian_other || 'Бусад' : r.guardian)
const pct = (v, t) => (t ? `${Math.round((v / t) * 100)}%` : '0%')

export default function Admin() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    currentAdmin().then(setUser).catch(() => setUser(null))
  }, [])

  if (user === undefined) return <p className="p-10 text-center text-plum">Шалгаж байна…</p>
  if (!user) return <Login onDone={setUser} />
  return <Dashboard onLogout={async () => { await signOut(); setUser(null) }} />
}

function Login({ onDone }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      onDone(await signIn(email.trim(), password))
    } catch (ex) {
      setErr(ex.message === 'NOT_ADMIN' ? 'Энэ хэрэглэгчид админ эрх олгоогүй байна.' : 'Мэйл эсвэл нууц үг буруу байна.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-[420px] flex-col justify-center px-4 py-12">
      <p className="text-[15px] text-plum">{SCHOOL_NAME}</p>
      <h1 className="mt-2 text-[32px] font-bold text-ink">Админ нэвтрэх</h1>
      <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
        {!isDemo && (
          <label className="flex flex-col gap-2 text-[15px] text-ink">
            Мэйл
            <input className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
        )}
        <label className="flex flex-col gap-2 text-[15px] text-ink">
          Нууц үг
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {err && <p role="alert" className="rounded-xl border-2 border-ink bg-white p-3 text-[15px] font-bold text-ink">{err}</p>}
        <button type="submit" className="btn btn-primary mt-2" disabled={busy}>{busy ? 'Шалгаж байна…' : 'Нэвтрэх'}</button>
        {isDemo && <p className="text-[14px] text-plum">Демо горим. Нууц үг: .env доторх VITE_DEMO_ADMIN_PASSWORD (анхдагч: amjilt2026).</p>}
      </form>
    </main>
  )
}

function Dashboard({ onLogout }) {
  const [rows, setRows] = useState([])
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [grade, setGrade] = useState('')
  const [group, setGroup] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [r, s, t] = await Promise.all([fetchResponses(), fetchSubjects(), fetchTopics()])
      setRows(r)
      setSubjects(s)
      setTopics(t)
    } catch {
      setError('Өгөгдөл татаж чадсангүй. Дахин “Шинэчлэх” дарна уу.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const groups = useMemo(() => {
    // Тогтсон жагсаалт + өгөгдөлд байгаа бусад (хуучин) бүлэг
    const set = new Set([...CLASS_GROUPS, ...rows.map((r) => r.class_group)])
    return [...set]
      .filter((c) => !grade || gradeOf(c) === grade)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [rows, grade])

  const filtered = useMemo(() => rows.filter((r) => {
    if (group) return r.class_group === group
    if (grade) return gradeOf(r.class_group) === grade
    return true
  }), [rows, grade, group])

  const reportTopics = useMemo(() => topicsForReport(filtered, topics), [filtered, topics])
  const stats = useMemo(() => computeStats(filtered, subjects, reportTopics), [filtered, subjects, reportTopics])
  // Хүснэгт уншигдахгүй бол кодын нөөц жагсаалт (id < 0) ирнэ: засах боломжгүй
  const topicsMissing = !isDemo && topics.length > 0 && topics.every((t) => t.id < 0)
  const scopeLabel = group ? `${group} бүлэг` : grade ? `${grade}-р анги` : 'Бүх анги'

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 pb-20 pt-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[15px] text-plum">{SCHOOL_NAME}</p>
          <h1 className="mt-1 text-[30px] font-bold text-ink sm:text-[36px]">Өдөрлөгийн судалгааны үр дүн</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>{loading ? 'Ачаалж байна…' : 'Шинэчлэх'}</button>
          <button type="button" className="btn btn-primary" onClick={() => downloadCsv(filtered, scopeLabel, reportTopics)} disabled={!filtered.length}>Excel татах (CSV)</button>
          <button type="button" className="btn btn-text" onClick={onLogout}>Гарах</button>
        </div>
      </header>

      {/* Шүүлтүүр */}
      <div className="mt-8 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-2 text-[15px] text-ink">
          Анги
          <select className="input min-w-[150px]" value={grade} onChange={(e) => { setGrade(e.target.value); setGroup('') }}>
            <option value="">Бүгд</option>
            {GRADES.map((g) => <option key={g} value={g}>{g}-р анги</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-[15px] text-ink">
          Бүлэг
          <select className="input min-w-[150px]" value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">Бүгд</option>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        {(grade || group) && (
          <button type="button" className="btn btn-text" onClick={() => { setGrade(''); setGroup('') }}>
            Шүүлтүүр цэвэрлэх
          </button>
        )}
        <p className="ml-auto pb-3 text-[15px] text-plum" aria-live="polite">
          {scopeLabel}: <b className="text-ink">{stats.total}</b> хариулт
        </p>
      </div>

      {error && <p role="alert" className="mt-6 rounded-xl border-2 border-ink bg-white p-4 font-bold text-ink">{error}</p>}
      {isDemo && <p className="mt-4 text-[14px] text-plum">Демо горим: өгөгдөл зөвхөн энэ хөтөчийн localStorage-д хадгалагдаж байна.</p>}

      {/* Гол үзүүлэлт */}
      <section aria-label="Гол үзүүлэлт" className="panel mt-6 grid grid-cols-2 lg:grid-cols-4">
        <Stat label="Нийт хариулт" value={stats.total} className="border-b border-r border-line lg:border-b-0" />
        <Stat label="Зохион байгуулалтын дундаж оноо" value={stats.avg ? stats.avg.toFixed(1) : '–'} suffix="/ 5" className="border-b border-line lg:border-b-0 lg:border-r" />
        <Stat label="Зөвлөлд нэгдэх хүсэлтэй" value={stats.councilYes} sub={`Бодоод үзнэ: ${stats.councilMaybe}`} className="border-r border-line" />
        <Stat label="Санал хүсэлт үлдээсэн" value={stats.feedbackCount} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartPanel
          title="Мэдээлэл авсан суваг"
          subtitle="Нэг эцэг эх хэд хэдэн суваг сонгож болно"
          empty={!stats.total}
          table={{ columns: ['Суваг', 'Тоо', 'Хувь'], rows: stats.channels.map((d) => [d.name, d.value, pct(d.value, stats.total)]) }}
        >
          <HBar id="ch" data={stats.channels} total={stats.total} />
        </ChartPanel>

        <ChartPanel
          title="Асран хамгаалагч"
          empty={!stats.total}
          table={{ columns: ['Асран хамгаалагч', 'Тоо', 'Хувь'], rows: stats.guardians.map((d) => [d.name, d.value, pct(d.value, stats.total)]) }}
        >
          <Donut data={stats.guardians} total={stats.total} />
        </ChartPanel>

        <ChartPanel
          title="Мэдээллийн хангалттай байдал"
          subtitle="Чиглэл тус бүрээр, хариултын эзлэх хувь"
          empty={!stats.total}
          table={{
            columns: ['Чиглэл', ...ADEQUACY_LEVELS.map((l) => l.label)],
            rows: stats.adequacy.map((d) => [d.name, ...ADEQUACY_LEVELS.map((l) => `${d[l.value]} (${pct(d[l.value], d.n)})`)]),
          }}
        >
          <StackedAdequacy data={stats.adequacy} levels={ADEQUACY_LEVELS} />
        </ChartPanel>

        <ChartPanel
          title="Ойлгомжтой байсан хичээл"
          subtitle="Хичээл бүрийг сонгосон эцэг эхийн тоо"
          empty={!stats.total}
          table={{ columns: ['Хичээл', 'Тоо', 'Хувь'], rows: stats.subjects.map((d) => [d.name, d.value, pct(d.value, stats.total)]) }}
        >
          <HBar id="subj" data={stats.subjects} total={stats.total} />
        </ChartPanel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3"><FeedbackList rows={filtered} /></div>
        <div className="lg:col-span-2"><CouncilList rows={filtered} /></div>
      </div>

      <h2 className="mt-12 text-[22px] font-bold text-ink">Судалгааны тохиргоо</h2>
      <p className="mt-1 text-[15px] text-plum">Дараагийн судалгаанд асуултын сонголтуудыг эндээс өөрчилнө. Код засах шаардлагагүй.</p>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <ListEditor
          title="6-р асуултын чиглэлүүд"
          description="“Дараах чиглэлээр хангалттай мэдээлэл авч чадсан уу?” асуултын мөрүүд. Хассан чиглэлийн өмнөх хариултууд тайланд хэвээр үлдэнэ."
          items={topics}
          onChange={setTopics}
          onAdd={addTopic}
          onRename={renameTopic}
          onRemove={(t) => setTopicActive(t.id, false)}
          onRestore={(t) => setTopicActive(t.id, true)}
          addPlaceholder="Шинэ чиглэлийн нэр"
          addButton="Чиглэл нэмэх"
          removeConfirm={(label) => `“${label}” чиглэлийг судалгаанаас хасах уу? Өмнөх хариултууд устахгүй.`}
          disabledNote={topicsMissing ? 'Supabase дээр adequacy_topics хүснэгт алга байна. supabase/schema.sql-ийг SQL Editor дээр дахин ажиллуулна уу.' : ''}
        />
        <ListEditor
          title="7-р асуултын хичээлүүд"
          description="“Аль хичээлийн мэдээлэл ойлгомжтой байсан бэ?” асуултын сонголтууд. “Бусад” автоматаар нэмэгдэнэ."
          items={subjects.map((s) => ({ id: s.id, label: s.name }))}
          onChange={setSubjects}
          onAdd={addSubject}
          onRename={renameSubject}
          onRemove={(s) => removeSubject(s.id)}
          addPlaceholder="Шинэ хичээлийн нэр"
          addButton="Хичээл нэмэх"
          removeConfirm={(label) => `“${label}” хичээлийг жагсаалтаас хасах уу?`}
        />
      </div>
    </main>
  )
}

function Stat({ label, value, suffix, sub, className = '' }) {
  return (
    <div className={`p-5 sm:p-6 ${className}`}>
      <p className="text-[14px] text-plum">{label}</p>
      <p className="mt-2 text-[34px] font-bold leading-none tabular-nums text-ink sm:text-[40px]">
        {value}
        {suffix && <span className="ml-1 text-[17px] font-normal text-plum">{suffix}</span>}
      </p>
      {sub && <p className="mt-2 text-[14px] text-plum">{sub}</p>}
    </div>
  )
}

function computeStats(rows, subjects, topics) {
  const total = rows.length
  const rated = rows.filter((r) => r.org_rating)
  const avg = rated.length ? rated.reduce((s, r) => s + r.org_rating, 0) / rated.length : 0

  const channels = INFO_SOURCES.map((name) => ({
    name,
    value: rows.filter((r) => r.info_sources?.includes(name)).length,
  }))

  const guardians = GUARDIANS.map((name, idx) => ({ name, idx, value: rows.filter((r) => r.guardian === name).length }))

  const adequacy = topics.map((t) => {
    const row = { name: t.label, n: 0 }
    for (const l of ADEQUACY_LEVELS) {
      row[l.value] = rows.filter((r) => r.info_adequacy?.[t.key] === l.value).length
      row.n += row[l.value]
    }
    return row
  })

  // Одоогийн жагсаалт + өгөгдөлд байгаа (устгагдсан) хичээлүүд, "Бусад" төгсгөлд
  const names = subjects.map((s) => s.name)
  for (const r of rows) for (const s of r.clear_subjects || []) if (!names.includes(s) && s !== 'Бусад') names.push(s)
  names.push('Бусад')
  const subjStats = names
    .map((name) => ({ name, value: rows.filter((r) => r.clear_subjects?.includes(name)).length }))
    .sort((a, b) => (a.name === 'Бусад') - (b.name === 'Бусад') || b.value - a.value)

  return {
    total,
    avg,
    councilYes: rows.filter((r) => r.join_council === 'yes').length,
    councilMaybe: rows.filter((r) => r.join_council === 'maybe').length,
    feedbackCount: rows.filter((r) => r.feedback?.trim()).length,
    channels,
    guardians,
    adequacy,
    subjects: subjStats,
  }
}

function FeedbackList({ rows }) {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows.filter((r) => r.feedback?.trim()).filter((r) =>
      !s || [r.feedback, r.student_name, r.class_group, r.email].some((v) => v?.toLowerCase().includes(s)))
  }, [rows, q])

  return (
    <section className="panel p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-ink">Санал хүсэлт <span className="font-normal text-plum">({list.length})</span></h2>
        <input
          className="input max-w-[260px]"
          type="search"
          placeholder="Хайх"
          aria-label="Санал хүсэлтээс хайх"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <ul className="max-h-[560px] divide-y divide-line overflow-auto">
        {list.length === 0 && (
          <li className="py-10 text-center text-plum">{q ? 'Хайлтад тохирох санал алга.' : 'Санал хүсэлт ирэхээр энд харагдана.'}</li>
        )}
        {list.map((r) => (
          <li key={r.id} className="py-4">
            <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-ink">{r.feedback}</p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-plum">
              <span>{r.student_name}, {r.class_group}</span>
              <span>{guardianName(r)}</span>
              {r.org_rating && <span>Оноо {r.org_rating}/5</span>}
              <span>{fmtDate(r.created_at)}</span>
              {r.email && <a className="text-plum underline underline-offset-2 hover:text-ink" href={`mailto:${r.email}`}>{r.email}</a>}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function CouncilList({ rows }) {
  const list = rows
    .filter((r) => r.join_council === 'yes' || r.join_council === 'maybe')
    .sort((a, b) => (a.join_council === 'yes' ? 0 : 1) - (b.join_council === 'yes' ? 0 : 1))
  return (
    <section className="panel p-5 sm:p-6">
      <h2 className="mb-4 text-[18px] font-bold text-ink">Эцэг эхийн зөвлөл <span className="font-normal text-plum">({list.length})</span></h2>
      {list.length === 0
        ? <p className="py-10 text-center text-plum">Зөвлөлд нэгдэх хүсэлт одоогоор алга.</p>
        : (
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full border-collapse text-left text-[15px]">
              <thead>
                <tr className="border-b border-lilac text-ink">
                  <th className="py-2 pr-3 font-bold">Асран хамгаалагч</th>
                  <th className="py-2 pr-3 font-bold">Хариулт</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-line align-top">
                    <td className="py-3 pr-3">
                      <span className="font-bold text-ink">{guardianName(r)}</span>
                      <span className="block text-[14px] text-plum">{r.student_name}, {r.class_group}</span>
                      {r.email
                        ? <a href={`mailto:${r.email}`} className="block break-all text-[14px] text-plum underline underline-offset-2 hover:text-ink">{r.email}</a>
                        : <span className="block text-[14px] text-plum">Мэйл үлдээгээгүй</span>}
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap">
                      <span className={`inline-block rounded-lg px-2 py-0.5 text-[14px] font-bold ${r.join_council === 'yes' ? 'bg-plum text-white' : 'border border-orchid text-ink'}`}>
                        {COUNCIL_LABEL[r.join_council]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </section>
  )
}
