import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 90000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ── Farmer Profile ─────────────────────────────────────────────────────────────
export const saveProfile = (profile) =>
  api.post('/farmer-profile', profile).then(r => r.data)

// ── Advisory (main AI call) ────────────────────────────────────────────────────
export const getAdvisory = (query, crop) =>
  api.post('/advisory', { query, crop }).then(r => r.data)

// ── Pest Scan ──────────────────────────────────────────────────────────────────
export const pestScanText = (crop, symptoms) =>
  api.post('/pest-scan', { crop, symptoms }).then(r => r.data)

export const pestScanImage = (crop, symptoms, imageFile) => {
  const form = new FormData()
  form.append('crop', crop)
  form.append('symptoms', symptoms || '')
  form.append('image', imageFile)
  return axios.post('/api/pest-scan', form, {
    withCredentials: true,
    timeout: 60000,
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

// ── Mock Data ──────────────────────────────────────────────────────────────────
export const fetchWeather = (location = 'punjab') =>
  api.get(`/mock/weather?location=${encodeURIComponent(location)}`).then(r => r.data)

export const fetchMarket = (crop = 'wheat', location = 'punjab') =>
  api.get(`/mock/market?crop=${encodeURIComponent(crop)}&location=${encodeURIComponent(location)}`).then(r => r.data)

export const fetchSoil = (soilType = 'loamy', location = 'india') =>
  api.get(`/mock/soil?soil_type=${encodeURIComponent(soilType)}&location=${encodeURIComponent(location)}`).then(r => r.data)

// ── Seasonal Calendar ─────────────────────────────────────────────────────────
export const fetchCalendar = (crop = 'wheat') =>
  api.get(`/mock/calendar?crop=${encodeURIComponent(crop)}`).then(r => r.data)

// ── History ────────────────────────────────────────────────────────────────────
export const fetchHistory = () =>
  api.get('/history').then(r => r.data)

export const clearHistory = () =>
  api.delete('/history').then(r => r.data)

// ── Health ─────────────────────────────────────────────────────────────────────
export const healthCheck = () =>
  axios.get('/health', { withCredentials: true }).then(r => r.data)

export default api
