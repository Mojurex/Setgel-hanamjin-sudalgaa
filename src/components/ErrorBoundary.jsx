import { Component } from 'react'

const RELOAD_KEY = 'odorlog.chunkReload'
// Шинэ хувилбар байршсаны дараа хуучин JS файл олдохгүй болсон үед гарах алдаанууд (Chrome / Safari / Firefox)
const isChunkError = (e) => /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to fetch|MIME type/i.test(e?.message || '')

/** Алдаа гарвал цагаан дэлгэц биш, ойлгомжтой мессеж + дахин ачаалах товч */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error(error)
    if (!isChunkError(error)) return
    // Шинэ хувилбарыг татахын тулд нэг удаа автоматаар дахин ачаална
    try {
      if (sessionStorage.getItem(RELOAD_KEY)) return
      sessionStorage.setItem(RELOAD_KEY, '1')
    } catch { return }
    window.location.reload()
  }

  componentDidMount() {
    try { sessionStorage.removeItem(RELOAD_KEY) } catch { /* хадгалах сан хаалттай */ }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center px-4 py-12">
        <h1 className="text-[28px] font-bold text-ink">Хуудсыг ачаалж чадсангүй</h1>
        <p className="mt-3 text-[17px] text-plum">Интернэт холболтоо шалгаад дахин ачаална уу.</p>
        <button type="button" className="btn btn-primary mt-8 self-start" onClick={() => window.location.reload()}>
          Дахин ачаалах
        </button>
      </main>
    )
  }
}
