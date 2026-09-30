import { motion, useReducedMotion } from 'framer-motion'
import { Brand } from './Logo'
import PrivacyNote from './PrivacyNote'

const EASE = [0.22, 1, 0.36, 1]

/**
 * Нүүр хуудас: юуны тухай судалгаа болохыг хэлээд нэг товчоор эхлүүлнэ.
 * Хөдөлгөөн нь ганцхан: гарчиг, товч доороосоо зөөлөн дараалан гарч ирнэ.
 */
export default function Landing({ onStart }) {
  const reduce = useReducedMotion()
  const enter = (i) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, ease: EASE, delay: 0.08 + i * 0.08 },
        }

  return (
    <main
      className="flex min-h-dvh flex-col px-4"
      style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F0FF 55%, #E9DDFD 100%)' }}
    >
      <Brand size={40} className="mx-auto w-full max-w-[640px] pt-6" />

      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col justify-center py-12">
        <motion.h1 {...enter(0)} className="font-bold text-ink">
          <span
            className="block bg-clip-text pb-2 text-[64px] leading-[0.95] tracking-[-0.02em] text-transparent sm:text-[96px]"
            style={{ backgroundImage: 'linear-gradient(100deg, #2E0854 0%, #6B21A8 50%, #A855F7 100%)' }}
          >
            Parents Day
          </span>
          <span className="mt-3 block text-[26px] leading-snug sm:text-[32px]">Өдөрлөгийн судалгаа</span>
        </motion.h1>

        <motion.p {...enter(1)} className="mt-5 max-w-[30ch] sm:max-w-[42ch] text-[18px] leading-relaxed text-plum">
          Өдөрлөгт оролцсон танд баярлалаа. Санал хүсэлтээ 2 минутад үлдээнэ үү.
        </motion.p>

        <motion.div {...enter(2)} className="mt-10 flex flex-col items-start gap-3">
          <button type="button" className="btn btn-primary min-w-[240px]" onClick={onStart}>
            Судалгаа эхлүүлэх
          </button>
          <p className="text-[15px] text-plum">3 алхам, 10 асуулт</p>
        </motion.div>
      </div>

      <div className="mx-auto w-full max-w-[640px] pb-6">
        <PrivacyNote className="!justify-start" />
      </div>
    </main>
  )
}
