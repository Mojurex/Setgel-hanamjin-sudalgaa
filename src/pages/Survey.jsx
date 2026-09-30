import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Landing from '../components/Landing'
import ProgressLine from '../components/ProgressLine'
import PrivacyNote from '../components/PrivacyNote'
import ThankYou from '../components/ThankYou'
import { Brand } from '../components/Logo'
import { Question, RadioList, CheckboxList, RatingCircles, Matrix, CounterTextarea } from '../components/fields'
import {
  GUARDIANS, INFO_SOURCES, DEFAULT_TOPICS, COUNCIL_OPTIONS,
  FEEDBACK_MAX, EMAIL_RE, CLASS_GROUPS, GRADES, groupsOfGrade,
} from '../lib/constants'
import { fetchSubjects, fetchTopics, submitResponse } from '../lib/api'
import { checkGuard, getDeviceId, hasSentStudent, recordSent } from '../lib/guard'
import { isDemo } from '../lib/supabase'

const REQUIRED_MSG = 'Энэ хэсгийг бөглөөрэй'
const OTHER = 'Бусад'
const INTRO = -1
const DONE = 3

const STEPS = [
  { title: 'Үндсэн мэдээлэл', lead: 'Хүүхдийнхээ мэдээллийг оруулна уу.' },
  { title: 'Өдөрлөгийн үнэлгээ', lead: 'Өдөрлөгийн талаарх таны сэтгэгдэл.' },
  { title: 'Санал хүсэлт', lead: 'Сүүлийн алхам.' },
]

const EMPTY = {
  student_name: '',
  grade: '',
  group: '',
  guardian: '',
  guardian_other: '',
  info_sources: [],
  info_source_other: '',
  org_rating: 0,
  info_adequacy: {},
  clear_subjects: [],
  subject_other: '',
  join_council: '',
  feedback: '',
  email: '',
  website: '', // honeypot
}

