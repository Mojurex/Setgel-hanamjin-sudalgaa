import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// Илгээсний дараах энгийн талархлын хуудас: нэг том тэмдэг, богино текст
export default function ThankYou({ onRestart }) {
  const reduce = useReducedMotion()
  const headRef = useRef(null)
  useEffect(() => { headRef.current?.focus() }, [])

  return (
    <section className="flex min-h-[70dvh] flex-col items-center justify-center py-16 text-center">
      <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true" fill="none" stroke="#6B21A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="56" cy="56" r="52" stroke="#D8B4FE" />
        <motion.path
          d="M36 57 L50 71 L77 42"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
        />
      </svg>
      <h2 ref={headRef} tabIndex={-1} className="mt-8 text-[34px] font-bold text-ink focus:outline-none sm:text-[40px]">
        Танд баярлалаа
      </h2>
      <p className="mt-4 max-w-[420px] text-[18px] text-plum">
        Таны хариулт илгээгдлээ. Санал тань сургуулийн ажлыг сайжруулахад тусална.
      </p>
      <button type="button" className="btn btn-secondary mt-10" onClick={onRestart}>
        Өөр хүүхдийн судалгаа бөглөх
      </button>
    </section>
  )
}
