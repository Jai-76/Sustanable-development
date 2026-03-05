const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 30 } })
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.json()
}

// Energy
export const getEnergySummary     = ()                              => get<any>('/api/energy/summary')
export const getEnergyTimeseries  = (id: string, metric='electricity', hours=24) => get<any>(`/api/energy/timeseries/${id}?metric=${metric}&hours=${hours}`)
export const getEnergyNudges      = (id: string)                   => get<any>(`/api/energy/nudges/${id}`)
export const getEnergyAnomalies   = ()                             => get<any>('/api/energy/anomalies')
export const getEnergyForecast    = (id: string)                   => get<any>(`/api/energy/forecast/${id}`)

// Agritech
export const getAgriSummary       = ()                             => get<any>('/api/agritech/summary')
export const getIrrigation        = (id: string)                   => get<any>(`/api/agritech/irrigation/${id}`)
export const getPestRisk          = (id: string)                   => get<any>(`/api/agritech/pest-risk/${id}`)
export const getSoilHealth        = (id: string)                   => get<any>(`/api/agritech/soil-health/${id}`)

// Air Quality
export const getCurrentAQI        = ()                             => get<any>('/api/airquality/current')
export const getAQIForecast       = ()                             => get<any>('/api/airquality/forecast')
export const getCorrelations      = ()                             => get<any>('/api/airquality/correlations')

// E-Waste
export const getEWasteSummary     = ()                             => get<any>('/api/ewaste/summary')
export const getUpcycleOps        = ()                             => get<any>('/api/ewaste/upcycle-opportunities')
export const getCollectionRoute   = ()                             => get<any>('/api/ewaste/collection-route')

// Sensors
export const getSensorReadings    = ()                             => get<any>('/api/sensors/latest')
export const getSensorMap         = ()                             => get<any>('/api/sensors/map')
