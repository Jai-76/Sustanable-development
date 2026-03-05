import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  sub?: string
  icon?: ReactNode
  variant?: 'default' | 'warn' | 'danger' | 'good'
}

const variants = {
  default: 'border-slate-100',
  warn:    'border-yellow-300 bg-yellow-50',
  danger:  'border-red-300   bg-red-50',
  good:    'border-green-300 bg-green-50',
}

export default function StatCard({ label, value, unit, sub, icon, variant = 'default' }: StatCardProps) {
  return (
    <div className={clsx('card flex flex-col gap-1 border-l-4', variants[variant])}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-slate-800">
        {value}
        {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
      </p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  )
}
