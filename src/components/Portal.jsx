import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SCHOOL_NAME } from '../lib/constants'
import Logo from './Logo'

const EASE = [0.76, 0, 0.24, 1]
const HOLD = 0.45      // хаалттай төлөвт зогсох хугацаа (сек)
const OPEN = 1.2       // самбар нээгдэх хугацаа
const REVEAL_AT = 1.2  // ард нь байгаа текст гарч эхлэх мөч

const PANEL_BG = 'linear-gradient(135deg, #2E0854 0%, #4A1580 55%, #6B21A8 100%)'

/**
 * Хоёр хагас самбараар хаагдсан нээлт. Wordmark дундаасаа хуваагдаж,
 * том дэлгэцэнд зүүн/баруун, утсанд дээш/доош гулсана. Зөвхөн transform, opacity хөдөлнө.
 */
export default function Portal({ onReveal, onDone }) {
  const reduce = useReducedMotion()
  const [stacked] = useState(() => window.matchMedia('(max-width: 639px)').matches)
  const [skipping, setSkipping] = useState(false)

  useEffect(() => {
    const revealAt = reduce ? 500 : REVEAL_AT * 1000
    const doneAt = reduce ? 800 : (HOLD + OPEN) * 1000
    const t1 = setTimeout(onReveal, revealAt)
    const t2 = setTimeout(onDone, doneAt)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [reduce, onReveal, onDone])

  function skip() {
    onReveal()
    setSkipping(true)
  }

  const axis = stacked ? 'y' : 'x'
  const slide = (dir) => (reduce ? {} : { [axis]: `${dir * 100}%` })
  const panelTransition = { delay: HOLD, duration: OPEN, ease: EASE }

  // Хагас бүрийн дотор бүтэн дэлгэцийн нүүрийг байрлуулж, хагасаар нь харуулна
  const halves = stacked
    ? [
        { outer: { top: 0, left: 0, width: '100vw', height: '50dvh' }, inner: { top: 0 }, dir: -1 },
        { outer: { top: '50dvh', left: 0, width: '100vw', height: '50dvh' }, inner: { top: '-50dvh' }, dir: 1 },
      ]
    : [
        { outer: { top: 0, left: 0, width: '50vw', height: '100dvh' }, inner: { left: 0 }, dir: -1 },
        { outer: { top: 0, left: '50vw', width: '50vw', height: '100dvh' }, inner: { left: '-50vw' }, dir: 1 },
      ]

  return (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: skipping ? 0 : reduce ? [1, 1, 0] : 1 }}
      transition={skipping ? { duration: 0.2 } : reduce ? { duration: 0.8, times: [0, 0.4, 1] } : { duration: 0 }}
      onAnimationComplete={() => { if (skipping) onDone() }}
      style={{ pointerEvents: 'none' }}
    >
      {halves.map((h, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          className="absolute overflow-hidden"
          style={{ ...h.outer, willChange: 'transform' }}
          initial={{ [axis]: '0%' }}
          animate={slide(h.dir)}
          transition={panelTransition}
        >
          <div className="absolute" style={{ ...h.inner, width: '100vw', height: '100dvh', background: PANEL_BG }}>
            <Face />
          </div>
        </motion.div>
      ))}

      {/* дундуур нимгэн цагаан шугам */}
      <motion.span
        aria-hidden="true"
        className="absolute bg-white/70"
        style={stacked
          ? { top: '50%', left: 0, width: '100vw', height: 1, originX: 0.5 }
          : { left: '50%', top: 0, width: 1, height: '100dvh', originY: 0.5 }}
        initial={reduce ? { opacity: 1 } : { [stacked ? 'scaleX' : 'scaleY']: 0, opacity: 1 }}
        animate={reduce ? { opacity: 1 } : { [stacked ? 'scaleX' : 'scaleY']: 1, opacity: [1, 1, 0] }}
        transition={reduce ? {} : {
          [stacked ? 'scaleX' : 'scaleY']: { duration: 0.4, ease: EASE },
          opacity: { duration: HOLD + 0.35, times: [0, 0.8, 1] },
        }}
      />

      {/* самбар нээгдэж эхлэхэд хамт алга болно */}
      <motion.button
        type="button"
        onClick={skip}
        className="absolute right-4 top-4 min-h-[44px] rounded-xl border border-white/50 px-4 text-[15px] font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-white"
        style={{ pointerEvents: 'auto' }}
        initial={{ opacity: 1 }}
        animate={{ opacity: reduce ? 1 : 0 }}
        transition={{ delay: HOLD + 0.2, duration: 0.3 }}
      >
        Алгасах
      </motion.button>
    </motion.div>
  )
}

function Face() {
  return (
    <div className="absolute inset-0 grid place-items-center px-6 text-center text-white">
      <div className="relative">
        <div className="absolute inset-x-0 bottom-full mb-5 flex flex-col items-center gap-4 sm:mb-6">
          <Logo size={72} decorative className="h-14 w-14 sm:h-[72px] sm:w-[72px]" />
          <p className="text-[15px] tracking-[0.04em] text-white/85 sm:text-[17px]">{SCHOOL_NAME}</p>
        </div>
        <p className="whitespace-nowrap text-[11vw] font-bold leading-[1.02] tracking-[0.02em] sm:text-[clamp(40px,6vw,80px)]">
          ӨДӨРЛӨГИЙН<br className="sm:hidden" /><span className="hidden sm:inline"> </span>СУДАЛГАА
        </p>
      </div>
    </div>
  )
}
