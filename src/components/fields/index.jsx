import { useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RATING_LABELS, ADEQUACY_LEVELS } from '../../lib/constants'

/** Нэг асуулт: дугаар, гарчиг, тайлбар, алдааны мэдээлэл */
export function Question({ no, title, hint, optional, error, children, as = 'div', labelFor }) {
  const errId = useId()
  const hintId = useId()
  const describedBy = [hint && hintId, error && errId].filter(Boolean).join(' ') || undefined
  const Wrapper = as
  const TitleTag = as === 'fieldset' ? 'legend' : labelFor ? 'label' : 'p'

  return (
    <Wrapper
      className={`m-0 min-w-0 border-0 p-0 ${error ? 'is-invalid' : ''}`}
      aria-describedby={as === 'fieldset' ? describedBy : undefined}
      data-question={no}
    >
      <TitleTag htmlFor={labelFor} className="block p-0 text-[19px] font-bold leading-snug text-ink">
        <span className="mr-2 font-normal text-plum">{no}.</span>
        {title}
        {optional
          ? <span className="ml-2 whitespace-nowrap text-[15px] font-normal text-plum">Заавал биш</span>
          : <span className="sr-only"> (заавал)</span>}
      </TitleTag>
      {hint && <p id={hintId} className="mt-1 text-[15px] text-plum">{hint}</p>}
      <div className="q-body mt-4">
        {typeof children === 'function' ? children({ describedBy }) : children}
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={errId}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 flex items-center gap-2 text-[16px] font-bold text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0" fill="none" stroke="#2E0854" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 7v6M12 16.5v.5" />
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </Wrapper>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

const optVal = (o) => (typeof o === 'string' ? o : o.value)
const optLabel = (o) => (typeof o === 'string' ? o : o.label)

/** Radio сонголтын жагсаалт */
export function RadioList({ name, options, value, onChange, columns = 'sm:grid-cols-2' }) {
  return (
    <div className={`choice-group grid gap-2 ${columns}`}>
      {options.map((o) => {
        const v = optVal(o)
        const checked = value === v
        return (
          <label key={v} className="choice" data-checked={checked}>
            <input type="radio" className="sr-only" name={name} value={v} checked={checked} onChange={() => onChange(v)} />
            <span className="mark mark-radio" aria-hidden="true">
              {checked && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
            <span className="text-[17px]">{optLabel(o)}</span>
          </label>
        )
      })}
    </div>
  )
}

/** Олон сонголттой checkbox жагсаалт */
export function CheckboxList({ options, values, onToggle, columns = 'sm:grid-cols-2' }) {
  return (
    <div className={`choice-group grid gap-2 ${columns}`}>
      {options.map((o) => {
        const checked = values.includes(o)
        return (
          <label key={o} className="choice" data-checked={checked}>
            <input type="checkbox" className="sr-only" checked={checked} onChange={() => onToggle(o)} />
            <span className="mark mark-check" aria-hidden="true">{checked && <CheckIcon />}</span>
            <span className="text-[17px]">{o}</span>
          </label>
        )
      })}
    </div>
  )
}

/** 1–5 оноо: тоотой дугуй товчнууд */
export function RatingCircles({ name, value, onChange }) {
  return (
    <div className="choice-group">
      <div className="flex justify-between gap-2 sm:justify-start sm:gap-4">
        {[1, 2, 3, 4, 5].map((n) => {
          const checked = value === n
          return (
            <label
              key={n}
              data-checked={checked}
              className="grid h-[54px] w-[54px] cursor-pointer place-items-center rounded-full border border-orchid bg-white text-[19px] font-bold text-ink transition-colors hover:border-plum has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-plum data-[checked=true]:border-plum data-[checked=true]:bg-plum data-[checked=true]:text-white"
            >
              <input
                type="radio"
                className="sr-only"
                name={name}
                value={n}
                checked={checked}
                onChange={() => onChange(n)}
                aria-label={`${n} — ${RATING_LABELS[n - 1]}`}
              />
              <span aria-hidden="true">{n}</span>
            </label>
          )
        })}
      </div>
      <div className="mt-3 flex justify-between text-[15px] text-plum sm:max-w-[334px]" aria-hidden="true">
        <span>Муу</span>
        <span>Маш сайн</span>
      </div>
    </div>
  )
}

/** Мөр бүрт Тийм / Хэсэгчлэн / Үгүй */
export function Matrix({ topics, values, onChange, missing = [] }) {
  return (
    <div className="flex flex-col gap-6">
      {topics.map((t) => (
        <fieldset key={t.key} className={`m-0 min-w-0 border-0 p-0 ${missing.includes(t.key) ? 'row-invalid' : ''}`}>
          <legend className="mb-2 p-0 text-[17px] text-ink">{t.label}</legend>
          <div className="choice-group grid grid-cols-3 gap-2">
            {ADEQUACY_LEVELS.map((l) => {
              const checked = values[t.key] === l.value
              return (
                <label key={l.value} className="choice justify-center px-2 text-center" data-checked={checked}>
                  <input type="radio" className="sr-only" name={`adq-${t.key}`} checked={checked} onChange={() => onChange(t.key, l.value)} />
                  <span className="text-[16px]">{l.label}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
      ))}
    </div>
  )
}

/** Тоолууртай олон мөрт текст */
export function CounterTextarea({ id, value, onChange, max, placeholder, describedBy }) {
  const counterId = useId()
  return (
    <div>
      <textarea
        id={id}
        rows={5}
        maxLength={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-describedby={[describedBy, counterId].filter(Boolean).join(' ')}
        className="input min-h-[140px] resize-y leading-relaxed"
      />
      <p id={counterId} className="mt-2 text-right text-[14px] text-plum">
        {value.length}/{max}
      </p>
    </div>
  )
}
