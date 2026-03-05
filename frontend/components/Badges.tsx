import { clsx } from 'clsx'

const RISK: Record<string, string> = {
  low:    'badge-green',
  medium: 'badge-yellow',
  high:   'badge-red',
}
const GRADE: Record<string, string> = {
  A: 'badge-green', B: 'badge-blue', C: 'badge-yellow', D: 'badge-red',
}
const STATUS: Record<string, string> = {
  online: 'badge-green', offline: 'badge-red', anomaly: 'badge-yellow',
}

export function RiskBadge({ level }: { level: string }) {
  return <span className={clsx('badge', RISK[level] ?? 'badge-blue')}>{level}</span>
}

export function GradeBadge({ grade }: { grade: string }) {
  return <span className={clsx('badge', GRADE[grade] ?? 'badge-blue')}>{grade}</span>
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={clsx('badge', STATUS[status] ?? 'badge-blue')}>{status}</span>
}