export default function Survey() {
  const [step, setStep] = useState(INTRO)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState(() => DEFAULT_TOPICS.filter((t) => t.active))
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [dupConfirm, setDupConfirm] = useState(false)
  const [guard, setGuard] = useState(() => checkGuard())
  const headRef = useRef(null)

  useEffect(() => {
    fetchSubjects().then((s) => setSubjects(s.map((x) => x.name)))
    fetchTopics().then((t) => setTopics(t.filter((x) => x.active)))
  }, [])

  // errKey — энэ утга өөрчлөгдөхөд арилгах алдааны түлхүүр
  const set = (k, v, errKey = k) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[errKey]) setErrors((e) => ({ ...e, [errKey]: undefined }))
  }
  // Анги солиход бүлгийг дахин тохируулна (ганц бүлэгтэй бол автоматаар сонгоно)
  const setGrade = (grade) => {
    const opts = groupsOfGrade(grade)
    setForm((f) => ({ ...f, grade, group: opts.length === 1 ? opts[0] : opts.includes(f.group) ? f.group : '' }))
    if (errors.class_group) setErrors((e) => ({ ...e, class_group: undefined }))
  }
  const toggle = (k, v) => set(k, form[k].includes(v) ? form[k].filter((x) => x !== v) : [...form[k], v])

  const classGroup = CLASS_GROUPS.includes(form.group) ? form.group : ''

  function validate(s) {
    const e = {}
    if (s === 0) {
      if (!form.student_name.trim()) e.student_name = REQUIRED_MSG
      if (!classGroup) e.class_group = 'Анги, бүлгээ сонгоорой'
      if (!form.guardian) e.guardian = REQUIRED_MSG
      else if (form.guardian === OTHER && !form.guardian_other.trim()) e.guardian = 'Асран хамгаалагч хэн болохыг бичнэ үү'
    }
    if (s === 1) {
      if (!form.info_sources.length) e.info_sources = REQUIRED_MSG
      else if (form.info_sources.includes(OTHER) && !form.info_source_other.trim()) e.info_sources = '“Бусад” гэснийг бичнэ үү'
      if (!form.org_rating) e.org_rating = 'Оноогоо сонгоорой'
      const missing = topics.filter((t) => !form.info_adequacy[t.key])
      if (missing.length) e.info_adequacy = missing.length === topics.length ? REQUIRED_MSG : 'Бүх чиглэлд хариулна уу'
      if (form.clear_subjects.includes(OTHER) && !form.subject_other.trim()) e.clear_subjects = '“Бусад” хичээлээ бичнэ үү'
    }
    if (s === 2) {
      if (!form.join_council) e.join_council = REQUIRED_MSG
      if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) e.email = 'Мэйл хаяг буруу байна. Жишээ: ner@gmail.com'
    }
    return e
  }

  function fail(e) {
    setErrors(e)
    requestAnimationFrame(() => {
      const el = document.querySelector('.is-invalid')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const target = el?.querySelector('[aria-invalid="true"]') || el?.querySelector('input:not(.sr-only), select, textarea, input')
      target?.focus({ preventScroll: true })
    })
  }

  function goTo(n) {
    setStep(n)
    window.scrollTo({ top: 0 })
    setTimeout(() => headRef.current?.focus({ preventScroll: true }), 300)
  }

  function next() {
    const e = validate(step)
    if (Object.keys(e).length) return fail(e)
    setErrors({})
    goTo(step + 1)
  }

  async function submit() {
    const e = validate(2)
    if (Object.keys(e).length) return fail(e)
    const g = checkGuard()
    if (!g.ok) { setGuard(g); return }
    if (!dupConfirm && hasSentStudent(form.student_name, classGroup)) {
      setDupConfirm(true)
      return
    }
    if (form.website) { goTo(DONE); return } // bot

    setSending(true)
    setSubmitError('')
    try {
      await submitResponse({
        student_name: form.student_name.trim(),
        class_group: classGroup,
        guardian: form.guardian,
        guardian_other: form.guardian === OTHER ? form.guardian_other.trim() : null,
        info_sources: form.info_sources,
        info_source_other: form.info_sources.includes(OTHER) ? form.info_source_other.trim() : null,
        org_rating: form.org_rating,
        // Зөвхөн одоо идэвхтэй чиглэлүүдийн хариулт
        info_adequacy: Object.fromEntries(topics.filter((t) => form.info_adequacy[t.key]).map((t) => [t.key, form.info_adequacy[t.key]])),
        clear_subjects: form.clear_subjects,
        subject_other: form.clear_subjects.includes(OTHER) ? form.subject_other.trim() : null,
        join_council: form.join_council,
        feedback: form.feedback.trim() || null,
        email: form.email.trim() || null,
        device_id: getDeviceId(),
      })
      recordSent(form.student_name, classGroup)
      goTo(DONE)
    } catch (err) {
      if (err.message === 'RATE_LIMIT') setGuard({ ok: false, waitMin: 10 })
      else setSubmitError('Илгээж чадсангүй. Интернэт холболтоо шалгаад дахин илгээнэ үү.')
    } finally {
      setSending(false)
    }
  }

  function restart() {
    setForm(EMPTY)
    setErrors({})
    setDupConfirm(false)
    setSubmitError('')
    setGuard(checkGuard())
    goTo(0)
  }

  if (step === INTRO) return <Landing onStart={() => goTo(0)} />

  const blocked = !guard.ok && step !== DONE
  const cur = STEPS[step]

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pb-20 pt-6">
      <div className="flex items-center justify-between gap-3">
        <Brand size={36} />
        <span className="whitespace-nowrap rounded-full border border-lilac bg-white px-3 py-1 text-[14px] font-bold text-plum">Parents Day</span>
      </div>

      {step === DONE && <ThankYou onRestart={restart} />}

      {blocked && (
        <section className="flex min-h-[60dvh] flex-col justify-center py-16">
          <h2 ref={headRef} tabIndex={-1} className="text-[30px] font-bold text-ink focus:outline-none">Хариулт хүлээн авсан</h2>
          <p className="mt-4 text-[18px] text-plum">
            Та саяхан судалгаа илгээсэн байна. Өөр хүүхдийнхээ судалгааг бөглөх бол {guard.waitMin} минутын дараа дахин оролдоно уу.
          </p>
        </section>
      )}

      {cur && !blocked && (
        <>
          <div className="mt-6">
            <ProgressLine step={step + 1} total={3} />
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={step}
              noValidate
              aria-labelledby="step-title"
              onSubmit={(e) => { e.preventDefault(); if (step < 2) next(); else submit() }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative"
            >
              <h2 id="step-title" ref={headRef} tabIndex={-1} className="mt-10 text-[30px] font-bold text-ink focus:outline-none sm:text-[34px]">
                {cur.title}
              </h2>
              <p className="mt-2 text-[17px] text-plum">{cur.lead}</p>

              <div className="mt-10 flex flex-col gap-12">
                {step === 0 && <Step1 form={form} set={set} setGrade={setGrade} errors={errors} />}
                {step === 1 && <Step2 form={form} set={set} toggle={toggle} errors={errors} subjects={subjects} topics={topics} />}
                {step === 2 && <Step3 form={form} set={set} errors={errors} />}
              </div>

              {/* honeypot */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>Вэбсайт<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} /></label>
              </div>

              {dupConfirm && step === 2 && (
                <Notice>
                  Энэ сурагчийн нэрээр энэ төхөөрөмжөөс өмнө нь илгээсэн байна. Дахин илгээх бол “Илгээх” товчийг дахин дарна уу.
                </Notice>
              )}
              {submitError && <Notice>{submitError}</Notice>}

              <div className="mt-12 flex items-center justify-between gap-3 border-t border-line pt-6">
                {step > 0
                  ? <button type="button" className="btn btn-text" onClick={() => goTo(step - 1)}>Буцах</button>
                  : <span />}
                <button type="submit" className="btn btn-primary min-w-[160px]" disabled={sending}>
                  {step < 2 ? 'Дараах' : sending ? 'Илгээж байна…' : 'Илгээх'}
                </button>
              </div>
            </motion.form>
          </AnimatePresence>

          {step === 2 && <PrivacyNote className="mt-10 !justify-start" />}
          {isDemo && (
            <p className="mt-6 text-[14px] text-plum">Демо горим: Supabase тохируулаагүй тул хариулт зөвхөн энэ хөтөчид хадгалагдана.</p>
          )}
        </>
      )}
    </main>
  )
}

