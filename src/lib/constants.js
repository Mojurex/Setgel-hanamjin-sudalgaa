export const SCHOOL_NAME = 'Амжилт Кибер Сургууль'

export const GUARDIANS = ['Аав', 'Ээж', 'Эмээ', 'Өвөө', 'Бусад']

export const INFO_SOURCES = [
  'Телеграм ангийн групп',
  'Хүүхдээсээ',
  'Ангийн багшаас',
  'Бусад эцэг эхээс',
  'Бусад',
]

// 6-р асуултын чиглэлүүд Supabase-ийн adequacy_topics хүснэгтэд байна (админ самбараас засна).
// Энэ жагсаалт зөвхөн демо горим эсвэл хүснэгт уншигдахгүй үеийн нөөц. key нь хариултад хадгалагдах тогтмол түлхүүр.
export const DEFAULT_TOPICS = [
  { key: 'lessons', label: 'Хичээл сургалт', active: true },
  { key: 'clubs', label: 'Дугуйлан, секц', active: true },
  { key: 'goals', label: 'Хичээлийн жилийн зорилго, хүрэх үр дүн', active: true },
  { key: 'bus', label: 'Автобус', active: true },
  { key: 'child_protection', label: 'Хүүхэд хамгаалах баг', active: true },
  { key: 'day_care', label: 'Өдөр өнжүүлэх', active: true },
  { key: 'telegram', label: 'Telegram сувгийн ашиглалт', active: true },
  { key: 'cambridge', label: 'Cambridge хөтөлбөр', active: false },
].map((t, i) => ({ id: -(i + 1), sort: t.active ? i + 1 : 99, ...t }))

export const ADEQUACY_LEVELS = [
  { value: 'yes', label: 'Тийм' },
  { value: 'partial', label: 'Хэсэгчлэн' },
  { value: 'no', label: 'Үгүй' },
]

export const COUNCIL_OPTIONS = [
  { value: 'yes', label: 'Тийм' },
  { value: 'no', label: 'Үгүй' },
  { value: 'maybe', label: 'Бодоод үзнэ' },
]

export const RATING_LABELS = ['Муу', 'Дунд зэрэг', 'Хэвийн', 'Сайн', 'Маш сайн']

export const DEFAULT_SUBJECTS = [
  'Математик', 'Монгол хэл', 'Англи хэл', 'Байгалийн ухаан',
  'Программ хангамж', 'Гоо зүй', 'Нийгмийн ухаан', 'Биеийн тамир',
]

// Сургуулийн бүлгүүд ("анги-бүлэг"). Өөрчлөх бол supabase/schema.sql-ийн class_group шалгалтыг мөн шинэчилнэ.
export const CLASS_GROUPS = [
  '1-1', '1-2', '1-3',
  '2-1', '2-2', '2-3',
  '3-1', '3-2',
  '4-1', '4-2',
  '5-1', '5-2',
  '6-1', '6-2', '6-3',
  '7-1', '7-2',
  '8-1', '8-2',
  '9-1', '9-2',
  '10-1',
  '11-1', '11-2',
  '12-1', '12-2', '12-3',
]

export const gradeOf = (group) => String(group).split(/[-.]/)[0]
export const GRADES = [...new Set(CLASS_GROUPS.map(gradeOf))]
export const groupsOfGrade = (grade) => CLASS_GROUPS.filter((g) => gradeOf(g) === String(grade))

export const FEEDBACK_MAX = 1000
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
