import { SCHOOL_NAME } from '../lib/constants'

// Сургуулийн дугуй лого (public/logo.png, эх файл: brand/logo-original.jpg).
// Хажууд нь сургуулийн нэр бичигдсэн бол decorative=true (дэлгэц уншигч давхар уншихгүй).
export default function Logo({ size = 32, decorative = false, className = '' }) {
  return (
    <img
      src="/logo.png"
      width={size}
      height={size}
      alt={decorative ? '' : `${SCHOOL_NAME} лого`}
      decoding="async"
      className={`shrink-0 select-none ${className}`}
      draggable="false"
    />
  )
}

/** Лого + сургуулийн нэр (хуудасны толгой) */
export function Brand({ size = 32, className = '' }) {
  return (
    <p className={`flex items-center gap-3 text-[15px] text-plum ${className}`}>
      <Logo size={size} decorative />
      {SCHOOL_NAME}
    </p>
  )
}
