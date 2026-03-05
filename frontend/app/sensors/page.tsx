'use client'
import { useEffect, useState } from 'react'
import SectionHeader from '@/components/SectionHeader'
import StatCard from '@/components/StatCard'
import { StatusBadge } from '@/components/Badges'
import { getSensorReadings } from '@/lib/api'
import { Cpu, Wifi, WifiOff, RefreshCw } from 'lucide-react'

const TYPE_ICONS: Record<string, string> = {
  energy:  '⚡',
  soil:    '🌱',
  air:     '💨',
  water:   '💧',
  weather: '🌤',
}

const TYPE_COLOR: Record<string, string> = {
  energy:  'bg-yellow-50  border-yellow-200',
  soil:    'bg-green-50   border-green-200',
  air:     'bg-blue-50    border-blue-200',
  water:   'bg-cyan-50    border-cyan-200',
  weather: 'bg-purple-50  border-purple-200',
}

function formatKey(k: string): string {
  return k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')
}

export default function SensorsPage() {
  const [readings, setReadings] = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const load = async () => {
    setLoading(true)
    const data = await getSensorReadings()
    setReadings(data)
    setLastRefresh(new Date())
    setLoading(false)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [])

  const types = ['all', 'energy', 'soil', 'air', 'water', 'weather']
  const visible = readings?.readings.filter((r: any) => filter === 'all' || r.type === filter) ?? []
  const onlineCount = readings?.readings.filter((r: any) => r.online).length ?? 0
  const offlineCount = (readings?.count ?? 0) - onlineCount

  return (
    <div className="space-y-8">
      <SectionHeader
        title="📡 Sensor Grid"
        description={`Live readings from all campus nodes · Last refresh: ${lastRefresh.toLocaleTimeString()}`}
        action={
          <button onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total nodes" value={readings?.count ?? '—'} icon={<Cpu size={18} />} />
        <StatCard label="Online" value={onlineCount} icon={<Wifi size={18} />} variant="good" />
        <StatCard label="Offline" value={offlineCount} icon={<WifiOff size={18} />} variant={offlineCount > 0 ? 'warn' : 'good'} />
        <StatCard label="Uptime" value={readings?.count ? `${((onlineCount / readings.count) * 100).toFixed(0)}%` : '—'} variant="good" />
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2">
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filter === t ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {TYPE_ICONS[t] ?? '📋'} {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Sensor cards grid */}
      {loading
        ? <div className="text-slate-400 text-center py-10">Loading sensor data…</div>
        : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((s: any) => (
              <div key={s.sensor_id}
                className={`rounded-2xl border p-4 ${TYPE_COLOR[s.type] ?? 'bg-slate-50 border-slate-200'} ${!s.online ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-lg">{TYPE_ICONS[s.type]}</span>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{s.sensor_id}</p>
                  </div>
                  <StatusBadge status={s.online ? 'online' : 'offline'} />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-2">{s.location}</p>
                <div className="space-y-1">
                  {Object.entries(s.data).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-slate-500 capitalize">{formatKey(k)}</span>
                      <span className="font-medium text-slate-700 tabular-nums">{String(v)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">{new Date(s.timestamp).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
