import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { AnimatedNumber, TrendArrow, FadeUpCard } from './Animations'
import { fetchWeather, fetchMarket, fetchSoil } from '../utils/api'
import { useProfile } from '../context/AppContext'
import { useLang } from '../context/AppContext'
import { t, weatherEmoji, cropEmoji, formatPrice } from '../utils/helpers'
import {
  Thermometer, Droplets, Wind, Zap, TrendingUp, Package, CloudRain,
  RefreshCw, MapPin, Sun, Cloud
} from 'lucide-react'

// ── Skeleton Loader ────────────────────────────────────────────────────────────
function WidgetSkeleton() {
  return (
    <div className="km-card overflow-hidden animate-pulse">
      <div className="h-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-2/3" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
      </div>
    </div>
  )
}

// ── Weather Card ──────────────────────────────────────────────────────────────
export function WeatherWidget() {
  const { profile } = useProfile()
  const { lang } = useLang()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    setRefreshing(true)
    try {
      const d = await fetchWeather(profile?.location || 'punjab')
      setData(d)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [profile?.location])

  if (loading) return <WidgetSkeleton />

  const cur = data?.current || {}
  const emoji = weatherEmoji(cur.condition)
  const isHot = cur.temperature_c > 37
  const isRain = data?.rain_warning_48h

  // Pick header gradient
  const headerClass = isRain
    ? 'bg-gradient-to-br from-sky-500 to-blue-600'
    : isHot
      ? 'bg-gradient-to-br from-orange-400 to-red-500'
      : 'bg-gradient-to-br from-kisan-500 to-kisan-700'

  return (
    <FadeUpCard className="km-card km-card-hover overflow-hidden">
      {/* Gradient Header */}
      <div className={`${headerClass} p-4 relative overflow-hidden`}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-white/80 mb-1.5">
              <MapPin className="w-3 h-3" />
              {profile?.location || 'India'}
            </div>
            <div className="flex items-baseline gap-2">
              <motion.span
                animate={isHot ? { textShadow: ['0 0 0px rgba(255,255,255,0)', '0 0 16px rgba(255,255,255,0.8)', '0 0 0px rgba(255,255,255,0)'] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl font-bold text-white drop-shadow"
              >
                {cur.temperature_c}°C
              </motion.span>
              <motion.span
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-3xl drop-shadow"
              >
                {emoji}
              </motion.span>
            </div>
            <p className="text-sm text-white/85 mt-0.5 font-medium">{cur.condition}</p>
          </div>
          <motion.button
            onClick={load} disabled={refreshing}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-gray-100 dark:divide-gray-800/60">
        {[
          { icon: Droplets, label: t('Humidity', 'नमी', lang), val: `${cur.humidity_pct}%`, color: 'text-blue-500' },
          { icon: Wind, label: t('Wind', 'हवा', lang), val: `${cur.wind_speed_kmh} km/h`, color: 'text-slate-500' },
          { icon: Zap, label: t('UV Index', 'यूवी', lang), val: cur.uv_index, color: 'text-amber-500' },
          { icon: CloudRain, label: t('Rain Today', 'बारिश', lang), val: `${cur.rainfall_today_mm}mm`, color: 'text-sky-500' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
            <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Rain warning banner — high visibility */}
      {isRain && (
        <motion.div
          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          {/* Solid blue bar — readable on light AND dark */}
          <div className="bg-blue-600 dark:bg-blue-500 px-4 py-2.5 flex items-center gap-2.5">
            <motion.div
              animate={{ scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="flex-shrink-0"
            >
              <CloudRain className="w-4 h-4 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white leading-tight">
                {t('⚠️ Rain Warning', '⚠️ बारिश की चेतावनी', lang)}
              </p>
              <p className="text-xs text-blue-100 leading-tight mt-0.5 truncate">
                {t(
                  `${data.total_rain_48h_mm}mm forecast in 48h — skip irrigation & spraying`,
                  `${data.total_rain_48h_mm}mm बारिश — सिंचाई और छिड़काव न करें`,
                  lang
                )}
              </p>
            </div>
            {/* Animated ripple dot */}
            <motion.div
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="w-2.5 h-2.5 rounded-full bg-white/80 flex-shrink-0"
            />
          </div>
        </motion.div>
      )}

      {/* 5-day mini forecast */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800/60">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
          {t('5-Day Forecast', '5 दिन का पूर्वानुमान', lang)}
        </p>
        <div className="flex justify-between">
          {(data?.forecast || []).slice(0, 5).map(d => (
            <div key={d.day} className="flex flex-col items-center gap-0.5">
              <span className="text-xs text-gray-400">{d.date.split(' ')[0]}</span>
              <span className="text-lg">{weatherEmoji(d.condition)}</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{d.temp_max_c}°</span>
              {d.rainfall_mm > 0 && (
                <span className="text-xs text-blue-500 font-medium">{d.rainfall_mm}mm</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </FadeUpCard>
  )
}

// ── Market Price Widget ────────────────────────────────────────────────────────
export function MarketWidget() {
  const { profile } = useProfile()
  const { lang } = useLang()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMarket(profile?.crop || 'wheat', profile?.location || 'punjab')
      .then(setData).catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [profile?.crop, profile?.location])

  if (loading) return <WidgetSkeleton />
  if (!data) return null

  const isUp = data.trend === 'rising'
  const chartData = (data.price_30d_history || []).slice(-14)
  const headerClass = isUp
    ? 'bg-gradient-to-br from-emerald-500 to-green-700'
    : 'bg-gradient-to-br from-rose-400 to-red-600'

  return (
    <FadeUpCard delay={0.1} className="km-card km-card-hover overflow-hidden">
      {/* Gradient Header */}
      <div className={`${headerClass} p-4 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-1.5 text-white/80 text-xs mb-1.5">
              <Package className="w-3 h-3" />
              {t('Mandi Price', 'मंडी भाव', lang)} / quintal
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-bold text-white drop-shadow">
                ₹<AnimatedNumber value={data.spot_price} />
              </span>
              <TrendArrow pct={data.trend_pct} light />
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-lg">{cropEmoji(data.crop)}</span>
              <span className="text-sm text-white/85 font-medium capitalize">{data.crop}</span>
            </div>
          </div>
          {data.msp && (
            <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${
              data.spot_price >= data.msp
                ? 'bg-white/20 text-white'
                : 'bg-white/15 text-white/80'
            }`}>
              MSP: ₹{data.msp}
              {data.spot_price >= data.msp ? ' ✓' : ' ↓'}
            </div>
          )}
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-[72px] px-1 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0.35} />
                <stop offset="95%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="price"
              stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth={2}
              fill="url(#priceGrad)" dot={false}
              animationDuration={1500} animationEasing="ease-out"
            />
            <Tooltip
              contentStyle={{
                fontSize: '11px', padding: '4px 8px', borderRadius: '8px',
                border: 'none', background: '#1f2937', color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
              formatter={v => [`₹${v}`, '']}
              labelFormatter={() => ''}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Best nearby mandi */}
      {data.best_mandi && (
        <div className="px-4 py-3 bg-kisan-50/60 dark:bg-kisan-900/20 border-t border-kisan-100/60 dark:border-kisan-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('Best Mandi', 'सबसे अच्छी मंडी', lang)}
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{data.best_mandi.mandi}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('Net', 'शुद्ध', lang)}</p>
              <p className="text-sm font-bold text-kisan-700 dark:text-kisan-400">₹{data.best_mandi.net_realisation}/q</p>
            </div>
          </div>
        </div>
      )}
    </FadeUpCard>
  )
}

// ── Soil Stats Widget ─────────────────────────────────────────────────────────
export function SoilWidget() {
  const { profile } = useProfile()
  const { lang } = useLang()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSoil(profile?.soil_type || 'loamy', profile?.location || 'india')
      .then(setData).catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [profile?.soil_type])

  if (loading) return <WidgetSkeleton />
  if (!data) return null

  const npk = data.npk || {}
  const moisturePct = data.moisture_pct || 0

  const statusColor = (s) =>
    s === 'Critical' ? 'text-red-600 dark:text-red-400'
    : s === 'Deficient' ? 'text-amber-600 dark:text-amber-400'
    : 'text-green-600 dark:text-green-400'

  const statusBg = (s) =>
    s === 'Critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30'
    : s === 'Deficient' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30'
    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30'

  // Health score for header color
  const avgStatus = [npk.N_status, npk.P_status, npk.K_status].filter(Boolean)
  const hasCritical = avgStatus.includes('Critical')
  const hasDeficient = avgStatus.includes('Deficient')
  const headerClass = hasCritical
    ? 'bg-gradient-to-br from-red-500 to-rose-700'
    : hasDeficient
      ? 'bg-gradient-to-br from-amber-500 to-orange-600'
      : 'bg-gradient-to-br from-earth-500 to-earth-700'

  return (
    <FadeUpCard delay={0.2} className="km-card km-card-hover overflow-hidden">
      {/* Gradient Header */}
      <div className={`${headerClass} p-4 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-white/80 text-xs mb-1">{t('Soil Health', 'मिट्टी की सेहत', lang)}</p>
            <p className="text-xl font-bold text-white capitalize">{data.soil_type} Soil</p>
            <p className="text-sm text-white/80 mt-0.5">
              pH: <span className="font-semibold text-white">{data.ph}</span>
              <span className={`ml-2 text-xs font-semibold ${
                data.ph < 6 || data.ph > 8 ? 'text-amber-200' : 'text-green-200'
              }`}>{data.ph_status}</span>
            </p>
          </div>
          {/* Moisture badge */}
          <div className="text-center bg-white/20 rounded-xl px-3 py-1.5">
            <p className="text-white/70 text-xs">{t('Moisture', 'नमी', lang)}</p>
            <p className="text-white font-bold text-lg leading-none">{moisturePct}%</p>
          </div>
        </div>

        {/* pH bar */}
        <div className="mt-3 relative z-10">
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((data.ph - 4) / 6) * 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(to right, #fca5a5, #a7f3d0, #93c5fd)' }}
            />
          </div>
          <div className="flex justify-between text-white/50 text-xs mt-0.5">
            <span>4 (Acid)</span><span>7 (Neutral)</span><span>10 (Alk)</span>
          </div>
        </div>
      </div>

      {/* NPK pills */}
      <div className="p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
          {t('NPK Levels (kg/ha)', 'एनपीके स्तर (kg/ha)', lang)}
        </p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { key: 'N', label: 'N — नाइट्रोजन', val: npk.N_kg_per_ha, status: npk.N_status },
            { key: 'P', label: 'P — फास्फोरस', val: npk.P_kg_per_ha, status: npk.P_status },
            { key: 'K', label: 'K — पोटेशियम', val: npk.K_kg_per_ha, status: npk.K_status },
          ].map(n => (
            <motion.div
              key={n.key}
              whileHover={{ scale: 1.04, y: -1 }}
              transition={{ duration: 0.18 }}
              className={`rounded-xl p-2.5 text-center border ${statusBg(n.status)}`}
            >
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400">{n.key}</div>
              <div className="text-base font-bold text-gray-800 dark:text-gray-200">{Math.round(n.val)}</div>
              <div className={`text-xs font-semibold ${statusColor(n.status)}`}>{n.status}</div>
            </motion.div>
          ))}
        </div>

        {/* Organic matter */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            {t('Organic Matter', 'जैविक पदार्थ', lang)}
          </span>
          <span className="font-semibold text-kisan-700 dark:text-kisan-400">
            {data.organic_matter_pct}%
          </span>
        </div>
      </div>
    </FadeUpCard>
  )
}
