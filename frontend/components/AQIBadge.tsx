import { clsx } from 'clsx'

const AQI_LEVELS: Record<string, { bg: string; text: string; dot: string }> = {
  'Good':                            { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },
  'Moderate':                        { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  'Unhealthy for Sensitive Groups':  { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  'Unhealthy':                       { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500'    },
  'Very Unhealthy':                  { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  'Hazardous':                       { bg: 'bg-rose-200',   text: 'text-rose-900',   dot: 'bg-rose-700'   },
}

export default function AQIBadge({ category, aqi }: { category: string; aqi?: number }) {
  const style = AQI_LEVELS[category] ?? { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' }
  return (
    <span className={clsx('badge gap-1.5', style.bg, style.text)}>
      <span className={clsx('inline-block w-2 h-2 rounded-full', style.dot)} />
      {aqi !== undefined && <span className="font-bold">{aqi}</span>}
      {category}
    </span>
  )
}
