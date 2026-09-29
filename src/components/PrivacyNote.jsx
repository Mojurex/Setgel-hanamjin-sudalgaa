export default function PrivacyNote({ className = '' }) {
  return (
    <p className={`flex items-start justify-center gap-2 text-[15px] text-plum ${className}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="mt-[3px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      Таны хариулт зөвхөн сургуулийн үйл ажиллагааг сайжруулахад ашиглагдана.
    </p>
  )
}
