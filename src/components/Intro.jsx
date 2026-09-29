import { motion } from 'framer-motion'
import PrivacyNote from './PrivacyNote'
import { Brand } from './Logo'

const rise = (delay) => ({
  hidden: { opacity: 0, y: 12 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut', delay } },
})

// Порталын ард ил гарах нүүр хэсэг
export default function Intro({ revealed, onStart }) {
  const state = revealed ? 'shown' : 'hidden'
  return (
    <main
      className="flex min-h-[100dvh] flex-col px-4"
      style={{ background: 'linear-gradient(180deg, #F5F0FF 0%, #F5F0FF 35%, #D8B4FE 100%)' }}
      inert={!revealed}
    >
      <Brand size={40} className="mx-auto w-full max-w-[640px] pt-6" />
      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center py-16 text-center">
        <motion.h1 variants={rise(0)} initial="hidden" animate={state} className="text-[34px] font-bold text-ink sm:text-[44px]">
          Parents Day өдөрлөгийн судалгаа нээгдлээ
        </motion.h1>
        <motion.p variants={rise(0.08)} initial="hidden" animate={state} className="mt-4 text-[18px] text-plum">
          Санал хүсэлтээ үлдээгээрэй
        </motion.p>
        <motion.div variants={rise(0.16)} initial="hidden" animate={state} className="mt-10 flex flex-col items-center gap-4">
          <button type="button" className="btn btn-primary min-w-[240px]" onClick={onStart}>
            Судалгаа эхлүүлэх
          </button>
          <p className="text-[15px] text-plum">3 алхам, 10 асуулт. Ойролцоогоор 2 минут.</p>
        </motion.div>
      </div>
      <motion.div variants={rise(0.24)} initial="hidden" animate={state} className="mx-auto w-full max-w-[640px] pb-8">
        <PrivacyNote />
      </motion.div>
    </main>
  )
}
