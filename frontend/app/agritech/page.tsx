'use client'
import { useEffect, useState } from 'react'
import SectionHeader from '@/components/SectionHeader'
import StatCard from '@/components/StatCard'
import { RiskBadge, GradeBadge } from '@/components/Badges'
import { getAgriSummary, getIrrigation, getPestRisk, getSoilHealth } from '@/lib/api'
import { Leaf, Droplets, Bug, FlaskConical } from 'lucide-react'
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

const PLOTS = [
  { id: 'plot-01', label: 'North Farm — Tomato'     },
  { id: 'plot-02', label: 'East Nursery — Leafy'    },
  { id: 'plot-03', label: 'Greenhouse A — Herbs'    },
  { id: 'plot-04', label: 'South Field — Groundnut' },
  { id: 'plot-05', label: 'Incubator — Chilli'      },
]

export default function AgritechPage() {
  const [summary,    setSummary]    = useState<any>(null)
  const [irrigation, setIrrigation] = useState<any>(null)
  const [pest,       setPest]       = useState<any>(null)
  const [soil,       setSoil]       = useState<any>(null)
  const [selected,   setSelected]   = useState(PLOTS[0].id)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getAgriSummary(),
      getIrrigation(selected),
      getPestRisk(selected),
      getSoilHealth(selected),
    ]).then(([s, i, p, so]) => {
      setSummary(s); setIrrigation(i); setPest(p); setSoil(so)
      setLoading(false)
    })
  }, [selected])

  if (loading || !summary) return <div className="text-slate-400 py-10 text-center">Loading farm data…</div>

  const soilRadar = soil ? [
    { attribute: 'pH',         score: soil.component_scores.ph        * 100 },
    { attribute: 'Nitrogen',   score: soil.component_scores.nitrogen  * 100 },
    { attribute: 'Phosphorus', score: soil.component_scores.phosphorus* 100 },
    { attribute: 'Potassium',  score: soil.component_scores.potassium * 100 },
    { attribute: 'Moisture',   score: soil.component_scores.moisture  * 100 },
  ] : []

  const irrigBar = irrigation?.schedule.map((s: any) => ({
    slot: s.slot,
    litres: s.volume_litres,
    mins: s.duration_min,
  })) ?? []

  return (
    <div className="space-y-8">
      <SectionHeader
        title="🌾 Agri-Tech Decision Support"
        description="ML-guided irrigation, pest detection, and soil health for campus farms"
        action={
          <select
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            {PLOTS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active plots" value={summary.plots.length} icon={<Leaf size={18} />} variant="good" />
        <StatCard label="Soil health" value={soil?.health_index ?? '—'} unit="/100" sub={`Grade ${soil?.grade}`} variant={soil?.grade === 'A' ? 'good' : soil?.grade === 'D' ? 'danger' : 'default'} />
        <StatCard label="Pest risk" value={`${((pest?.risk_score ?? 0) * 100).toFixed(0)}%`} sub={pest?.risk_level ?? '—'} icon={<Bug size={18} />} variant={pest?.risk_score > 0.65 ? 'danger' : pest?.risk_score > 0.35 ? 'warn' : 'good'} />
        <StatCard label="Water saving vs flood" value={irrigation?.water_saving_vs_flood_pct ?? '—'} unit="%" icon={<Droplets size={18} />} variant="good" />
      </div>

      {/* Farm plots grid */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4">All Farm Plots</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase border-b border-slate-100">
                <th className="pb-2">Plot</th>
                <th className="pb-2">Crop</th>
                <th className="pb-2">Stage</th>
                <th className="pb-2 text-right">Moisture %</th>
                <th className="pb-2 text-right">pH</th>
                <th className="pb-2 text-right">Pest Risk</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {summary.plots.map((p: any) => (
                <tr key={p.id}
                  className="hover:bg-green-50 cursor-pointer transition-colors"
                  onClick={() => setSelected(p.id)}
                >
                  <td className="py-2 font-medium text-slate-700">{p.name}</td>
                  <td className="py-2 capitalize text-slate-500">{p.crop}</td>
                  <td className="py-2 text-slate-500">{p.growth_stage}</td>
                  <td className="py-2 text-right tabular-nums">{p.soil_moisture_pct}</td>
                  <td className="py-2 text-right tabular-nums">{p.soil_ph}</td>
                  <td className="py-2 text-right"><RiskBadge level={p.pest_risk > 0.65 ? 'high' : p.pest_risk > 0.35 ? 'medium' : 'low'} /></td>
                  <td className="py-2 text-right">
                    <span className={`badge ${p.moisture_status === 'optimal' ? 'badge-green' : p.moisture_status === 'dry' ? 'badge-red' : 'badge-blue'}`}>
                      {p.moisture_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Soil health radar */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <FlaskConical size={16} className="text-blue-500" />
            Soil Health — {PLOTS.find(p => p.id === selected)?.label}
            <GradeBadge grade={soil?.grade ?? 'B'} />
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={soilRadar}>
              <PolarGrid />
              <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 12 }} />
              <Radar name="Score" dataKey="score" stroke="#16a34a" fill="#22c55e" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
          {soil?.alerts.map((a: string, i: number) => (
            <p key={i} className="text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1 mt-1">⚠ {a}</p>
          ))}
        </div>

        {/* Irrigation schedule */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Droplets size={16} className="text-blue-500" /> Irrigation Schedule
          </h2>
          {irrigBar.length === 0
            ? <p className="text-sm text-slate-400 mt-2">No irrigation needed in the next 48 h.</p>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={irrigBar}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="slot" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="litres" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Volume (L)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          <div className="mt-3 space-y-1">
            {irrigation?.schedule.map((s: any) => (
              <div key={s.slot} className="flex justify-between text-xs text-slate-600 bg-blue-50 rounded px-2 py-1">
                <span className="font-medium">{s.slot} — {s.start_time}</span>
                <span>{s.volume_litres} L · {s.duration_min} min · {s.method}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pest risk card */}
      {pest && (
        <div className={`card border-l-4 ${pest.risk_score > 0.65 ? 'border-red-400' : pest.risk_score > 0.35 ? 'border-yellow-400' : 'border-green-400'}`}>
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Bug size={16} /> Pest Risk Assessment
            <RiskBadge level={pest.risk_level} />
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 mb-1">Risk Score</p>
              <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="absolute h-full rounded-full bg-gradient-to-r from-green-400 to-red-500"
                  style={{ width: `${pest.risk_score * 100}%` }} />
              </div>
              <p className="mt-1 text-xs font-bold">{(pest.risk_score * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Active Threats</p>
              {pest.active_threats.length === 0
                ? <p className="text-xs text-green-600">None detected</p>
                : pest.active_threats.map((t: string) => (
                  <span key={t} className="badge badge-red mr-1">{t}</span>
                ))}
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Recommended Action</p>
              <p className="text-xs text-slate-700">{pest.recommended_action}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
