'use client'
import { useEffect, useState } from 'react'
import SectionHeader from '@/components/SectionHeader'
import { ExternalLink, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const ENDPOINTS = [
  { method: 'GET', path: '/api/energy/summary',            label: 'Energy campus summary'       },
  { method: 'GET', path: '/api/energy/anomalies',          label: 'Anomaly detection'            },
  { method: 'GET', path: '/api/energy/nudges/hostel-a',    label: 'AI nudges — Hostel A'         },
  { method: 'GET', path: '/api/energy/forecast/lab-cs',    label: 'Demand forecast — CS Lab'     },
  { method: 'GET', path: '/api/agritech/summary',          label: 'Farm plots summary'           },
  { method: 'GET', path: '/api/agritech/irrigation/plot-01', label: 'Irrigation schedule'        },
  { method: 'GET', path: '/api/agritech/pest-risk/plot-01',  label: 'Pest risk score'            },
  { method: 'GET', path: '/api/agritech/soil-health/plot-01','label': 'Soil health index'        },
  { method: 'GET', path: '/api/airquality/current',        label: 'Live AQI readings'            },
  { method: 'GET', path: '/api/airquality/forecast',       label: 'AQI 6-hour forecast'          },
  { method: 'GET', path: '/api/airquality/correlations',   label: 'Behaviour correlations'       },
  { method: 'GET', path: '/api/airquality/policy-sim',     label: 'Policy what-if simulation'    },
  { method: 'GET', path: '/api/ewaste/summary',            label: 'E-waste flow summary'         },
  { method: 'GET', path: '/api/ewaste/collection-route',   label: 'Collection route (TSP)'       },
  { method: 'GET', path: '/api/ewaste/upcycle-opportunities', label: 'Upcycling opportunities'   },
  { method: 'GET', path: '/api/sensors/latest',            label: 'Latest sensor readings'       },
  { method: 'GET', path: '/api/sensors/map',               label: 'Sensor map & metadata'        },
]

interface PingResult { path: string; status: number | 'error'; ms: number }

export default function ApiExplorerPage() {
  const [selected,   setSelected]   = useState<typeof ENDPOINTS[0] | null>(null)
  const [response,   setResponse]   = useState<string>('')
  const [loading,    setLoading]    = useState(false)
  const [pingResults,setPingResults]= useState<PingResult[]>([])
  const [pinging,    setPinging]    = useState(false)
  const [activeTab,  setActiveTab]  = useState<'explorer' | 'health'>('explorer')
  const [backendInfo, setBackendInfo] = useState<any>(null)

  useEffect(() => {
    fetch(`${API}/`)
      .then(r => r.json())
      .then(setBackendInfo)
      .catch(() => {})
  }, [])

  const call = async (ep: typeof ENDPOINTS[0]) => {
    setSelected(ep)
    setLoading(true)
    setResponse('')
    try {
      const r = await fetch(`${API}${ep.path}`)
      const json = await r.json()
      setResponse(JSON.stringify(json, null, 2))
    } catch (e: any) {
      setResponse(`Error: ${e.message}`)
    }
    setLoading(false)
  }

  const pingAll = async () => {
    setPinging(true)
    setPingResults([])
    const results: PingResult[] = []
    for (const ep of ENDPOINTS) {
      const t0 = performance.now()
      try {
        const r = await fetch(`${API}${ep.path}`)
        results.push({ path: ep.path, status: r.status, ms: Math.round(performance.now() - t0) })
      } catch {
        results.push({ path: ep.path, status: 'error', ms: Math.round(performance.now() - t0) })
      }
      setPingResults([...results])
    }
    setPinging(false)
  }

  const METHOD_COLOR: Record<string, string> = {
    GET:    'bg-blue-100 text-blue-700',
    POST:   'bg-green-100 text-green-700',
    DELETE: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="🔌 API Explorer"
        description="Browse and test every backend endpoint live from this page"
        action={
          <div className="flex gap-2">
            <a href={`${API}/docs`}    target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <ExternalLink size={14} /> Swagger UI
            </a>
            <a href={`${API}/redoc`}   target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <ExternalLink size={14} /> ReDoc
            </a>
          </div>
        }
      />

      {/* Backend info banner */}
      {backendInfo && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm">
          <CheckCircle size={16} className="text-green-600 shrink-0" />
          <span className="text-green-800 font-medium">{backendInfo.message}</span>
          <span className="ml-auto text-green-600 font-mono text-xs">{API}</span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['explorer', 'health'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px
              ${activeTab === tab ? 'border-green-600 text-green-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {tab === 'explorer' ? '📡 Endpoint Explorer' : '🏥 Health Check'}
          </button>
        ))}
      </div>

      {activeTab === 'explorer' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Endpoint list */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-sm font-semibold text-slate-700">Endpoints ({ENDPOINTS.length})</p>
              <p className="text-xs text-slate-400 mt-0.5">Click any endpoint to call it live</p>
            </div>
            <ul className="divide-y divide-slate-50 max-h-[560px] overflow-y-auto">
              {ENDPOINTS.map(ep => (
                <li key={ep.path}>
                  <button onClick={() => call(ep)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3
                      ${selected?.path === ep.path ? 'bg-green-50' : ''}`}>
                    <span className={`badge shrink-0 mt-0.5 ${METHOD_COLOR[ep.method]}`}>{ep.method}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{ep.label}</p>
                      <p className="text-xs font-mono text-slate-400 truncate">{ep.path}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Response pane */}
          <div className="card p-0 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {selected ? selected.label : 'Response'}
                </p>
                {selected && (
                  <p className="text-xs font-mono text-slate-400">{API}{selected.path}</p>
                )}
              </div>
              {selected && (
                <button onClick={() => call(selected)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors">
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Re-run
                </button>
              )}
            </div>
            <div className="flex-1 overflow-auto bg-slate-900 p-4 min-h-[480px]">
              {!selected && (
                <p className="text-slate-500 text-sm mt-4 text-center">← Select an endpoint to call it</p>
              )}
              {loading && (
                <p className="text-green-400 text-sm animate-pulse">Fetching…</p>
              )}
              {!loading && response && (
                <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap break-all leading-relaxed">
                  {response}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={pingAll} disabled={pinging}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors">
              <RefreshCw size={14} className={pinging ? 'animate-spin' : ''} />
              {pinging ? 'Pinging all endpoints…' : 'Ping All Endpoints'}
            </button>
            {pingResults.length > 0 && (
              <span className="text-sm text-slate-500">
                {pingResults.filter(r => r.status !== 'error' && r.status < 400).length}/{ENDPOINTS.length} healthy
              </span>
            )}
          </div>

          {pingResults.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Endpoint</th>
                    <th className="px-4 py-3 text-right">Latency</th>
                    <th className="px-4 py-3 text-right">HTTP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pingResults.map(r => {
                    const ok = r.status !== 'error' && Number(r.status) < 400
                    return (
                      <tr key={r.path} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5">
                          {ok
                            ? <CheckCircle size={16} className="text-green-500" />
                            : <XCircle    size={16} className="text-red-500"   />}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{r.path}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          <span className={`text-xs font-semibold ${r.ms < 100 ? 'text-green-600' : r.ms < 500 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {r.ms} ms
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`badge ${ok ? 'badge-green' : 'badge-red'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pingResults.length === 0 && !pinging && (
            <div className="card text-center py-12 text-slate-400">
              <Clock size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Click "Ping All Endpoints" to run a health check across all {ENDPOINTS.length} routes</p>
            </div>
          )}
        </div>
      )}

      {/* Embedded Swagger iframe */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">📖 Swagger UI — Full Interactive Docs</p>
          <a href={`${API}/docs`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium">
            Open in new tab <ExternalLink size={12} />
          </a>
        </div>
        <iframe
          src={`${API}/docs`}
          className="w-full border-0"
          style={{ height: '70vh' }}
          title="FastAPI Swagger Docs"
        />
      </div>
    </div>
  )
}
