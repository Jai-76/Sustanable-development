import { getEnergySummary, getCurrentAQI, getAgriSummary, getEWasteSummary } from '@/lib/api'
import StatCard from '@/components/StatCard'
import SectionHeader from '@/components/SectionHeader'
import AQIBadge from '@/components/AQIBadge'
import { Zap, Droplets, Wind, Recycle, AlertTriangle, TrendingDown } from 'lucide-react'
import Link from 'next/link'

export default async function OverviewPage() {
  const [energy, aqi, agri, ewaste] = await Promise.all([
    getEnergySummary(),
    getCurrentAQI(),
    getAgriSummary(),
    getEWasteSummary(),
  ])

  const topBuilding = [...energy.buildings].sort((a: any, b: any) => b.kwh_today - a.kwh_today)[0]
  const anomalyBuildings = energy.buildings.filter((b: any) => b.anomaly)
  const dryPlots = agri.plots.filter((p: any) => p.moisture_status === 'dry')

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Campus Sustainability Overview"
        description={`Live snapshot · ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Energy today"
          value={energy.campus_total_kwh.toLocaleString()}
          unit="kWh"
          sub={`≈ ${energy.campus_co2_kg} kg CO₂`}
          icon={<Zap size={18} />}
          variant={energy.anomaly_buildings > 0 ? 'warn' : 'good'}
        />
        <StatCard
          label="Water today"
          value={(energy.campus_total_water_litres / 1000).toFixed(1)}
          unit="kL"
          sub="All buildings"
          icon={<Droplets size={18} />}
        />
        <StatCard
          label="Campus AQI"
          value={aqi.campus_avg_aqi}
          sub={aqi.campus_category}
          icon={<Wind size={18} />}
          variant={aqi.campus_avg_aqi > 100 ? 'warn' : 'good'}
        />
        <StatCard
          label="E-Waste pending"
          value={ewaste.pending_collection}
          unit="items"
          sub={`${ewaste.diverted_from_landfill_pct}% diverted from landfill`}
          icon={<Recycle size={18} />}
        />
      </div>

      {/* Alerts + AQI */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Active alerts */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500" /> Active Alerts
          </h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {anomalyBuildings.length === 0 && (
              <li className="py-2 text-slate-400">No anomalies detected right now.</li>
            )}
            {anomalyBuildings.map((b: any) => (
              <li key={b.id} className="py-2 flex justify-between">
                <span className="text-slate-700">{b.name}</span>
                <span className="text-red-600 font-semibold">{b.kwh_today} kWh ⚠</span>
              </li>
            ))}
            {dryPlots.map((p: any) => (
              <li key={p.id} className="py-2 flex justify-between">
                <span className="text-slate-700">{p.name}</span>
                <span className="text-yellow-600 font-semibold">Soil dry ({p.soil_moisture_pct}%)</span>
              </li>
            ))}
          </ul>
        </div>

        {/* AQI sensors */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Wind size={16} className="text-blue-500" /> Air Quality Sensors
          </h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {aqi.sensors.slice(0, 5).map((s: any) => (
              <li key={s.id} className="py-2 flex justify-between items-center">
                <span className="text-slate-700">{s.name}</span>
                <AQIBadge category={s.category} aqi={s.aqi} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top consuming buildings */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <TrendingDown size={16} className="text-green-600" /> Today's Energy Leaderboard
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase border-b border-slate-100">
                <th className="pb-2">Building</th>
                <th className="pb-2">Type</th>
                <th className="pb-2 text-right">kWh</th>
                <th className="pb-2 text-right">kWh / person</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[...energy.buildings]
                .sort((a: any, b: any) => b.kwh_today - a.kwh_today)
                .map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 font-medium text-slate-700">{b.name}</td>
                    <td className="py-2 capitalize text-slate-500">{b.type}</td>
                    <td className="py-2 text-right tabular-nums">{b.kwh_today}</td>
                    <td className="py-2 text-right tabular-nums text-slate-500">{b.intensity_kwh_per_person}</td>
                    <td className="py-2 text-right">
                      {b.anomaly
                        ? <span className="badge badge-red">Anomaly</span>
                        : <span className="badge badge-green">Normal</span>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        {[
          { href: '/energy',     label: '⚡ Energy Details'  },
          { href: '/agritech',   label: '🌾 Farm Dashboard'  },
          { href: '/airquality', label: '🌬 Air Quality'    },
          { href: '/ewaste',     label: '♻ E-Waste Flows'   },
        ].map(l => (
          <Link key={l.href} href={l.href}
            className="card text-center py-4 font-medium text-green-700 hover:bg-green-50 transition-colors border-green-100">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
