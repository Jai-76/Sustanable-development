'use client'
import { useEffect, useState } from 'react'
import SectionHeader from '@/components/SectionHeader'
import StatCard from '@/components/StatCard'
import { getEnergySummary, getEnergyNudges, getEnergyForecast, getEnergyAnomalies } from '@/lib/api'
import { Zap, Droplets, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend,
} from 'recharts'

const BUILDINGS = [
  { id: 'hostel-a',  label: 'Hostel A'        },
  { id: 'hostel-b',  label: 'Hostel B'        },
  { id: 'lab-cs',    label: 'CS Lab Block'    },
  { id: 'lab-bio',   label: 'Bio Lab Block'   },
  { id: 'admin',     label: 'Admin Building'  },
  { id: 'canteen',   label: 'Main Canteen'    },
  { id: 'library',   label: 'Central Library' },
]

export default function EnergyPage() {
  const [summary,   setSummary]   = useState<any>(null)
  const [nudges,    setNudges]    = useState<any>(null)
  const [forecast,  setForecast]  = useState<any>(null)
  const [anomalies, setAnomalies] = useState<any>(null)
  const [selected,  setSelected]  = useState(BUILDINGS[0].id)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getEnergySummary(),
      getEnergyNudges(selected),
      getEnergyForecast(selected),
      getEnergyAnomalies(),
    ]).then(([s, n, f, a]) => {
      setSummary(s); setNudges(n); setForecast(f); setAnomalies(a)
      setLoading(false)
    })
  }, [selected])

  if (loading || !summary) return <div className="text-slate-400 py-10 text-center">Loading energy data…</div>

  const forecastData = forecast.forecast.map((p: any) => ({
    hour: new Date(p.timestamp).getHours() + ':00',
    kwh: p.kwh,
    lo: p.confidence_interval[0],
    hi: p.confidence_interval[1],
  }))

  const barData = summary.buildings.map((b: any) => ({
    name: b.name.replace(' Building', '').replace(' Block', ''),
    kWh: b.kwh_today,
    fill: b.anomaly ? '#ef4444' : '#22c55e',
  }))

  return (
    <div className="space-y-8">
      <SectionHeader
        title="⚡ Energy & Water Intelligence"
        description="Real-time consumption, anomaly detection, and AI nudges per building"
        action={
          <select
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            {BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Campus kWh today" value={summary.campus_total_kwh.toLocaleString()} unit="kWh" icon={<Zap size={18} />} variant="good" />
        <StatCard label="CO₂ emitted" value={summary.campus_co2_kg.toLocaleString()} unit="kg" sub="India grid 0.82 kg/kWh" variant={summary.campus_co2_kg > 5000 ? 'warn' : 'default'} />
        <StatCard label="Water used" value={(summary.campus_total_water_litres / 1000).toFixed(1)} unit="kL" icon={<Droplets size={18} />} />
        <StatCard label="Anomalies found" value={summary.anomaly_buildings} sub="Isolation Forest" icon={<AlertTriangle size={18} />} variant={summary.anomaly_buildings > 0 ? 'danger' : 'good'} />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 24-h forecast */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-600" />
            24 h Demand Forecast — {BUILDINGS.find(b => b.id === selected)?.label}
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" kWh" width={55} />
              <Tooltip formatter={(v: any) => [`${v} kWh`]} />
              <Area type="monotone" dataKey="hi" stroke="none" fill="#dcfce7" fillOpacity={1} legendType="none" />
              <Area type="monotone" dataKey="lo" stroke="none" fill="#f8fafc"  fillOpacity={1} legendType="none" />
              <Area type="monotone" dataKey="kwh" stroke="#16a34a" fill="url(#fg)" strokeWidth={2} dot={false} name="Forecast kWh" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Building comparison bar */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Building Consumption Today</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" kWh" />
              <Tooltip formatter={(v: any) => [`${v} kWh`]} />
              <Bar dataKey="kWh" fill="#22c55e" radius={[4, 4, 0, 0]}
                label={false}
                isAnimationActive={false}
              >
                {barData.map((entry: any, idx: number) => (
                  <rect key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Nudges */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Lightbulb size={16} className="text-yellow-500" />
          AI Nudges for {BUILDINGS.find(b => b.id === selected)?.label}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {nudges?.nudges.map((n: any) => (
            <div key={n.priority} className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
              <span className="text-xs font-bold text-yellow-700 uppercase tracking-wide">Priority {n.priority}</span>
              <p className="mt-1 text-sm text-slate-700">{n.message}</p>
              <p className="mt-2 text-xs text-green-700 font-semibold">Save ≈ {n.estimated_saving_kwh} kWh</p>
            </div>
          ))}
        </div>
      </div>

      {/* Anomalies table */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" /> Anomaly Detection (Isolation Forest)
        </h2>
        {anomalies?.anomalies.length === 0
          ? <p className="text-sm text-slate-400">No anomalies at current threshold.</p>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase border-b border-slate-100">
                  <th className="pb-2">Building</th>
                  <th className="pb-2 text-right">Anomaly Score</th>
                  <th className="pb-2 text-right">Excess kWh Est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {anomalies?.anomalies.map((a: any) => (
                  <tr key={a.building_id} className="hover:bg-red-50 transition-colors">
                    <td className="py-2 font-medium text-slate-700">{a.name}</td>
                    <td className="py-2 text-right tabular-nums text-red-600">{a.anomaly_score}</td>
                    <td className="py-2 text-right tabular-nums">+{a.excess_kwh_estimate} kWh</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  )
}
