import { useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LabelList,
} from 'recharts'

// Ягаан шатлалууд (validate_palette.js --ordinal --mode light --surface #FFFFFF: PASS)
export const ORDINAL_3 = ['#6B21A8', '#A855F7', '#C084FC'] // Тийм, Хэсэгчлэн, Үгүй
export const RAMP_5 = ['#C084FC', '#A855F7', '#8B3FD6', '#6B21A8', '#2E0854']
// Нэг өнгөт шатлал нэрлэсэн ангиллыг дангаараа ялгаж чадахгүй тул хээ нэмнэ
const TEXTURES = ['solid', 'hatch45', 'dots', 'hatch135', 'cross']

const SURFACE = '#FFFFFF'
const AXIS = { fill: '#6B21A8', fontSize: 13 }
const GRID = '#EFE6FC'

function Defs({ prefix, colors }) {
  return (
    <defs>
      <linearGradient id={`${prefix}-bar`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#6B21A8" />
        <stop offset="100%" stopColor="#A855F7" />
      </linearGradient>
      {colors?.map((c, i) => (
        <pattern key={i} id={`${prefix}-${i}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill={c} />
          {TEXTURES[i] === 'hatch45' && <path d="M-2 2 L2 -2 M0 8 L8 0 M6 10 L10 6" stroke={SURFACE} strokeWidth="1.5" />}
          {TEXTURES[i] === 'hatch135' && <path d="M-2 6 L2 10 M0 0 L8 8 M6 -2 L10 2" stroke={SURFACE} strokeWidth="1.5" />}
          {TEXTURES[i] === 'dots' && <circle cx="4" cy="4" r="1.5" fill={SURFACE} />}
          {TEXTURES[i] === 'cross' && <path d="M0 4 H8 M4 0 V8" stroke={SURFACE} strokeWidth="1.3" />}
        </pattern>
      ))}
    </defs>
  )
}

function Swatch({ i }) {
  return (
    <svg width="16" height="16" aria-hidden="true" className="shrink-0">
      <Defs prefix={`sw${i}`} colors={RAMP_5} />
      <rect width="16" height="16" rx="4" fill={`url(#sw${i}-${i})`} />
    </svg>
  )
}

function Tip({ active, payload, label, total }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-lilac bg-white px-3 py-2 text-[14px] text-ink">
      <p className="mb-1 font-bold">{label ?? payload[0].name}</p>
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name}>
          {payload.length > 1 && <span>{p.name}: </span>}
          <span className="font-bold">{p.value}</span>
          {total ? <span className="text-plum"> ({Math.round((p.value / total) * 100)}%)</span> : null}
        </p>
      ))}
    </div>
  )
}

/** График + "Хүснэгтээр харах" сэлгүүр */
export function ChartPanel({ title, subtitle, table, children, empty }) {
  const [asTable, setAsTable] = useState(false)
  return (
    <section className="panel p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[18px] font-bold text-ink">{title}</h3>
          {subtitle && <p className="mt-1 text-[14px] text-plum">{subtitle}</p>}
        </div>
        {!empty && (
          <button
            type="button"
            onClick={() => setAsTable((v) => !v)}
            className="btn btn-text min-h-[44px] shrink-0 !px-2 text-[14px]"
            aria-pressed={asTable}
          >
            {asTable ? 'График' : 'Хүснэгт'}
          </button>
        )}
      </div>
      {empty
        ? <p className="py-12 text-center text-plum">Хариулт ирэхээр энд харагдана.</p>
        : asTable ? <DataTable {...table} /> : children}
    </section>
  )
}

export function DataTable({ columns, rows }) {
  return (
    <div className="max-h-[320px] overflow-auto">
      <table className="w-full border-collapse text-left text-[15px]">
        <thead>
          <tr className="border-b border-lilac">
            {columns.map((c, j) => <th key={c} className={`py-2 pr-3 font-bold text-ink ${j ? 'text-right' : ''}`}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line">
              {r.map((v, j) => <td key={j} className={`py-2 pr-3 ${j ? 'text-right tabular-nums' : ''}`}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Нэг цуваа хэвтээ bar — утга баганын үзүүрт */
export function HBar({ data, total, id }) {
  const h = Math.max(160, data.length * 40 + 30)
  return (
    <div style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 4 }} barCategoryGap={10}>
          <Defs prefix={id} />
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={132} tick={{ ...AXIS, fill: '#2E0854', fontSize: 14 }} axisLine={false} tickLine={false} interval={0} />
          <Tooltip cursor={{ fill: '#F5F0FF' }} content={<Tip total={total} />} />
          <Bar dataKey="value" name="Хариулт" fill={`url(#${id}-bar)`} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
            <LabelList dataKey="value" position="right" fill="#2E0854" fontSize={14} fontWeight={700} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** 100% stacked хэвтээ bar (Тийм / Хэсэгчлэн / Үгүй) */
export function StackedAdequacy({ data, levels }) {
  return (
    <div>
      <div style={{ height: data.length * 54 + 30 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" stackOffset="expand" margin={{ top: 4, right: 12, bottom: 4, left: 4 }} barCategoryGap={14}>
            <XAxis type="number" tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={132} tick={{ ...AXIS, fill: '#2E0854', fontSize: 14 }} axisLine={false} tickLine={false} interval={0} />
            <Tooltip cursor={{ fill: '#F5F0FF' }} content={<Tip />} />
            {levels.map((l, i) => (
              <Bar
                key={l.value}
                dataKey={l.value}
                name={l.label}
                stackId="a"
                fill={ORDINAL_3[i]}
                stroke={SURFACE}
                strokeWidth={2}
                maxBarSize={24}
                isAnimationActive={false}
                radius={i === levels.length - 1 ? [0, 4, 4, 0] : 0}
              >
                <LabelList
                  dataKey={l.value}
                  position="center"
                  content={({ x, y, width, height, value }) => {
                    if (!value || width < 34) return null
                    return (
                      <text x={x + width / 2} y={y + height / 2 + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={i === 0 ? '#FFFFFF' : '#2E0854'}>
                        {value}
                      </text>
                    )
                  }}
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex flex-wrap gap-5 text-[14px] text-ink">
        {levels.map((l, i) => (
          <li key={l.value} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-[4px]" style={{ background: ORDINAL_3[i] }} aria-hidden="true" />
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Donut — хэсэг бүр өөр хээтэй (зөвхөн өнгөөр ялгахгүй) */
export function Donut({ data, total }) {
  const shown = data.filter((d) => d.value > 0)
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-[210px] w-full max-w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Defs prefix="donut" colors={RAMP_5} />
            <Tooltip content={<Tip total={total} />} />
            <Pie
              data={shown}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="94%"
              stroke={SURFACE}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {shown.map((d) => <Cell key={d.name} fill={`url(#donut-${d.idx})`} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] font-bold text-ink">{total}</span>
          <span className="text-[13px] text-plum">хариулт</span>
        </div>
      </div>
      <ul className="flex w-full flex-col gap-2.5 text-[15px]">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-3">
            <Swatch i={d.idx} />
            <span className="flex-1 text-ink">{d.name}</span>
            <span className="font-bold tabular-nums text-ink">{d.value}</span>
            <span className="w-12 text-right tabular-nums text-plum">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
