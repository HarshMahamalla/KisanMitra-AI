import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sprout, MapPin, Ruler, Layers, Droplets, ArrowRight, Check } from 'lucide-react'
import { useProfile, useLang } from '../context/AppContext'
import { saveProfile } from '../utils/api'
import { t } from '../utils/helpers'
import toast from 'react-hot-toast'

const CROPS = ['wheat','rice','maize','cotton','soybean','tomato','potato','onion','mustard','chickpea','sugarcane','groundnut']
const SOIL_TYPES = ['alluvial','black_cotton','red_laterite','loamy','sandy','clay']
const SOIL_LABELS = {alluvial:'Alluvial',black_cotton:'Black Cotton',red_laterite:'Red Laterite',loamy:'Loamy',sandy:'Sandy',clay:'Clay'}
const IRRIGATION = ['canal','borewell','drip','rainfed','river','sprinkler','tank']
const STAGES = ['seedling','vegetative','flowering','grain_fill','harvest_ready']
const STAGE_LABELS = {seedling:'Seedling (0–30 days)',vegetative:'Vegetative (31–60 days)',flowering:'Flowering (61–90 days)',grain_fill:'Grain Fill / Fruiting',harvest_ready:'Harvest Ready'}

const STAGE_LABELS_HI = {
  seedling:'अंकुरण (0-30 दिन)', vegetative:'बढ़वार (31-60 दिन)',
  flowering:'फूल आना (61-90 दिन)', grain_fill:'दाना भरना/फल लगना', harvest_ready:'कटाई के लिए तैयार'
}

export default function FarmerProfile() {
  const { saveProfile: saveCtx } = useProfile()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', location: '', land_size: '1', soil_type: 'loamy',
    crop: 'wheat', growth_stage: 'vegetative', irrigation_source: 'canal', language: 'Hindi'
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.location.trim()) {
      toast.error(t('Name and location are required', 'नाम और जगह जरूरी है', lang))
      return
    }
    setSaving(true)
    try {
      await saveProfile(form)
      saveCtx(form)
      toast.success(t('Profile saved! Welcome to KisanMitra AI 🌱', 'प्रोफ़ाइल सहेजा! KisanMitra AI में स्वागत है 🌱', lang))
      setTimeout(() => navigate('/'), 800)
    } catch {
      toast.error(t('Could not connect to server. Profile saved locally.', 'सर्वर से जुड़ नहीं पाए। प्रोफ़ाइल स्थानीय रूप से सहेजा।', lang))
      saveCtx(form)
      setTimeout(() => navigate('/'), 800)
    } finally {
      setSaving(false)
    }
  }

  const steps = [
    {
      title: t('Tell us about yourself', 'अपने बारे में बताएं', lang),
      subtitle: t("We'll personalize advice for your farm", 'हम आपके खेत के लिए सलाह तैयार करेंगे', lang),
      fields: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("Your Name", "आपका नाम", lang)}
            </label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder={t("e.g. Ramswarup Yadav", "जैसे: रामस्वरूप यादव", lang)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-kisan-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <MapPin className="inline w-3.5 h-3.5 mr-1" />
              {t("District / Region", "जिला / क्षेत्र", lang)}
            </label>
            <input value={form.location} onChange={e => set('location', e.target.value)}
              placeholder={t("e.g. Ludhiana, Punjab", "जैसे: लखनऊ, उत्तर प्रदेश", lang)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-kisan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Ruler className="inline w-3.5 h-3.5 mr-1" />
              {t("Land Size (acres)", "जमीन (एकड़ में)", lang)}
            </label>
            <input type="number" min="0.5" max="100" step="0.5"
              value={form.land_size} onChange={e => set('land_size', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-kisan-500"
            />
          </div>
        </div>
      ),
    },
    {
      title: t('About your farm', 'आपके खेत के बारे में', lang),
      subtitle: t('Soil type and irrigation source', 'मिट्टी का प्रकार और पानी का स्रोत', lang),
      fields: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Layers className="inline w-3.5 h-3.5 mr-1" />
              {t('Soil Type', 'मिट्टी का प्रकार', lang)}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SOIL_TYPES.map(s => (
                <button key={s} onClick={() => set('soil_type', s)}
                  className={`px-3 py-2 rounded-xl text-sm text-left border transition-all ${
                    form.soil_type === s
                      ? 'bg-kisan-600 text-white border-kisan-600 font-medium'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-kisan-400'
                  }`}
                >
                  {SOIL_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Droplets className="inline w-3.5 h-3.5 mr-1" />
              {t('Irrigation Source', 'पानी का स्रोत', lang)}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {IRRIGATION.map(s => (
                <button key={s} onClick={() => set('irrigation_source', s)}
                  className={`px-2 py-2 rounded-xl text-xs capitalize border transition-all ${
                    form.irrigation_source === s
                      ? 'bg-kisan-600 text-white border-kisan-600 font-medium'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-kisan-400'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t('Your current crop', 'आपकी फसल', lang),
      subtitle: t('Select crop and its growth stage', 'फसल और विकास अवस्था चुनें', lang),
      fields: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('Crop', 'फसल', lang)}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CROPS.map(c => (
                <button key={c} onClick={() => set('crop', c)}
                  className={`px-2 py-2 rounded-xl text-sm capitalize border transition-all ${
                    form.crop === c
                      ? 'bg-kisan-600 text-white border-kisan-600 font-medium'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-kisan-400'
                  }`}
                >
                  {c.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('Growth Stage', 'विकास अवस्था', lang)}
            </label>
            <div className="space-y-2">
              {STAGES.map(s => (
                <button key={s} onClick={() => set('growth_stage', s)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm text-left transition-all ${
                    form.growth_stage === s
                      ? 'bg-kisan-600 text-white border-kisan-600'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-kisan-400'
                  }`}
                >
                  <span>{lang === 'hi' ? STAGE_LABELS_HI[s] : STAGE_LABELS[s]}</span>
                  {form.growth_stage === s && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 flex items-center justify-center bg-gradient-to-br from-kisan-50 via-white to-earth-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Header icon */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-16 h-16 bg-kisan-600 rounded-2xl shadow-lg mb-3"
          >
            <Sprout className="w-9 h-9 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KisanMitra AI</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-devanagari">किसान मित्र — आपका स्मार्ट खेती सलाहकार</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
              <motion.div
                className="h-full bg-kisan-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: i <= step ? '100%' : '0%' }}
                transition={{ duration: 0.4 }}
              />
            </div>
          ))}
        </div>

        {/* Step card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{current.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{current.subtitle}</p>
          {current.fields}
        </motion.div>

        {/* Navigation */}
        <div className="flex gap-3 mt-4">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t('Back', 'वापस', lang)}
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={isLast ? handleSubmit : () => setStep(s => s + 1)}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-kisan-600 hover:bg-kisan-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-60"
          >
            {saving ? (
              <span className="flex items-center gap-2"><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" /></span>
            ) : isLast ? (
              <><Check className="w-4 h-4" />{t('Save & Start', 'सहेजें और शुरू करें', lang)}</>
            ) : (
              <>{t('Next', 'आगे', lang)}<ArrowRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          {t('Step', 'चरण', lang)} {step + 1} {t('of', 'का', lang)} {steps.length}
        </p>
      </motion.div>
    </div>
  )
}
