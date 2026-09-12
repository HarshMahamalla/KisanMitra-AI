import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, ImagePlus, X, Leaf, Droplets, Bug, TrendingUp,
  AlertTriangle, CheckCircle, Info, Loader2, Mic, MicOff,
  Zap, Volume2, VolumeX, MessageCircle, LayoutGrid, StopCircle
} from 'lucide-react'
import { useProfile, useLang, useHistory } from '../context/AppContext'
import { pestScanImage, pestScanText } from '../utils/api'
import { t, actionColor, confidenceColor, severityColor } from '../utils/helpers'
import { StatusBadge, ActionBanner, FadeUpCard, ScrollReveal, SkeletonCard } from '../components/Animations'
import { RainOverlay } from '../components/Animations'
import Mascot, { deriveMascotState } from '../components/Mascot'
import FarmHealthScore from '../components/FarmHealthScore'
import ExplainabilityPanel from '../components/ExplainabilityPanel'
import ShareableCard from '../components/ShareableCard'
import { NetworkIndicator, OfflineBanner } from '../components/NetworkIndicator'
import { useVoice } from '../hooks/useVoice'
import { useOfflineMode, useStreamingAdvisory } from '../hooks/useAdvisory'
import toast from 'react-hot-toast'

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'summary',    icon: Zap,        en: 'Summary',       hi: 'सारांश' },
  { id: 'crop',       icon: Leaf,       en: 'Crop Advisory', hi: 'फसल सलाह' },
  { id: 'irrigation', icon: Droplets,   en: 'Irrigation',    hi: 'सिंचाई' },
  { id: 'pest',       icon: Bug,        en: 'Pest / Disease',hi: 'कीट / रोग' },
  { id: 'market',     icon: TrendingUp, en: 'Market',        hi: 'बाज़ार' },
]

// ── BiText ────────────────────────────────────────────────────────────────────
function BiText({ en, hi, lang, className = '' }) {
  if (!en && !hi) return null
  if (lang === 'hi') return <p className={`font-devanagari ${className}`}>{hi || en}</p>
  return (
    <div className={className}>
      <p className="mb-1">{en}</p>
      {hi && <p className="text-gray-500 dark:text-gray-400 text-sm font-devanagari border-t border-gray-100 dark:border-gray-800 pt-1 mt-1">{hi}</p>}
    </div>
  )
}

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">{label}</span>
      <p className="text-sm text-gray-700 dark:text-gray-300">{value}</p>
    </div>
  )
}

function EmptyTabMsg({ msg }) {
  return (
    <div className="py-10 text-center text-gray-400 dark:text-gray-600">
      <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p className="text-sm">{msg}</p>
    </div>
  )
}

