import { motion } from 'framer-motion'

// Нимгэн явцын шугам (зөвхөн transform-оор дүүрнэ)
export default function ProgressLine({ step, total }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[15px]">
        <span className="text-plum">Алхам {step}/{total}</span>
      </div>
      <div
        className="mt-2 h-[3px] overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label="Судалгааны явц"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-valuetext={`Алхам ${step}/${total}`}
      >
        <motion.div
          className="h-full origin-left rounded-full bg-plum"
          initial={false}
          animate={{ scaleX: step / total }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  )
}
