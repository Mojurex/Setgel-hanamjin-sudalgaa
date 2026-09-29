import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, animate, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import Logo, { Brand } from './Logo'
import PrivacyNote from './PrivacyNote'
import { SCHOOL_NAME } from '../lib/constants'

const EASE = [0.76, 0, 0.24, 1]
const EDGE = 24          // нээгдсэн үед дэлгэцийн дээд/доод талд үлдэх самбарын ирмэг (px)
const FULL_DRAG = 0.6    // дэлгэцийн өндрийн 60%-ийг чирэхэд бүрэн нээгдэнэ
const SNAP = 0.35        // суллахад энэ хэмжээнээс их бол бүрэн нээнэ
const FLICK = 0.4        // px/ms (400px/сек) — үүнээс хурдан шидвэл босгоос үл хамааран нээнэ/хаана
const AUTO_OPEN_MS = 5000
const SEEN_KEY = 'odorlog.portalSeen'
const PANEL_BG = 'linear-gradient(165deg, #2E0854 0%, #4A1580 50%, #6B21A8 100%)'

const clamp01 = (v) => Math.min(1, Math.max(0, v))

/**
 * Хуруугаар нээгдэх портал. Нээгдлийг нэг progress утга (0 хаалттай → 1 нээлттэй) удирдана:
 * дээд самбар дээш, доод самбар доош гулсаж, ард нь нүүр хэсэг ил гарна. Зөвхөн transform, opacity хөдөлнө.
 */