// ── Progressive agent card (shown in real-time during streaming) ───────────────
function AgentCard({ agentKey, result, lang }) {
  const icons = { crop: Leaf, irrigation: Droplets, pest: Bug, market: TrendingUp }
  const labels = { crop: t('Crop', 'फसल', lang), irrigation: t('Irrigation', 'सिंचाई', lang), pest: t('Pest', 'कीट', lang), market: t('Market', 'बाज़ार', lang) }
  const Icon = icons[agentKey] || Zap

  if (!result) return (
    <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded mb-1.5" />
      <div className="h-2.5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  )

  const previewText = result.fertilizer_recommendation || result.action || result.primary_diagnosis || result.recommended_action || result.decision_reason || '—'
  const isError = !!result.error

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-xl border ${isError ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10' : 'border-kisan-200 dark:border-kisan-900 bg-kisan-50 dark:bg-kisan-900/10'}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${isError ? 'text-red-500' : 'text-kisan-600 dark:text-kisan-400'}`} />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{labels[agentKey]}</span>
        {!isError && <CheckCircle className="w-3 h-3 text-kisan-500 ml-auto" />}
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{isError ? result.error : previewText}</p>
    </motion.div>
  )
}

// ── Advisory Result Tabs ───────────────────────────────────────────────────────
function AdvisoryResult({ data, lang, streamingText, agentResults, profile }) {
  const [tab, setTab] = useState('summary')
  const di = data?.domain_insights || {}
  const rainActive = di.irrigation?.action === 'DELAY' || di.irrigation?.weather_alert?.toLowerCase().includes('rain')
  const isStreaming = !data && !!streamingText

  return (
    <div>
      <RainOverlay active={rainActive} />

      {/* Real-time agent cards during streaming */}
      {Object.keys(agentResults).length > 0 && !data && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {['crop','irrigation','pest','market'].map(k => agentResults[k] !== undefined && (
            <AgentCard key={k} agentKey={k} result={agentResults[k]} lang={lang} />
          ))}
        </div>
      )}

      {/* Streaming text preview */}
      {isStreaming && (
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mb-4 font-mono text-xs text-gray-500 dark:text-gray-400 max-h-32 overflow-y-auto">
          {streamingText}<span className="animate-pulse">▊</span>
        </div>
      )}

      {!data && !isStreaming && null}
      {!data && isStreaming && null}
      {data && (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto pb-1 mb-4 scrollbar-hide">
            {TABS.map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  tab === tb.id ? 'text-kisan-700 dark:text-kisan-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                <tb.icon className="w-3.5 h-3.5" />
                {lang === 'hi' ? tb.hi : tb.en}
                {tab === tb.id && (
                  <motion.div layoutId="ask-tab-indicator"
                    className="absolute inset-0 bg-kisan-50 dark:bg-kisan-900/30 rounded-lg -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {/* Summary Tab */}
              {tab === 'summary' && (
                <div className="space-y-4">
                  {(data.greeting || data.greeting_hi) && (
                    <div className="p-4 rounded-xl bg-kisan-50 dark:bg-kisan-900/20 border border-kisan-100 dark:border-kisan-900/30">
                      <BiText en={data.greeting} hi={data.greeting_hi} lang={lang} className="text-sm text-kisan-800 dark:text-kisan-300 font-medium" />
                    </div>
                  )}
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('Key Recommendation', 'मुख्य सलाह', lang)}</h3>
                    <BiText en={data.summary} hi={data.summary_hi} lang={lang} className="text-base font-semibold text-gray-900 dark:text-gray-100" />
                  </div>
                  {(data.main_advice_en || data.main_advice_hi) && (
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('Detailed Advice', 'विस्तृत सलाह', lang)}</h3>
                      <BiText en={data.main_advice_en} hi={data.main_advice_hi} lang={lang} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" />
                    </div>
                  )}
                  {(data.immediate_actions?.length > 0) && (
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('Immediate Actions', 'तुरंत करें', lang)}</h3>
                      <ul className="space-y-2">
                        {(lang === 'hi' ? (data.immediate_actions_hi || data.immediate_actions) : data.immediate_actions)?.map((a, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                            <CheckCircle className="w-4 h-4 text-kisan-600 dark:text-kisan-400 flex-shrink-0 mt-0.5" />
                            <span className={lang === 'hi' ? 'font-devanagari' : ''}>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {di.irrigation?.action && <ActionBanner action={di.irrigation.action} lang={lang} />}
                    {di.market?.recommended_action && <ActionBanner action={di.market.recommended_action} lang={lang} />}
                  </div>
                  {data.caution_warnings?.filter(Boolean).length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">{t('Caution Warnings', 'सावधानियां', lang)}</h3>
                      </div>
                      <ul className="space-y-1.5">
                        {data.caution_warnings.filter(Boolean).map((w, i) => (
                          <li key={i} className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                            <span className="mt-0.5">⚠️</span> {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(data.encouragement_en || data.encouragement_hi) && (
                    <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 text-sm">
                      <span className="mr-1">🌱</span>
                      <BiText en={data.encouragement_en} hi={data.encouragement_hi} lang={lang} className="inline text-green-800 dark:text-green-300" />
                    </div>
                  )}
                </div>
              )}
              {tab === 'crop' && (
                <div className="space-y-3">
                  {di.crop_advisory ? <>
                    <InfoRow label={t('Growth Phase', 'विकास अवस्था', lang)} value={di.crop_advisory.growth_phase} />
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">{t('Fertilizer Recommendation', 'खाद की सलाह', lang)}</label>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{di.crop_advisory.fertilizer_recommendation}</p>
                    </div>
                    <InfoRow label={t('Dosage & Method', 'मात्रा और तरीका', lang)} value={di.crop_advisory.dosage} />
                  </> : <EmptyTabMsg msg={t('No crop advisory. Ask about fertilizer or soil.', 'खाद या मिट्टी के बारे में पूछें।', lang)} />}
                </div>
              )}
              {tab === 'irrigation' && (
                <div className="space-y-3">
                  {di.irrigation?.action ? <>
                    <ActionBanner action={di.irrigation.action} lang={lang} />
                    <InfoRow label={t('Schedule', 'समय-सारणी', lang)} value={di.irrigation.schedule_hours} />
                    {di.irrigation.weather_alert && di.irrigation.weather_alert !== 'No critical weather alert' && (
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800 dark:text-blue-300">{di.irrigation.weather_alert}</p>
                      </div>
                    )}
                  </> : <EmptyTabMsg msg={t('No irrigation data. Ask about watering.', 'पानी के बारे में पूछें।', lang)} />}
                </div>
              )}
              {tab === 'pest' && (
                <div className="space-y-3">
                  {di.health_diagnosis?.issue_detected ? <>
                    <div className="flex flex-wrap gap-2">
                      {di.health_diagnosis.confidence && <StatusBadge label={`${t('Confidence', 'विश्वास', lang)}: ${di.health_diagnosis.confidence}`} color={confidenceColor(di.health_diagnosis.confidence)} />}
                    </div>
                    <InfoRow label={t('Issue Detected', 'समस्या', lang)} value={di.health_diagnosis.issue_detected} />
                    {di.health_diagnosis.treatment_organic && (
                      <div className="p-4 rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/10">
                        <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase block mb-1.5">🌿 {t('Organic Treatment', 'जैविक उपचार', lang)}</label>
                        <p className="text-sm text-green-900 dark:text-green-200">{di.health_diagnosis.treatment_organic}</p>
                      </div>
                    )}
                    {di.health_diagnosis.treatment_chemical && di.health_diagnosis.treatment_chemical !== 'Not required' && (
                      <div className="p-4 rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-900/10">
                        <label className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase block mb-1.5">⚗️ {t('Chemical (Last Resort)', 'रासायनिक (अंतिम)', lang)}</label>
                        <p className="text-sm text-orange-900 dark:text-orange-200">{di.health_diagnosis.treatment_chemical}</p>
                      </div>
                    )}
                  </> : <EmptyTabMsg msg={t('No pest diagnosis. Describe symptoms or use Pest Scan.', 'लक्षण बताएं या कीट स्कैन करें।', lang)} />}
                </div>
              )}
              {tab === 'market' && (
                <div className="space-y-3">
                  {di.market?.recommended_action ? <>
                    <ActionBanner action={di.market.recommended_action} lang={lang} />
                    <InfoRow label={t('Target Price Range', 'लक्ष्य मूल्य', lang)} value={di.market.target_price_range} />
                  </> : <EmptyTabMsg msg={t('No market advisory. Ask about mandi prices.', 'मंडी भाव के बारे में पूछें।', lang)} />}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Explainability panel */}
          <ExplainabilityPanel reasoningFactors={data.reasoning_factors} />
        </>
      )}
    </div>
  )
}

// ── Pest Scan Panel ────────────────────────────────────────────────────────────
function PestScanPanel({ lang }) {
  const { profile } = useProfile()
  const [crop, setCrop] = useState(profile?.crop || '')
  const [symptoms, setSymptoms] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  const scan = async () => {
    if (!crop && !symptoms && !image) { toast.error(t('Provide crop name and symptoms or an image', 'फसल और लक्षण या फोटो दें', lang)); return }
    setLoading(true)
    try {
      const data = image ? await pestScanImage(crop, symptoms, image) : await pestScanText(crop, symptoms)
      setResult(data)
    } catch { toast.error(t('Pest scan failed.', 'स्कैन विफल हुआ।', lang)) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><Bug className="w-4 h-4 text-amber-500" />{t('Pest & Disease Scanner', 'कीट और रोग स्कैनर', lang)}</h3>
        <input value={crop} onChange={e => setCrop(e.target.value)} placeholder={t('Crop name', 'फसल का नाम', lang)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} rows={3}
          placeholder={t('Describe symptoms (yellowing, spots, wilting, insects...)', 'लक्षण बताएं (पीलापन, दाग, मुरझाना...)', lang)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
        <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center cursor-pointer hover:border-amber-400 transition-colors">
          {preview ? (
            <div className="relative inline-block">
              <img src={preview} alt="preview" className="max-h-32 rounded-lg mx-auto" />
              <button onClick={e => { e.stopPropagation(); setImage(null); setPreview(null) }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>
            </div>
          ) : <div className="text-gray-400"><ImagePlus className="w-8 h-8 mx-auto mb-1 opacity-50" /><p className="text-xs">{t('Upload crop photo (optional)', 'फसल की फोटो अपलोड करें (वैकल्पिक)', lang)}</p></div>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setImage(f); const r = new FileReader(); r.onload = ev => setPreview(ev.target.result); r.readAsDataURL(f) } }} />
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={scan} disabled={loading}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4" />}
          {t(loading ? 'Scanning...' : 'Scan Now', loading ? 'स्कैन हो रहा है...' : 'अभी स्कैन करें', lang)}
        </motion.button>
      </div>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/10 space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-300">{result.primary_diagnosis}</h4>
              {result.confidence && <StatusBadge label={`${result.confidence} Confidence`} color={confidenceColor(result.confidence)} />}
              {result.severity && <StatusBadge label={result.severity} color={severityColor(result.severity)} pulse={result.severity === 'Critical'} />}
            </div>
            {result.ipm_tier2_biological && <p className="text-xs text-gray-700 dark:text-gray-300"><strong>Bio:</strong> {result.ipm_tier2_biological}</p>}
            {result.ipm_tier3_chemical && result.ipm_tier3_chemical !== 'Not required at this severity' && <p className="text-xs text-orange-800 dark:text-orange-300"><strong>Chem:</strong> {result.ipm_tier3_chemical}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Chat bubble ────────────────────────────────────────────────────────────────
function ChatBubble({ msg, lang }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, x: isUser ? 8 : -8 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-kisan-100 dark:bg-kisan-900/40 flex items-center justify-center flex-shrink-0 text-sm">🌾</div>
      )}
      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-kisan-600 text-white rounded-br-sm'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
      }`}>
        {msg.role === 'user' ? (
          <span className={lang === 'hi' ? 'font-devanagari' : ''}>{msg.content}</span>
        ) : msg.loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin opacity-60" />
            <span className="text-gray-400 text-xs italic">{t('KisanMitra is thinking...', 'सोच रहा है...', lang)}</span>
          </span>
        ) : (
          <div className="space-y-1.5">
            {msg.summary && <p className="font-semibold">{lang === 'hi' && msg.summary_hi ? msg.summary_hi : msg.summary}</p>}
            {msg.content && <p className={lang === 'hi' ? 'font-devanagari' : ''}>{msg.content}</p>}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Main AskKisanMitra Page ────────────────────────────────────────────────────
export default function AskKisanMitra() {
  const { profile } = useProfile()
  const { lang } = useLang()
  const { addEntry } = useHistory()
  const [searchParams] = useSearchParams()

  const [query, setQuery]           = useState(searchParams.get('q') || '')
  const [result, setResult]         = useState(null)
  const [healthScore, setHealthScore] = useState(null)
  const [showPestPanel, setShowPestPanel] = useState(false)
  const [viewMode, setViewMode]     = useState('dashboard') // 'dashboard' | 'chat'
  const [chatMessages, setChatMessages] = useState([])
  const [muted, setMuted]           = useState(false)
  const [mascotState, setMascotState] = useState('idle')

  const inputRef = useRef()
  const resultRef = useRef()
  const chatEndRef = useRef()

  const offlineMode = useOfflineMode()
  const voice = useVoice(lang)

  // ── Streaming advisory hook ──────────────────────────────────────────────────
  const [liveAgentResults, setLiveAgentResults] = useState({})
  const advisory = useStreamingAdvisory({
    offlineMode,
    onAgentDone: (agent, agentResult) => {
      setLiveAgentResults(prev => ({ ...prev, [agent]: agentResult }))
    },
    onHealthScore: (hs) => setHealthScore(hs),
    onComplete: (data) => {
      setResult(data)
      setLiveAgentResults({})
      setMascotState(deriveMascotState(data, false))

      // Speak summary aloud if not muted
      if (!muted && voice.supported) {
        const text = lang === 'hi' ? (data.summary_hi || data.summary) : data.summary
        voice.speak(text)
      }

      addEntry({
        id: Date.now(), query, crop: profile?.crop,
        timestamp: new Date().toISOString(),
        summary: data.summary || '', summary_hi: data.summary_hi || '',
        intents: data._meta?.intents_detected || [],
      })

      if (viewMode === 'chat') {
        setChatMessages(msgs => {
          const filtered = msgs.filter(m => !m.loading)
          return [...filtered, {
            id: Date.now(), role: 'assistant',
            summary: data.summary, summary_hi: data.summary_hi,
            content: lang === 'hi' ? (data.main_advice_hi || '') : (data.main_advice_en || ''),
          }]
        })
      }

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    },
    onError: (msg) => {
      setMascotState('idle')
      toast.error(msg || t('KisanMitra is unavailable. Please try again.', 'KisanMitra अभी उपलब्ध नहीं है।', lang))
    },
  })

  // Sync mascot to loading state
  useEffect(() => {
    if (advisory.loading) setMascotState('thinking')
  }, [advisory.loading])

  // Auto-fill query from URL param
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) { setQuery(q); inputRef.current?.focus() }
  }, [searchParams])

  // Scroll chat to bottom
  useEffect(() => {
    if (viewMode === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, viewMode])

  // Sync voice transcript → input
  useEffect(() => {
    if (voice.transcript) setQuery(voice.transcript)
  }, [voice.transcript])

  const submit = useCallback(() => {
    if (!query.trim() || advisory.loading) return
    if (voice.listening) voice.stopListening()
    if (voice.speaking) voice.stopSpeaking()

    if (viewMode === 'chat') {
      setChatMessages(msgs => [
        ...msgs,
        { id: Date.now(), role: 'user', content: query.trim() },
        { id: Date.now() + 1, role: 'assistant', loading: true },
      ])
    }

    setResult(null)
    setLiveAgentResults({})
    setHealthScore(null)
    advisory.submit(query.trim(), profile?.crop)
  }, [query, advisory, voice, profile, viewMode])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  const showOfflineCached = offlineMode.isOffline && offlineMode.lastCached?.data
  const displayResult = result || (showOfflineCached ? offlineMode.lastCached.data : null)

  return (
    <div className="min-h-screen pb-10">
      {/* Offline banner */}
      <OfflineBanner mode={offlineMode.mode} lastCached={offlineMode.lastCached} lang={lang} />

      <div className="max-w-3xl mx-auto px-4 pt-20">
        {/* Header row */}
        <FadeUpCard className="mt-4 mb-4 flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Mascot state={mascotState} speaking={voice.speaking} compact={false} />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('Ask KisanMitra', 'KisanMitra से पूछें', lang)}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('Crops · Soil · Water · Pests · Market', 'फसल · मिट्टी · पानी · कीट · बाज़ार', lang)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Network indicator */}
            <NetworkIndicator mode={offlineMode.mode} setMode={offlineMode.setNetworkMode} />
            {/* View mode toggle */}
            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {[{ id: 'dashboard', icon: LayoutGrid }, { id: 'chat', icon: MessageCircle }].map(({ id, icon: Icon }) => (
                <button key={id} onClick={() => setViewMode(id)}
                  className={`px-2.5 py-1.5 transition-colors ${viewMode === id ? 'bg-kisan-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
            {/* Mute toggle */}
            {voice.supported && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setMuted(m => !m); if (!muted) voice.stopSpeaking() }}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </motion.button>
            )}
          </div>
        </FadeUpCard>

        {/* ── CHAT VIEW ────────────────────────────────────────────────────────── */}
        {viewMode === 'chat' && (
          <div className="mb-4">
            <div className="min-h-64 max-h-[50vh] overflow-y-auto space-y-3 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 mb-3">
              {chatMessages.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                  <p className="text-sm">{t('Start a conversation with KisanMitra', 'KisanMitra से बात करें', lang)}</p>
                </div>
              )}
              {chatMessages.map(msg => <ChatBubble key={msg.id} msg={msg} lang={lang} />)}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        {/* ── QUERY INPUT ──────────────────────────────────────────────────────── */}
        <FadeUpCard delay={0.1} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm mb-4 overflow-hidden">
          <div className="p-4">
            <textarea
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t(
                'e.g. "My wheat leaves are yellowing and there are black spots. What should I do?"',
                'जैसे: "मेरे गेहूं की पत्तियां पीली हो रही हैं। क्या करूं?"', lang
              )}
              rows={3} maxLength={2000} disabled={advisory.loading}
              className="w-full text-sm text-gray-800 dark:text-gray-200 bg-transparent placeholder-gray-400 focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{query.length}/2000</span>
                {/* Voice input */}
                {voice.supported && (
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => voice.listening ? voice.stopListening() : voice.startListening()}
                    className={`p-1.5 rounded-lg transition-colors ${voice.listening ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}
                    title={t(voice.listening ? 'Stop listening' : 'Voice input', voice.listening ? 'सुनना बंद करें' : 'आवाज़ से पूछें', lang)}
                  >
                    {voice.listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </motion.button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.93 }}
                  onClick={() => setShowPestPanel(s => !s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${showPestPanel ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}
                >
                  <Bug className="w-3.5 h-3.5" />{t('Pest Scan', 'कीट स्कैन', lang)}
                </motion.button>
                {advisory.loading ? (
                  <motion.button whileTap={{ scale: 0.93 }} onClick={advisory.abort}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                    <StopCircle className="w-3.5 h-3.5" />{t('Stop', 'रोकें', lang)}
                  </motion.button>
                ) : (
                  <motion.button whileTap={{ scale: 0.93 }} onClick={submit}
                    disabled={!query.trim() || offlineMode.isOffline}
                    className="flex items-center gap-2 px-4 py-2 bg-kisan-600 hover:bg-kisan-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm">
                    <Send className="w-3.5 h-3.5" />{t('Ask', 'पूछें', lang)}
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </FadeUpCard>

        {/* Pest panel */}
        <AnimatePresence>
          {showPestPanel && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden mb-4">
              <PestScanPanel lang={lang} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeletons */}
        <AnimatePresence>
          {advisory.loading && viewMode === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 mb-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-kisan-50 dark:bg-kisan-900/20 border border-kisan-100 dark:border-kisan-800">
                <div className="w-8 h-8 bg-kisan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-kisan-800 dark:text-kisan-300">{t('KisanMitra is thinking...', 'KisanMitra सोच रहा है...', lang)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('Running specialist agents in parallel...', 'विशेषज्ञ एजेंट चल रहे हैं...', lang)}</p>
                </div>
              </div>
              {/* Live agent result cards */}
              {Object.keys(liveAgentResults).length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(liveAgentResults).map(([k, v]) => <AgentCard key={k} agentKey={k} result={v} lang={lang} />)}
                </div>
              )}
              {advisory.streamingText && (
                <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono text-xs text-gray-400 max-h-24 overflow-hidden">
                  {advisory.streamingText.slice(-300)}<span className="animate-pulse">▊</span>
                </div>
              )}
              <SkeletonCard lines={4} height="h-36" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result — dashboard view */}
        <AnimatePresence>
          {displayResult && !advisory.loading && viewMode === 'dashboard' && (
            <motion.div ref={resultRef} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-4"
            >
              {/* Health score + share row */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                {(healthScore || displayResult.farm_health_score) && (
                  <div className="flex-1 min-w-0">
                    <FarmHealthScore {...(healthScore || displayResult.farm_health_score)} />
                  </div>
                )}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Speaker button */}
                  {voice.supported && displayResult.summary && (
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (voice.speaking) { voice.stopSpeaking(); return }
                        if (!muted) voice.speak(lang === 'hi' ? (displayResult.summary_hi || displayResult.summary) : displayResult.summary)
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${voice.speaking ? 'bg-kisan-100 dark:bg-kisan-900/30 text-kisan-600 animate-pulse' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}
                    >
                      {voice.speaking ? <Volume2 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </motion.button>
                  )}
                  <ShareableCard advisory={displayResult} healthScore={healthScore || displayResult.farm_health_score} profile={profile} />
                </div>
              </div>

              <AdvisoryResult data={displayResult} lang={lang} streamingText={advisory.streamingText} agentResults={liveAgentResults} profile={profile} />

              {/* Agents called */}
              {displayResult._meta?.agents_called?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-400">{t('Agents:', 'एजेंट:', lang)}</span>
                  {displayResult._meta.agents_called.map(a => (
                    <span key={a} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 capitalize">{a.replace(/_/g,' ')}</span>
                  ))}
                  {displayResult._meta?.sub_agent_errors && Object.keys(displayResult._meta.sub_agent_errors).length > 0 && (
                    <span className="text-xs text-amber-500">(some agents had errors)</span>
                  )}
                </div>
              )}

              {/* Offline badge */}
              {showOfflineCached && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t('Showing cached advisory', 'कैश की गई सलाह दिखाई जा रही है', lang)}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
