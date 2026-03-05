'use client'
import { useEffect, useRef, useState } from 'react'
import SectionHeader from '@/components/SectionHeader'
import StatCard from '@/components/StatCard'
import { getEWasteSummary, getUpcycleOps, getCollectionRoute } from '@/lib/api'
import { Recycle, Upload, MapPin, Package } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

const PIE_COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6']

export default function EwastePage() {
  const [summary,    setSummary]    = useState<any>(null)
  const [upcycle,    setUpcycle]    = useState<any>(null)
  const [route,      setRoute]      = useState<any>(null)
  const [classResult,setClassResult]= useState<any>(null)
  const [uploading,  setUploading]  = useState(false)
  const [loading,    setLoading]    = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)
  const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

  useEffect(() => {
    setLoading(true)
    Promise.all([getEWasteSummary(), getUpcycleOps(), getCollectionRoute()]).then(([s, u, r]) => {
      setSummary(s); setUpcycle(u); setRoute(r); setLoading(false)
    })
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE}/api/ewaste/classify`, { method: 'POST', body: form })
    setClassResult(await res.json())
    setUploading(false)
  }

  if (loading || !summary) return <div className="text-slate-400 py-10 text-center">Loading e-waste data…</div>

  const pieData = Object.entries(summary.category_breakdown).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-8">
      <SectionHeader
        title="♻ E-Waste & Upcycling Flows"
        description="CV classification, upcycling opportunities, and collection logistics"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pending collection" value={summary.pending_collection} unit="items" icon={<Package size={18} />} variant={summary.pending_collection > 50 ? 'warn' : 'good'} />
        <StatCard label="Items this month" value={summary.items_this_month} />
        <StatCard label="Weight this month" value={summary.weight_kg_this_month} unit="kg" />
        <StatCard label="Diverted from landfill" value={summary.diverted_from_landfill_pct} unit="%" variant="good" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Category Breakdown</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* AI classifier upload */}
        <div className="card flex flex-col">
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Upload size={16} className="text-blue-500" /> AI Item Classifier
          </h2>
          <p className="text-xs text-slate-400 mb-3">Upload a photo of a discarded item for MobileNetV3 classification.</p>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 cursor-pointer hover:border-green-400 transition-colors">
            <Upload size={24} className="text-slate-300 mb-2" />
            <span className="text-sm text-slate-500">{uploading ? 'Classifying…' : 'Click to upload image'}</span>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
          {classResult && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="badge badge-green">{classResult.top_category.replace('_', ' ')}</span>
                <span className="text-xs text-slate-400">{(classResult.predictions[0].confidence * 100).toFixed(0)}% confident</span>
              </div>
              <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1">{classResult.disposal_guidance}</p>
              {classResult.upcycle_opportunities.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mt-2">Upcycling opportunities:</p>
                  {classResult.upcycle_opportunities.map((o: any) => (
                    <p key={o.project} className="text-xs text-green-700">• {o.project} ({o.slots_available} slots)</p>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400">Estimated value: ₹{classResult.recycling_value}</p>
            </div>
          )}
        </div>
      </div>

      {/* Collection route */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <MapPin size={16} className="text-green-600" /> Optimised Collection Route (Greedy TSP)
        </h2>
        <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
          <span>Total distance: <strong>{route.total_distance_m} m</strong></span>
          <span>Items: <strong>{route.total_items}</strong></span>
          <span className="text-green-700">CO₂ saved vs individual trips: <strong>{route.estimated_co2_saved_vs_individual_kg} kg</strong></span>
        </div>
        <ol className="relative border-l border-green-200 ml-3 space-y-3">
          {route.route.map((stop: any) => (
            <li key={stop.stop} className="ml-4">
              <span className="absolute -left-1.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
              <div className="text-sm">
                <span className="font-medium text-slate-700">Stop {stop.stop}: {stop.name}</span>
                {stop.items_collected > 0 && (
                  <span className="ml-2 badge badge-green">{stop.items_collected} items</span>
                )}
                {stop.distance_from_prev_m !== undefined && (
                  <span className="ml-2 text-xs text-slate-400">{stop.distance_from_prev_m} m from prev</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Upcycle opportunities */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4">All Upcycling Opportunities</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {upcycle.opportunities.map((o: any, i: number) => (
            <div key={i} className="rounded-xl border border-green-100 bg-green-50 p-3 text-sm">
              <span className="badge badge-blue mb-1">{o.category.replace('_', ' ')}</span>
              <p className="font-medium text-slate-700 mt-1">{o.project}</p>
              <p className="text-xs text-slate-500 mt-0.5">{o.slots_available} slots available</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