function Notice({ children }) {
  return (
    <p role="alert" className="mt-10 flex items-start gap-3 rounded-xl border-2 border-ink bg-white p-4 text-[16px] text-ink">
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="mt-[2px] shrink-0" fill="none" stroke="#2E0854" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 7v6M12 16.5v.5" />
      </svg>
      <span>{children}</span>
    </p>
  )
}

function OtherInput({ show, value, onChange, label, placeholder, invalid, maxLength = 120 }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <input
            className="input mt-3"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-label={label}
            aria-invalid={invalid || undefined}
            maxLength={maxLength}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Step1({ form, set, setGrade, errors }) {
  const groups = groupsOfGrade(form.grade)
  return (
    <>
      <Question no={1} title="Сурагчийн нэр" error={errors.student_name} labelFor="student_name">
        {({ describedBy }) => (
          <input
            id="student_name"
            className="input"
            value={form.student_name}
            onChange={(e) => set('student_name', e.target.value)}
            placeholder="Жишээ: Бат-Эрдэнэ Тэмүүлэн"
            autoComplete="off"
            maxLength={120}
            aria-required="true"
            aria-invalid={!!errors.student_name}
            aria-describedby={describedBy}
          />
        )}
      </Question>

      <Question no={2} title="Анги, бүлэг" error={errors.class_group} as="fieldset">
        {({ describedBy }) => (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2 text-[15px] text-plum">
              Анги
              <select
                className="input"
                value={form.grade}
                onChange={(e) => setGrade(e.target.value)}
                aria-required="true"
                aria-invalid={!!errors.class_group && !form.grade}
                aria-describedby={describedBy}
              >
                <option value="">Сонгох</option>
                {GRADES.map((g) => <option key={g} value={g}>{g}-р анги</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-[15px] text-plum">
              Бүлэг
              <select
                className="input"
                value={form.group}
                onChange={(e) => set('group', e.target.value, 'class_group')}
                disabled={!form.grade}
                aria-required="true"
                aria-invalid={!!errors.class_group && !!form.grade}
                aria-describedby={describedBy}
              >
                <option value="">{form.grade ? 'Сонгох' : 'Эхлээд анги'}</option>
                {groups.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
          </div>
        )}
      </Question>

      <Question no={3} title="Асран хамгаалагч хэн болох вэ?" error={errors.guardian} as="fieldset">
        <RadioList name="guardian" options={GUARDIANS} value={form.guardian} onChange={(v) => set('guardian', v)} />
        <OtherInput
          show={form.guardian === OTHER}
          value={form.guardian_other}
          onChange={(v) => set('guardian_other', v, 'guardian')}
          label="Бусад асран хамгаалагч"
          placeholder="Хэн болохыг бичнэ үү. Жишээ: авга ах"
          invalid={!!errors.guardian && form.guardian === OTHER}
          maxLength={80}
        />
      </Question>
    </>
  )
}

function Step2({ form, set, toggle, errors, subjects, topics }) {
  const subjectOptions = [...subjects.filter((s) => s !== OTHER), OTHER]
  const missing = errors.info_adequacy ? topics.filter((t) => !form.info_adequacy[t.key]).map((t) => t.key) : []
  return (
    <>
      <Question no={4} title="Өдөрлөгийн талаарх мэдээллийг хаанаас авсан бэ?" hint="Хэд хэдэн хариулт сонгож болно." error={errors.info_sources} as="fieldset">
        <CheckboxList options={INFO_SOURCES} values={form.info_sources} onToggle={(v) => toggle('info_sources', v)} columns="" />
        <OtherInput
          show={form.info_sources.includes(OTHER)}
          value={form.info_source_other}
          onChange={(v) => set('info_source_other', v, 'info_sources')}
          label="Бусад эх сурвалж"
          placeholder="Хаанаас авснаа бичнэ үү"
          invalid={!!errors.info_sources && form.info_sources.includes(OTHER)}
        />
      </Question>

      <Question no={5} title="Хурлын ерөнхий зохион байгуулалт хэр санагдсан бэ?" error={errors.org_rating} as="fieldset">
        <RatingCircles name="org_rating" value={form.org_rating} onChange={(v) => set('org_rating', v)} />
      </Question>

      {topics.length > 0 && (
        <Question no={6} title="Дараах чиглэлээр хангалттай мэдээлэл авч чадсан уу?" error={errors.info_adequacy} as="fieldset">
          <Matrix
            topics={topics}
            values={form.info_adequacy}
            missing={missing}
            onChange={(k, v) => set('info_adequacy', { ...form.info_adequacy, [k]: v })}
          />
        </Question>
      )}

      <Question no={7} title="Аль хичээлийн мэдээлэл ойлгомжтой байсан бэ?" hint="Хэд хэдэн хичээл сонгож болно." optional error={errors.clear_subjects} as="fieldset">
        <CheckboxList options={subjectOptions} values={form.clear_subjects} onToggle={(v) => toggle('clear_subjects', v)} />
        <OtherInput
          show={form.clear_subjects.includes(OTHER)}
          value={form.subject_other}
          onChange={(v) => set('subject_other', v, 'clear_subjects')}
          label="Бусад хичээл"
          placeholder="Хичээлийн нэрийг бичнэ үү"
          invalid={!!errors.clear_subjects}
        />
      </Question>
    </>
  )
}

function Step3({ form, set, errors }) {
  const wantsContact = form.join_council === 'yes' || form.join_council === 'maybe'
  return (
    <>
      <Question no={8} title="Та эцэг эхийн зөвлөлд нэгдэх хүсэлтэй байна уу?" error={errors.join_council} as="fieldset">
        <RadioList name="join_council" options={COUNCIL_OPTIONS} value={form.join_council} onChange={(v) => set('join_council', v)} columns="sm:grid-cols-3" />
      </Question>

      <Question no={9} title="Санал хүсэлт" hint="Дэлгэрэнгүй бичиж болно." optional error={errors.feedback} labelFor="feedback">
        {({ describedBy }) => (
          <CounterTextarea
            id="feedback"
            value={form.feedback}
            onChange={(v) => set('feedback', v)}
            max={FEEDBACK_MAX}
            placeholder="Санал хүсэлтээ энд бичнэ үү"
            describedBy={describedBy}
          />
        )}
      </Question>

      <Question
        no={10}
        title="Хариу авах мэйл хаяг"
        hint={wantsContact
          ? 'Эцэг эхийн зөвлөлийн талаар тантай холбогдохын тулд мэйлээ үлдээнэ үү.'
          : 'Санал хүсэлтийнхээ хариуг авахыг хүсвэл бөглөнө үү.'}
        optional
        error={errors.email}
        labelFor="email"
      >
        {({ describedBy }) => (
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="input"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="ner@gmail.com"
            aria-invalid={!!errors.email}
            aria-describedby={describedBy}
          />
        )}
      </Question>
    </>
  )
}
