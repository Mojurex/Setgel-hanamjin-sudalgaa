import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import Survey from './pages/Survey'

const Admin = lazy(() => import('./pages/Admin'))

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={<p className="p-10 text-center text-plum">Ачаалж байна…</p>}>
        <Routes>
          <Route path="/" element={<Survey />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Survey />} />
        </Routes>
      </Suspense>
    </MotionConfig>
  )
}
