'use client'
import { useEffect, useState } from 'react'
import SectionHeader from '@/components/SectionHeader'
import StatCard from '@/components/StatCard'
import AQIBadge from '@/components/AQIBadge'
import { getCurrentAQI, getAQIForecast, getCorrelations } from '@/lib/api'
import { Wind, ArrowUp, ArrowDown } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine,
} from 'recharts'

export default function AirQualityPage() {
  const [current,  setCurrent]  = useState<any>(null)
  const [forecast, setForecast] = useState<any>(null)
  const [corr,     setCorr]     = useState<any>(null)
  const [simVehicle,  setSimVehicle]  = useState(0)
  const [simRoof,     setSimRoof]     = useState(0)
  const [simDiesel,   setSimDiesel]   = useState(0)
  const [simResult,   setSimResult]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

  useEffect(() => {
    setLoading(true)
    Promise.all([getCurrentAQI(), getAQIForecast(), getCorrelations()]).then(([c, f, r]) => {
      setCurrent(c); setForecast(f); setCorr(r); setLoading(false)
    })
  }, [])

  const runSim = async () => {
    const res = await fetch(`${BASE}/api/airquality/policy-sim?vehicle_ban_pct=${simVehicle}&green_roof_area_m2=${simRoof}&diesel_gen_hours=${simDiesel}`)
    setSimResult(await res.json())
  }

  if (loading || !current) return <div className="text-slate-400 py-10 text-center">Loading air quality data…</div>

  const fxData = forecast.forecast.map((p: any) => ({
    time: new Date(p.timestamp).getHours() + ':00',
    AQI: p.predicted_aqi,
    PM25: p.predicted_pm25,
  }))

  return (
    <div className="space-y-8">
      <SectionHeader
        title="🌬 Air Quality & Climate Insights"
        description="Hyperlocal AQI forecasting, behaviour correlation, and policy simulation"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Campus AQI" value={current.campus_avg_aqi} sub={current.campus_category} icon={<Wind size={18} />}
          variant={current.campus_avg_aqi > 150 ? 'danger' : current.campus_avg_aqi > 100 ? 'warn' : 'good'} />
        <StatCard label="Sensors online" value={current.sensors.length} sub="Across campus grid" />
        <StatCard label="PM2.5 avg" value={`${(current.sensors.reduce((s: number, sen: any) => s + sen.pm25, 0) / current.sensors.length).toFixed(1)}`} unit="µg/m³" />
        <StatCard label="Forecast horizon" value={forecast.horizon_hours} unit="h" sub={`Model: ${forecast.model}`} />
      </div>

      {/* Sensor grid */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4">Live Sensor Readings</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {current.sensors.map((s: any) => (
            <div key={s.id} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">{s.name}</span>
                <AQIBadge category={s.category} aqi={s.aqi} />
              </div>
              <p className="text-xs text-slate-400">PM2.5: <span className="text-slate-600 font-medium">{s.pm25} µg/m³</span>
                &nbsp;|&nbsp;PM10: <span className="text-slate-600 font-medium">{s.pm10} µg/m³</span>
                &nbsp;|&nbsp;NO₂: <span className="text-slate-600 font-medium">{s.no2_ppb} ppb</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast chart */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4">6-Hour AQI Forecast (XGBoost)</h2>
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={fxData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Unhealthy threshold', fontSize: 10, fill: '#f59e0b' }} />
            <Line type="monotone" dataKey="AQI"  stroke="#ef4444" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="PM25" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Behaviour correlations */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4">Campus Behaviour Correlations</h2>
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-3">{corr.insight}</p>
        <div className="space-y-2">
          {corr.correlations.map((c: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-sm rounded-lg border border-slate-100 px-3 py-2">
              <div>
                <span className="font-medium text-slate-700">{c.event}</span>
                <span className="ml-2 text-xs text-slate-400">{c.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${c.pm25_delta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {c.pm25_delta > 0 ? <ArrowUp size={14} className="inline" /> : <ArrowDown size={14} className="inline" />}
                  {Math.abs(c.pm25_delta)} µg/m³
                </span>
                <span className={`badge ${c.significance === 'high' ? 'badge-red' : 'badge-yellow'}`}>{c.significance}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy simulator */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4">🎛 Policy What-If Simulator</h2>
        <div className="grid sm:grid-cols-3 gap-6 mb-4">
          {[
            { label: 'Vehicle ban %', value: simVehicle, min: 0, max: 100, step: 5, set: setSimVehicle },
            { label: 'Green roof area (m²)', value: simRoof, min: 0, max: 5000, step: 100, set: setSimRoof },
            { label: 'Diesel generator hrs', value: simDiesel, min: 0, max: 12, step: 0.5, set: setSimDiesel },
          ].map(({ label, value, min, max, step, set }) => (
            <div key={label}>
              <label className="text-xs font-medium text-slate-500">{label}: <strong className="text-slate-700">{value}</strong></label>
              <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => set(Number(e.target.value))}
                className="w-full mt-1 accent-green-600" />
            </div>
          ))}
        </div>
        <button onClick={runSim}
          className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
          Run Simulation
        </button>
        {simResult && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
              <p className="text-xs text-slate-400">Baseline PM2.5</p>
              <p className="text-xl font-bold text-slate-700">{simResult.baseline_pm25}</p>
              <AQIBadge category={simResult.baseline_category} aqi={simResult.baseline_aqi} />
            </div>
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
              <p className="text-xs text-slate-400">Projected PM2.5</p>
              <p className="text-xl font-bold text-green-700">{simResult.projected_pm25}</p>
              <AQIBadge category={simResult.projected_category} aqi={simResult.projected_aqi} />
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
              <p className="text-xs text-slate-400">PM2.5 Change</p>
              <p className={`text-xl font-bold ${simResult.delta_pm25 <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {simResult.delta_pm25 > 0 ? '+' : ''}{simResult.delta_pm25} µg/m³
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
              <p className="text-xs text-slate-400">AQI Change</p>
              <p className={`text-xl font-bold ${simResult.projected_aqi <= simResult.baseline_aqi ? 'text-green-600' : 'text-red-600'}`}>
                {simResult.projected_aqi - simResult.baseline_aqi > 0 ? '+' : ''}
                {simResult.projected_aqi - simResult.baseline_aqi}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
