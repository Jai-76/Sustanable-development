'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Zap, Leaf, Wind, Recycle, Cpu, LayoutDashboard, Code2, ExternalLink, Circle } from 'lucide-react'

const NAV = [
  { href: '/',             label: 'Overview',      icon: LayoutDashboard },
  { href: '/energy',       label: 'Energy & Water', icon: Zap            },
  { href: '/agritech',     label: 'Agri-Tech',     icon: Leaf            },
  { href: '/airquality',   label: 'Air Quality',   icon: Wind            },
  { href: '/ewaste',       label: 'E-Waste',       icon: Recycle         },
  { href: '/sensors',      label: 'Sensor Grid',   icon: Cpu             },
  { href: '/api-explorer', label: 'API Explorer',  icon: Code2           },
]

export default function Sidebar() {
  const path = usePathname()
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

  useEffect(() => {
    const check = () =>
      fetch(`${API}/health`, { cache: 'no-store' })
        .then(r => setBackendStatus(r.ok ? 'online' : 'offline'))
        .catch(() => setBackendStatus('offline'))
    check()
    const t = setInterval(check, 30_000)
    return () => clearInterval(t)
  }, [API])

  const statusColor = backendStatus === 'online'
    ? 'text-green-500' : backendStatus === 'offline'
    ? 'text-red-500' : 'text-yellow-400'
  const statusLabel = backendStatus === 'online' ? 'Backend online'
    : backendStatus === 'offline' ? 'Backend offline' : 'Checking…'

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col py-6 px-4 min-h-screen">
      {/* Logo */}
      <div className="mb-8 px-2">
        <span className="text-lg font-bold text-green-700">🌿 CampusAI</span>
        <p className="text-xs text-slate-400 mt-0.5">Sustainability Platform</p>
      </div>

      {/* Backend status pill */}
      <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
        <Circle size={8} className={`fill-current ${statusColor}`} />
        <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
        <a href={`${API}/docs`} target="_blank" rel="noreferrer"
          className="ml-auto text-slate-300 hover:text-green-600 transition-colors" title="Open Swagger UI">
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${active ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-2 pt-6 border-t border-slate-100 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">API: <span className="font-mono">{API}</span></p>
        </div>
        <p className="text-xs text-slate-400">Refresh: every 30 s</p>
        <p className="text-xs text-slate-400">Grid factor: 0.82 kg CO₂/kWh</p>
      </div>
    </aside>
  )
}