export default function Landing({ startOpen, onStart }) {
  const reduce = useReducedMotion()
  const raw = useMotionValue(startOpen ? 1 : 0)
  const progress = useSpring(raw, { stiffness: 520, damping: 50, mass: 0.6, restDelta: 0.0005 })
  const vh = useMotionValue(typeof window === 'undefined' ? 800 : window.innerHeight)
  const fade = useMotionValue(1) // reduced-motion үеийн энгийн fade

  const topY = useTransform([progress, vh], ([p, h]) => -p * (h / 2 - EDGE))
  const bottomY = useTransform([progress, vh], ([p, h]) => p * (h / 2 - EDGE))
  const lineOpacity = useTransform(progress, [0, 0.12], [0.7, 0])
  const cueOpacity = useTransform(progress, [0, 0.25], [1, 0])
  const handleOpacity = useTransform(progress, [0.85, 1], [0, 1])
  // Нээгдсэн үед ирмэг дээр үсгийн хэлтэрхий үлдээхгүй
  const faceOpacity = useTransform(progress, [0.6, 0.95], [1, 0])
  const contentBase = useTransform(progress, [0.5, 0.95], [0, 1])
  const contentOpacity = useTransform([contentBase, fade], ([a, b]) => a * b)
  const contentY = useTransform(progress, [0.5, 1], [12, 0])

  const [open, setOpen] = useState(Boolean(startOpen))
  const openRef = useRef(Boolean(startOpen))
  const drag = useRef(null)
  const wheelTimer = useRef(0)
  const autoTimer = useRef(0)
  const startBtn = useRef(null)
  const gateRef = useRef(null)

  useEffect(() => {
    const onResize = () => vh.set(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [vh])

  const settled = useCallback((target, focus) => {
    const isOpen = target === 1
    openRef.current = isOpen
    setOpen(isOpen)
    if (isOpen) {
      try { localStorage.setItem(SEEN_KEY, '1') } catch { /* private mode */ }
    }
    if (focus) requestAnimationFrame(() => (isOpen ? startBtn.current : gateRef.current)?.focus({ preventScroll: true }))
  }, [])

  const animateTo = useCallback((target, { focus = true } = {}) => {
    clearTimeout(autoTimer.current) // хэрэглэгч аль хэдийн үйлдэл хийсэн: автомат нээлт хэрэггүй
    raw.stop()
    if (target === 0) { openRef.current = false; setOpen(false) }
    if (reduce) {
      raw.jump(target)
      progress.jump(target)
      if (target === 1) { fade.set(0); animate(fade, 1, { duration: 0.3 }) }
      settled(target, focus)
      return
    }
    const from = raw.get()
    if (Math.abs(from - target) < 0.001) { settled(target, focus); return }
    animate(raw, target, {
      duration: Math.max(0.25, 0.5 * Math.abs(target - from)),
      ease: EASE,
      onComplete: () => settled(target, focus),
    })
  }, [raw, progress, fade, reduce, settled])

  const skip = () => {
    clearTimeout(autoTimer.current)
    raw.stop()
    raw.jump(1)
    progress.jump(1)
    settled(1, true)
  }

  // Хэрэглэгч юу ч хийхгүй бол 5 секундээс удаан гацаахгүй (аливаа үйлдэл хийвэл цуцлагдана)
  useEffect(() => {
    if (startOpen) return undefined
    autoTimer.current = setTimeout(() => {
      if (!openRef.current && !drag.current) animateTo(1)
    }, AUTO_OPEN_MS)
    return () => clearTimeout(autoTimer.current)
  }, [startOpen, animateTo])

  // Гарын дээш/доош сум хаалттай үед нээнэ
  useEffect(() => {
    const onKey = (e) => {
      if (openRef.current || drag.current) return
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); animateTo(1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [animateTo])

  // ---------- Чирэлт (touch + хулгана, pointer events) ----------
  function onPointerDown(e, edge) {
    if (reduce) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    raw.stop()
    clearTimeout(wheelTimer.current)
    clearTimeout(autoTimer.current)
    drag.current = {
      id: e.pointerId,
      y0: e.clientY,
      p0: raw.get(),
      mode: openRef.current ? 'close' : 'open',
      edge,
      samples: [{ y: e.clientY, t: e.timeStamp }],
    }
  }

  function onPointerMove(e) {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dy = e.clientY - d.y0
    const span = FULL_DRAG * vh.get()
    // Нээхэд чиглэл хамаагүй (чирсэн зай), хураахад ирмэгээ дэлгэцийн төв рүү чирнэ
    const p = d.mode === 'open'
      ? d.p0 + Math.abs(dy) / span
      : d.p0 - Math.max(0, d.edge === 'top' ? dy : -dy) / span
    raw.set(clamp01(p))
    d.samples.push({ y: e.clientY, t: e.timeStamp })
    if (d.samples.length > 6) d.samples.shift()
  }

  function onPointerUp(e) {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    // Сүүлийн хөдөлгөөний хурд (px/ms, тэмдэгтэй). Хуруу зогсоод удсан бол 0.
    const last = d.samples[d.samples.length - 1]
    const recent = d.samples.filter((s) => last.t - s.t < 100)
    const a = recent[0]
    const v = e.timeStamp - last.t < 80 && last.t > a.t ? (last.y - a.y) / (last.t - a.t) : 0
    const p = raw.get()
    if (d.mode === 'open') {
      animateTo(p > SNAP || Math.abs(v) > FLICK ? 1 : 0, { focus: p > 0.02 || Math.abs(v) > FLICK })
    } else {
      const flickClose = d.edge === 'top' ? v > FLICK : v < -FLICK
      animateTo(1 - p > SNAP || flickClose ? 0 : 1)
    }
  }

  function onWheel(e) {
    if (reduce || openRef.current || drag.current) return
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
    clearTimeout(autoTimer.current)
    raw.stop()
    raw.set(clamp01(raw.get() + Math.abs(dy) / (FULL_DRAG * vh.get())))
    clearTimeout(wheelTimer.current)
    wheelTimer.current = setTimeout(() => animateTo(raw.get() > SNAP ? 1 : 0), 180)
  }

  const panelProps = (edge) => ({
    onPointerDown: (e) => onPointerDown(e, edge),
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    className: `absolute inset-x-0 h-1/2 overflow-hidden select-none outline-none focus-visible:shadow-[inset_0_0_0_3px_rgba(255,255,255,0.8)] ${reduce ? '' : 'touch-none'} ${edge === 'top' ? 'top-0' : 'bottom-0'} ${reduce ? '' : open ? 'cursor-grab' : 'cursor-grab active:cursor-grabbing'}`,
  })

  return (
    <div className="fixed inset-0 overflow-hidden" onWheel={onWheel}>
      {/* Ард ил гарах нүүр хэсэг */}
      <main
        className="absolute inset-0 flex flex-col px-4"
        style={{ background: 'linear-gradient(180deg, #F5F0FF 0%, #F5F0FF 35%, #D8B4FE 100%)' }}
        inert={!open}
      >
        <motion.div className="flex min-h-0 flex-1 flex-col" style={{ opacity: contentOpacity, y: contentY }}>
          <Brand size={40} className="mx-auto w-full max-w-[640px]" style={{ paddingTop: EDGE + 20 }} />
          <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center py-10 text-center">
            <h1 className="font-bold text-ink">
              <span
                className="block bg-clip-text pb-2 text-[64px] leading-[0.95] tracking-[-0.02em] text-transparent sm:text-[96px]"
                style={{ backgroundImage: 'linear-gradient(100deg, #2E0854 0%, #6B21A8 45%, #A855F7 100%)' }}
              >
                Parents Day
              </span>
              <span className="mt-4 block text-[24px] leading-snug sm:text-[30px]">Өдөрлөгийн судалгаа нээгдлээ</span>
            </h1>
            <p className="mt-4 text-[18px] text-plum">Санал хүсэлтээ үлдээгээрэй</p>
            <button ref={startBtn} type="button" className="btn btn-primary mt-10 min-w-[240px]" onClick={onStart}>
              Судалгаа эхлүүлэх
            </button>
            <p className="mt-4 text-[15px] text-plum">3 алхам, 10 асуулт. Ойролцоогоор 2 минут.</p>
          </div>
          <div className="mx-auto w-full max-w-[640px]" style={{ paddingBottom: EDGE + 20 }}>
            <PrivacyNote />
          </div>
        </motion.div>
      </main>

      {/* Самбарууд. Дээд самбар нь гар/дэлгэц уншигчийн "Судалгааг нээх" товч; доод нь зөвхөн харагдах хуулбар. */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          {...panelProps('top')}
          ref={gateRef}
          role="button"
          tabIndex={open ? -1 : 0}
          aria-label="Судалгааг нээх"
          aria-hidden={open || undefined}
          onKeyDown={(e) => {
            if (open) return
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); animateTo(1) }
          }}
          style={{ y: topY, willChange: 'transform', pointerEvents: 'auto' }}
        >
          <div className="absolute inset-x-0 top-0 h-[200%]" style={{ background: PANEL_BG }}>
            <Face opacity={faceOpacity} />
          </div>
          <motion.span aria-hidden="true" style={{ opacity: handleOpacity }} className="absolute bottom-[9px] left-1/2 h-[5px] w-10 -translate-x-1/2 rounded-full bg-white/70" />
        </motion.div>

        <motion.div {...panelProps('bottom')} aria-hidden="true" style={{ y: bottomY, willChange: 'transform', pointerEvents: 'auto' }}>
          <div className="absolute inset-x-0 -top-full h-[200%]" style={{ background: PANEL_BG }}>
            <Face opacity={faceOpacity} />
          </div>
          <motion.span style={{ opacity: handleOpacity }} className="absolute left-1/2 top-[9px] h-[5px] w-10 -translate-x-1/2 rounded-full bg-white/70" />
        </motion.div>

        {/* Дундах нимгэн цагаан шугам */}
        <motion.span aria-hidden="true" style={{ opacity: lineOpacity }} className="absolute inset-x-0 top-1/2 h-px bg-white" />

        {/* Сануулга + Нээх товч: доод самбартай хамт хөдөлнө, товчноос бусад нь чирэлтэд саад болохгүй */}
        {!open && (
          <motion.div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 text-white" style={{ y: bottomY, opacity: cueOpacity }}>
            {!reduce && (
              <>
                <motion.svg
                  aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.1, ease: 'easeInOut', repeat: 1, delay: 0.6 }}
                >
                  <path d="M6 14l6-6 6 6" />
                </motion.svg>
                <p className="text-[15px] text-white/85">Дээш чирээрэй</p>
              </>
            )}
            <button
              type="button"
              onClick={() => animateTo(1)}
              className="pointer-events-auto min-h-[44px] rounded-xl border border-white/60 px-6 text-[16px] font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-white"
            >
              Нээх
            </button>
          </motion.div>
        )}
      </div>

      {/* Алгасах (хаалттай үед) / Хураах (нээлттэй үед) */}
      {!open ? (
        <motion.button
          type="button"
          onClick={skip}
          style={{ opacity: cueOpacity }}
          className="absolute right-4 top-4 min-h-[44px] rounded-xl border border-white/50 px-4 text-[15px] font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-white"
        >
          Алгасах
        </motion.button>
      ) : (
        <button
          type="button"
          onClick={() => animateTo(0)}
          className="btn btn-text absolute right-2 min-h-[44px] text-[15px]"
          style={{ top: EDGE + 8 }}
        >
          Хураах
        </button>
      )}
    </div>
  )
}

// Хоёр самбарт ижил бүтэн дэлгэцийн нүүр; самбар бүр өөрийн хагасыг л харуулна
function Face({ opacity }) {
  return (
    <motion.div aria-hidden="true" style={{ opacity }} className="absolute inset-0 grid place-items-center px-6 text-center text-white">
      <div className="relative">
        <div className="absolute inset-x-0 bottom-full mb-6 flex flex-col items-center sm:mb-8">
          <Logo size={72} decorative className="h-14 w-14 sm:h-[72px] sm:w-[72px]" />
          <p className="mt-4 text-[15px] tracking-[0.04em] text-white/85 sm:text-[17px]">{SCHOOL_NAME}</p>
        </div>
        <p className="whitespace-nowrap text-[min(19vw,11vh)] font-bold leading-[0.92] tracking-[-0.01em] sm:text-[clamp(56px,min(12vw,17vh),150px)]">
          PARENTS<br />DAY
        </p>
        <p className="absolute inset-x-0 top-full mt-6 whitespace-nowrap text-[18px] font-bold tracking-[0.2em] text-white/90 sm:mt-8 sm:text-[28px]">
          ӨДӨРЛӨГИЙН СУДАЛГАА
        </p>
      </div>
    </motion.div>
  )
}
