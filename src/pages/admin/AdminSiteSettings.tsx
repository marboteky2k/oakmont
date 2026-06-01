import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Save, Globe, Plus, Trash2, Edit2, ChevronUp, ChevronDown,
  Eye, EyeOff, Check, Upload, ImageIcon, X, Search,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SITE_DEFAULTS } from '@/contexts/SiteSettingsContext'
import type {
  SiteSettings, HeroSettings, StatsBarSettings,
  TestimonialsSettings, FAQSettings, BrandSettings, SEOSettings,
  Testimonial, FAQItem, StatItem,
} from '@/types/settings'
import toast from 'react-hot-toast'

// ── Tabs ──────────────────────────────────────────────────────
type Tab = 'hero' | 'stats_bar' | 'testimonials' | 'faq' | 'brand' | 'pages' | 'legal' | 'seo'
const TABS: { id: Tab; label: string }[] = [
  { id: 'hero',         label: 'Hero'          },
  { id: 'stats_bar',    label: 'Stats Bar'     },
  { id: 'testimonials', label: 'Testimonials'  },
  { id: 'faq',          label: 'FAQ'           },
  { id: 'brand',        label: 'Brand & Contact'},
  { id: 'pages',        label: 'Pages'         },
  { id: 'legal',        label: 'Legal'         },
  { id: 'seo',          label: 'SEO'           },
]

// ── Tailwind colour options for testimonial avatars ───────────
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-600', 'bg-orange-500', 'bg-red-500',
  'bg-purple-600', 'bg-indigo-600', 'bg-teal-600', 'bg-amber-600',
  'bg-rose-500', 'bg-cyan-600', 'bg-lime-600', 'bg-pink-500',
]

// =============================================================
// Main component
// =============================================================
export default function AdminSiteSettings() {
  const { profile } = useAuth()
  const isSuperAdmin = profile?.role === 'super_admin'
  const [activeTab, setActiveTab] = useState<Tab>('hero')
  const [saving,    setSaving]    = useState(false)
  const [loaded,    setLoaded]    = useState(false)

  // Per-section local state
  const [hero,         setHero]         = useState<HeroSettings>(SITE_DEFAULTS.hero)
  const [statsBar,     setStatsBar]     = useState<StatsBarSettings>(SITE_DEFAULTS.stats_bar)
  const [testimonials, setTestimonials] = useState<TestimonialsSettings>(SITE_DEFAULTS.testimonials)
  const [faq,          setFaq]          = useState<FAQSettings>(SITE_DEFAULTS.faq)
  const [brand,        setBrand]        = useState<BrandSettings>(SITE_DEFAULTS.brand)
  const [seo,          setSeo]          = useState<SEOSettings>(SITE_DEFAULTS.seo)

  // ── Load from Supabase ──────────────────────────────────────
  const load = useCallback(async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value, type')
      .eq('section', 'landing')

    if (data) {
      const map: Record<string, string> = {}
      for (const row of data) map[row.key] = row.value

      const parse = <T,>(key: string, fallback: T): T => {
        try { return map[key] ? (JSON.parse(map[key]) as T) : fallback }
        catch { return fallback }
      }

      setHero(parse('hero', SITE_DEFAULTS.hero))
      setStatsBar(parse('stats_bar', SITE_DEFAULTS.stats_bar))
      setTestimonials(parse('testimonials', SITE_DEFAULTS.testimonials))
      setFaq(parse('faq', SITE_DEFAULTS.faq))
      setBrand(parse('brand', SITE_DEFAULTS.brand))
      setSeo(parse('seo', SITE_DEFAULTS.seo))
    }
    setLoaded(true)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Save a single section ───────────────────────────────────
  const save = async (key: keyof SiteSettings, value: object) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert(
          { key, value: JSON.stringify(value), type: 'json', section: 'landing', updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
      if (error) throw error
      toast.success('Section saved!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#1E40AF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Site Editor</h1>
          <p className="text-slate-500 text-sm mt-1">
            Edit landing page content. Changes reflect live for all visitors after saving.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Globe className="w-4 h-4 text-[#3B82F6]" />
          <span>Landing page · Section-by-section saves</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === t.id
                ? 'bg-white text-[#1E40AF] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── HERO TAB ─────────────────────────────────────────── */}
      {activeTab === 'hero' && (
        <HeroTab hero={hero} setHero={setHero} saving={saving}
          onSave={() => save('hero', hero)} />
      )}

      {/* ── STATS BAR TAB ────────────────────────────────────── */}
      {activeTab === 'stats_bar' && (
        <StatsBarTab statsBar={statsBar} setStatsBar={setStatsBar} saving={saving}
          onSave={() => save('stats_bar', statsBar)} />
      )}

      {/* ── TESTIMONIALS TAB ─────────────────────────────────── */}
      {activeTab === 'testimonials' && (
        <TestimonialsTab testimonials={testimonials} setTestimonials={setTestimonials} saving={saving}
          onSave={() => save('testimonials', testimonials)} />
      )}

      {/* ── FAQ TAB ──────────────────────────────────────────── */}
      {activeTab === 'faq' && (
        <FAQTab faq={faq} setFaq={setFaq} saving={saving}
          onSave={() => save('faq', faq)} />
      )}

      {/* ── BRAND TAB ────────────────────────────────────────── */}
      {activeTab === 'brand' && (
        <BrandTab brand={brand} setBrand={setBrand} saving={saving}
          onSave={() => save('brand', brand)} isSuperAdmin={isSuperAdmin} />
      )}

      {/* ── PAGES TAB ────────────────────────────────────────── */}
      {activeTab === 'pages' && (
        <PagesTab saving={saving} />
      )}

      {/* ── LEGAL TAB ────────────────────────────────────────── */}
      {activeTab === 'legal' && (
        <LegalTab saving={saving} />
      )}

      {/* ── SEO TAB ──────────────────────────────────────────── */}
      {activeTab === 'seo' && (
        <SEOTab seo={seo} setSeo={setSeo} saving={saving}
          onSave={() => save('seo', seo)} />
      )}
    </div>
  )
}

// =============================================================
// HERO TAB
// =============================================================
function HeroTab({ hero, setHero, saving, onSave }: {
  hero: HeroSettings
  setHero: (h: HeroSettings) => void
  saving: boolean
  onSave: () => void
}) {
  const set = (patch: Partial<HeroSettings>) => setHero({ ...hero, ...patch })

  const setStat = (i: number, patch: Partial<StatItem>) => {
    const stats = hero.stats.map((s, idx) => idx === i ? { ...s, ...patch } : s)
    set({ stats })
  }

  const setTrust = (i: number, val: string) => {
    const trust_points = hero.trust_points.map((p, idx) => idx === i ? val : p)
    set({ trust_points })
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Headline & Copy</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Main Headline</label>
            <textarea
              value={hero.headline}
              onChange={e => set({ headline: e.target.value })}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">First sentence shows in white; second sentence appears in the gradient highlight.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Sub-headline</label>
            <textarea
              value={hero.subheadline}
              onChange={e => set({ subheadline: e.target.value })}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Primary CTA button text" value={hero.cta_primary}
              onChange={e => set({ cta_primary: e.target.value })} />
            <Input label="Secondary CTA button text" value={hero.cta_secondary}
              onChange={e => set({ cta_secondary: e.target.value })} />
          </div>
          <Input label="Badge / live text" value={hero.badge_text}
            onChange={e => set({ badge_text: e.target.value })} />
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Trust Points (3 bullet texts)</h3>
        <div className="grid grid-cols-3 gap-3">
          {hero.trust_points.map((pt, i) => (
            <Input key={i} label={`Point ${i + 1}`} value={pt}
              onChange={e => setTrust(i, e.target.value)} />
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Hero Stats (bottom counter bar)</h3>
        <div className="space-y-3">
          {hero.stats.map((s, i) => (
            <div key={i} className="grid grid-cols-4 gap-3 items-end">
              <Input label={i === 0 ? 'Label' : ''} value={s.label}
                onChange={e => setStat(i, { label: e.target.value })} />
              <Input label={i === 0 ? 'Value' : ''} type="number" value={String(s.value)}
                onChange={e => setStat(i, { value: Number(e.target.value) })} />
              <Input label={i === 0 ? 'Prefix' : ''} value={s.prefix} placeholder="$"
                onChange={e => setStat(i, { prefix: e.target.value })} />
              <Input label={i === 0 ? 'Suffix' : ''} value={s.suffix} placeholder="M+"
                onChange={e => setStat(i, { suffix: e.target.value })} />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} loading={saving}>
          <Save className="w-4 h-4" /> Save Hero
        </Button>
      </div>
    </div>
  )
}

// =============================================================
// STATS BAR TAB
// =============================================================
function StatsBarTab({ statsBar, setStatsBar, saving, onSave }: {
  statsBar: StatsBarSettings
  setStatsBar: (s: StatsBarSettings) => void
  saving: boolean
  onSave: () => void
}) {
  const set = (patch: Partial<StatsBarSettings>) => setStatsBar({ ...statsBar, ...patch })

  const setStat = (i: number, patch: Partial<StatItem>) => {
    const stats = statsBar.stats.map((s, idx) => idx === i ? { ...s, ...patch } : s)
    set({ stats })
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Section Headlines</h3>
        <div className="space-y-4">
          <Input label="Headline" value={statsBar.headline}
            onChange={e => set({ headline: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Sub-headline</label>
            <textarea
              value={statsBar.subheadline}
              onChange={e => set({ subheadline: e.target.value })}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] resize-none"
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Counter Stats (4 animated counters)</h3>
        <div className="space-y-3">
          {statsBar.stats.map((s, i) => (
            <div key={i} className="grid grid-cols-4 gap-3 items-end">
              <Input label={i === 0 ? 'Label' : ''} value={s.label}
                onChange={e => setStat(i, { label: e.target.value })} />
              <Input label={i === 0 ? 'Value' : ''} type="number" value={String(s.value)}
                onChange={e => setStat(i, { value: Number(e.target.value) })} />
              <Input label={i === 0 ? 'Prefix' : ''} value={s.prefix} placeholder="$"
                onChange={e => setStat(i, { prefix: e.target.value })} />
              <Input label={i === 0 ? 'Suffix' : ''} value={s.suffix} placeholder="M+"
                onChange={e => setStat(i, { suffix: e.target.value })} />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} loading={saving}>
          <Save className="w-4 h-4" /> Save Stats Bar
        </Button>
      </div>
    </div>
  )
}

// =============================================================
// TESTIMONIALS TAB
// =============================================================
const EMPTY_TESTIMONIAL: Testimonial = {
  name: '', country: '', flag: '🌍', initials: '', color: 'bg-blue-500', stars: 5, quote: '',
}

function TestimonialsTab({ testimonials, setTestimonials, saving, onSave }: {
  testimonials: TestimonialsSettings
  setTestimonials: (t: TestimonialsSettings) => void
  saving: boolean
  onSave: () => void
}) {
  const [editIdx,   setEditIdx]   = useState<number | null>(null)
  const [editForm,  setEditForm]  = useState<Testimonial>(EMPTY_TESTIMONIAL)
  const [isNew,     setIsNew]     = useState(false)
  const [showModal, setShowModal] = useState(false)

  const items = testimonials.items

  const openAdd = () => {
    setEditForm(EMPTY_TESTIMONIAL)
    setIsNew(true)
    setEditIdx(null)
    setShowModal(true)
  }

  const openEdit = (i: number) => {
    setEditForm({ ...items[i] })
    setIsNew(false)
    setEditIdx(i)
    setShowModal(true)
  }

  const commitEdit = () => {
    if (!editForm.name.trim() || !editForm.quote.trim()) {
      toast.error('Name and quote are required')
      return
    }
    let newItems: Testimonial[]
    if (isNew) {
      newItems = [...items, editForm]
    } else {
      newItems = items.map((t, idx) => idx === editIdx ? editForm : t)
    }
    setTestimonials({ items: newItems })
    setShowModal(false)
  }

  const remove = (i: number) => {
    setTestimonials({ items: items.filter((_, idx) => idx !== i) })
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const arr = [...items]
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp
    setTestimonials({ items: arr })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{items.length} testimonials · drag to reorder</p>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Testimonial
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((t, i) => (
          <Card key={i}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5`}>
                {t.initials || t.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-900 text-sm">{t.name}</span>
                  <span className="text-slate-400 text-xs">{t.flag} {t.country}</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">"{t.quote}"</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => openEdit(i)}
                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(i)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} loading={saving}>
          <Save className="w-4 h-4" /> Save Testimonials
        </Button>
      </div>

      {/* Edit / Add modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={isNew ? 'Add Testimonial' : 'Edit Testimonial'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name" value={editForm.name}
              onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            <Input label="Country" value={editForm.country}
              onChange={e => setEditForm({ ...editForm, country: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Flag emoji" value={editForm.flag} placeholder="🇺🇸"
              onChange={e => setEditForm({ ...editForm, flag: e.target.value })} />
            <Input label="Initials" value={editForm.initials} placeholder="SM"
              onChange={e => setEditForm({ ...editForm, initials: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Avatar colour</label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setEditForm({ ...editForm, color: c })}
                  className={`w-8 h-8 rounded-lg ${c} flex items-center justify-center transition-transform ${editForm.color === c ? 'ring-2 ring-offset-1 ring-slate-900 scale-110' : 'hover:scale-105'}`}
                >
                  {editForm.color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Stars (1–5)</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setEditForm({ ...editForm, stars: n })}
                  className={`w-8 h-8 rounded-lg text-lg transition-colors ${n <= editForm.stars ? 'text-yellow-400' : 'text-slate-200'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Quote</label>
            <textarea
              value={editForm.quote}
              onChange={e => setEditForm({ ...editForm, quote: e.target.value })}
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] resize-none"
              placeholder="Write the testimonial quote..."
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={commitEdit} className="flex-1">{isNew ? 'Add' : 'Update'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// =============================================================
// FAQ TAB
// =============================================================
const EMPTY_FAQ: FAQItem = { q: '', a: '' }

function FAQTab({ faq, setFaq, saving, onSave }: {
  faq: FAQSettings
  setFaq: (f: FAQSettings) => void
  saving: boolean
  onSave: () => void
}) {
  const [editIdx,   setEditIdx]   = useState<number | null>(null)
  const [editForm,  setEditForm]  = useState<FAQItem>(EMPTY_FAQ)
  const [isNew,     setIsNew]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [expanded,  setExpanded]  = useState<number | null>(null)

  const items = faq.items

  const openAdd = () => {
    setEditForm(EMPTY_FAQ)
    setIsNew(true)
    setEditIdx(null)
    setShowModal(true)
  }

  const openEdit = (i: number) => {
    setEditForm({ ...items[i] })
    setIsNew(false)
    setEditIdx(i)
    setShowModal(true)
  }

  const commit = () => {
    if (!editForm.q.trim() || !editForm.a.trim()) {
      toast.error('Question and answer are required')
      return
    }
    let newItems: FAQItem[]
    if (isNew) {
      newItems = [...items, editForm]
    } else {
      newItems = items.map((f, idx) => idx === editIdx ? editForm : f)
    }
    setFaq({ ...faq, items: newItems })
    setShowModal(false)
  }

  const remove = (i: number) => {
    setFaq({ ...faq, items: items.filter((_, idx) => idx !== i) })
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const arr = [...items]
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp
    setFaq({ ...faq, items: arr })
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Section Headlines</h3>
        <div className="space-y-3">
          <Input label="Headline" value={faq.headline}
            onChange={e => setFaq({ ...faq, headline: e.target.value })} />
          <Input label="Sub-headline" value={faq.subheadline}
            onChange={e => setFaq({ ...faq, subheadline: e.target.value })} />
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{items.length} FAQ items</p>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add FAQ Item
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <Card key={i}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1E40AF] text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-medium text-slate-900 text-sm flex-1">{item.q}</span>
                  {expanded === i
                    ? <EyeOff className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    : <Eye className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  }
                </button>
                {expanded === i && (
                  <p className="text-slate-500 text-xs mt-2 ml-8 leading-relaxed">{item.a}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => openEdit(i)} className="p-1 rounded text-blue-600 hover:bg-blue-50">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(i)} className="p-1 rounded text-red-500 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} loading={saving}>
          <Save className="w-4 h-4" /> Save FAQ
        </Button>
      </div>

      {/* Edit / Add modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={isNew ? 'Add FAQ Item' : 'Edit FAQ Item'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Question</label>
            <textarea
              value={editForm.q}
              onChange={e => setEditForm({ ...editForm, q: e.target.value })}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] resize-none"
              placeholder="How do I...?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Answer</label>
            <textarea
              value={editForm.a}
              onChange={e => setEditForm({ ...editForm, a: e.target.value })}
              rows={5}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] resize-none"
              placeholder="Detailed answer..."
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={commit} className="flex-1">{isNew ? 'Add' : 'Update'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// =============================================================
// BRAND & CONTACT TAB
// =============================================================
function BrandTab({ brand, setBrand, saving, onSave, isSuperAdmin }: {
  brand: BrandSettings
  setBrand: (b: BrandSettings) => void
  saving: boolean
  onSave: () => void
  isSuperAdmin: boolean
}) {
  const set = (patch: Partial<BrandSettings>) => setBrand({ ...brand, ...patch })
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2 MB'); return }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    if (!['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext)) {
      toast.error('Supported formats: PNG, JPG, SVG, WebP')
      return
    }
    setUploadingLogo(true)
    try {
      const path = `logos/company-logo.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      // Append cache-buster so the browser picks up the new file immediately
      const url = `${data.publicUrl}?t=${Date.now()}`
      set({ logo_url: url })
      toast.success('Logo uploaded — click Save to apply.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingLogo(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo upload — super admin only */}
      {isSuperAdmin && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-1">Company Logo</h3>
          <p className="text-xs text-slate-400 mb-4">Used in the sidebar, nav bar, emails, and favicon. PNG or SVG recommended. Max 2 MB.</p>
          <div className="flex items-start gap-6">
            {/* Preview */}
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 flex-shrink-0 overflow-hidden">
              {brand.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt="Logo preview"
                  className="w-full h-full object-contain p-2"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-300" />
              )}
            </div>
            {/* Controls */}
            <div className="flex-1 space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                loading={uploadingLogo}
                className="gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploadingLogo ? 'Uploading…' : 'Upload New Logo'}
              </Button>
              {brand.logo_url && brand.logo_url !== '/logo.png' && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500 font-mono truncate max-w-xs">{brand.logo_url.split('?')[0].split('/').pop()}</p>
                  <button
                    onClick={() => set({ logo_url: '/logo.png' })}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Reset to default"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-400">
                After uploading, click <strong>Save Brand & Contact</strong> to apply the new logo across the platform.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Company Identity</h3>
        <div className="space-y-4">
          <Input label="Company Name" value={brand.company_name}
            onChange={e => set({ company_name: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tagline / Footer description</label>
            <textarea
              value={brand.tagline}
              onChange={e => set({ tagline: e.target.value })}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] resize-none"
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Brand Colours</h3>
        <div className="grid grid-cols-2 gap-6">
          <ColorField
            label="Primary colour"
            description="Buttons, active states, sidebar gradient"
            value={brand.primary_color}
            onChange={v => set({ primary_color: v })}
          />
          <ColorField
            label="Accent colour"
            description="Links, highlights, icons"
            value={brand.accent_color}
            onChange={v => set({ accent_color: v })}
          />
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Contact & Social</h3>
        <div className="space-y-4">
          <Input label="Support Email" type="email" value={brand.support_email} placeholder="support@example.com"
            onChange={e => set({ support_email: e.target.value })} />
          <Input label="Telegram URL" value={brand.telegram_url} placeholder="https://t.me/yourchannel"
            onChange={e => set({ telegram_url: e.target.value })} />
          <Input label="WhatsApp URL" value={brand.whatsapp_url} placeholder="https://wa.me/1234567890"
            onChange={e => set({ whatsapp_url: e.target.value })} />
        </div>
      </Card>

      {/* Live preview */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Preview</h3>
        <div className="rounded-xl overflow-hidden border border-slate-200">
          {/* Mini footer preview */}
          <div className="p-5 flex items-start gap-4" style={{ backgroundColor: '#0f172a' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: brand.primary_color }}>
              <span className="text-white font-bold text-xs">OR</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">{brand.company_name}</p>
              <p className="text-slate-400 text-xs mt-1 max-w-xs leading-relaxed">{brand.tagline}</p>
              <div className="flex items-center gap-2 mt-3">
                {brand.support_email && (
                  <span className="text-xs px-2 py-1 rounded-full text-slate-300" style={{ backgroundColor: '#1e293b' }}>
                    ✉ {brand.support_email}
                  </span>
                )}
                {brand.telegram_url && (
                  <span className="text-xs px-2 py-1 rounded-full text-slate-300" style={{ backgroundColor: '#1e293b' }}>
                    ✈ Telegram
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-slate-700" style={{ backgroundColor: '#0f172a' }}>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: brand.primary_color }} />
              <span className="text-xs text-slate-400">Primary</span>
              <span className="text-xs text-slate-500 font-mono ml-1">{brand.primary_color}</span>
              <div className="w-4 h-4 rounded ml-3" style={{ backgroundColor: brand.accent_color }} />
              <span className="text-xs text-slate-400">Accent</span>
              <span className="text-xs text-slate-500 font-mono ml-1">{brand.accent_color}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} loading={saving}>
          <Save className="w-4 h-4" /> Save Brand & Contact
        </Button>
      </div>
    </div>
  )
}

// =============================================================
// PAGES TAB — Blog, Careers, About, Contact
// =============================================================
type PageKey = 'about' | 'blog_header' | 'careers_header' | 'contact_info' | 'trading_info'

interface PageContent {
  key: PageKey
  title: string
  description: string
  [field: string]: string
}

function PagesTab({ saving }: { saving: boolean }) {
  const [activeSection, setActiveSection] = useState<PageKey>('about')
  const [savingSection, setSavingSection] = useState(false)
  const [content, setContent] = useState<Record<string, Record<string, string>>>({})

  const sections: { id: PageKey; label: string; description: string; fields: { key: string; label: string; type?: string; rows?: number }[] }[] = [
    {
      id: 'about',
      label: 'About Us',
      description: 'Company story, mission, and values shown on the About section of the homepage.',
      fields: [
        { key: 'headline', label: 'Section Headline' },
        { key: 'subheadline', label: 'Subheadline', rows: 2 },
        { key: 'mission', label: 'Mission Statement', rows: 3 },
        { key: 'founded', label: 'Founded Year', type: 'text' },
        { key: 'hq', label: 'Headquarters / Country' },
        { key: 'team_size', label: 'Team Size (e.g. "50+ professionals")' },
        { key: 'aum', label: 'Assets Under Management (e.g. "$50M+")' },
      ],
    },
    {
      id: 'blog_header',
      label: 'Blog',
      description: 'Header content for the /blog page.',
      fields: [
        { key: 'headline', label: 'Page Headline' },
        { key: 'subheadline', label: 'Sub-headline', rows: 2 },
        { key: 'newsletter_cta', label: 'Newsletter CTA text' },
      ],
    },
    {
      id: 'careers_header',
      label: 'Careers',
      description: 'Header content for the /careers page.',
      fields: [
        { key: 'headline', label: 'Page Headline' },
        { key: 'subheadline', label: 'Sub-headline', rows: 2 },
        { key: 'perks', label: 'Perks (one per line, e.g. Remote-first, Equity)', rows: 4 },
        { key: 'email', label: 'Careers email', type: 'email' },
      ],
    },
    {
      id: 'contact_info',
      label: 'Contact Us',
      description: 'Contact details displayed on the /contact page.',
      fields: [
        { key: 'email', label: 'Main contact email', type: 'email' },
        { key: 'phone', label: 'Phone / WhatsApp' },
        { key: 'address', label: 'Office address', rows: 2 },
        { key: 'hours', label: 'Support hours (e.g. Mon–Fri, 9am–6pm GMT)' },
        { key: 'response_time', label: 'Typical response time (e.g. Within 24 hours)' },
      ],
    },
    {
      id: 'trading_info',
      label: 'Trading Page',
      description: 'Content for the top traders and copy trading sections.',
      fields: [
        { key: 'headline', label: 'Section headline' },
        { key: 'subheadline', label: 'Sub-headline', rows: 2 },
        { key: 'disclaimer', label: 'Risk disclaimer text', rows: 3 },
        { key: 'min_copy', label: 'Minimum copy amount (e.g. $50)' },
        { key: 'performance_fee', label: 'Performance fee (e.g. 20%)' },
      ],
    },
  ]

  const loadSection = async (key: PageKey) => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', `page_${key}`)
      .single()
    if (data?.value) {
      try {
        setContent(prev => ({ ...prev, [key]: JSON.parse(data.value) }))
      } catch {}
    }
  }

  useEffect(() => { sections.forEach(s => loadSection(s.id)) }, [])

  const get = (key: string) => content[activeSection]?.[key] ?? ''
  const set = (field: string, val: string) => {
    setContent(prev => ({
      ...prev,
      [activeSection]: { ...(prev[activeSection] ?? {}), [field]: val }
    }))
  }

  const saveSection = async () => {
    setSavingSection(true)
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert(
          { key: `page_${activeSection}`, value: JSON.stringify(content[activeSection] ?? {}), type: 'json', section: 'pages', updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
      if (error) throw error
      toast.success('Page content saved!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSavingSection(false)
    }
  }

  const active = sections.find(s => s.id === activeSection)!

  return (
    <div className="space-y-5">
      {/* Section selector */}
      <div className="flex flex-wrap gap-2">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeSection === s.id
                ? 'bg-[#1E40AF] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-1">{active.label}</h3>
        <p className="text-xs text-slate-400 mb-5">{active.description}</p>

        <div className="space-y-4">
          {active.fields.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
              {f.rows ? (
                <textarea
                  value={get(f.key)}
                  onChange={e => set(f.key, e.target.value)}
                  rows={f.rows}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] resize-none"
                />
              ) : (
                <input
                  type={f.type ?? 'text'}
                  value={get(f.key)}
                  onChange={e => set(f.key, e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF]"
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSection} loading={savingSection}>
          <Save className="w-4 h-4" /> Save {active.label}
        </Button>
      </div>
    </div>
  )
}

// =============================================================
// LEGAL TAB — Privacy Policy & Terms of Service
// =============================================================
type LegalDoc = 'privacy_policy' | 'terms_of_service' | 'cookie_policy'

function LegalTab({ saving }: { saving: boolean }) {
  const [activeDoc, setActiveDoc] = useState<LegalDoc>('privacy_policy')
  const [docs, setDocs] = useState<Record<LegalDoc, string>>({
    privacy_policy: '',
    terms_of_service: '',
    cookie_policy: '',
  })
  const [savingDoc, setSavingDoc] = useState(false)

  const legalDocs: { id: LegalDoc; label: string; description: string }[] = [
    { id: 'privacy_policy',   label: 'Privacy Policy',    description: 'Displayed at /privacy' },
    { id: 'terms_of_service', label: 'Terms of Service',  description: 'Displayed at /terms' },
    { id: 'cookie_policy',    label: 'Cookie Policy',     description: 'Displayed at /cookie-policy' },
  ]

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['legal_privacy_policy', 'legal_terms_of_service', 'legal_cookie_policy'])

      if (data) {
        const updates: Partial<Record<LegalDoc, string>> = {}
        for (const row of data) {
          const docKey = row.key.replace('legal_', '') as LegalDoc
          updates[docKey] = row.value
        }
        setDocs(prev => ({ ...prev, ...updates }))
      }
    }
    load()
  }, [])

  const saveDoc = async () => {
    setSavingDoc(true)
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert(
          { key: `legal_${activeDoc}`, value: docs[activeDoc], type: 'text', section: 'legal', updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
      if (error) throw error
      toast.success('Document saved!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSavingDoc(false)
    }
  }

  const active = legalDocs.find(d => d.id === activeDoc)!

  return (
    <div className="space-y-5">
      {/* Doc selector */}
      <div className="flex gap-2">
        {legalDocs.map(d => (
          <button
            key={d.id}
            onClick={() => setActiveDoc(d.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeDoc === d.id
                ? 'bg-[#1E40AF] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{active.label}</h3>
            <p className="text-xs text-slate-400">{active.description} — supports Markdown formatting</p>
          </div>
          <span className="text-xs text-slate-400">{docs[activeDoc].length} chars</span>
        </div>

        <div className="mb-3 flex gap-2 flex-wrap text-xs">
          {['# Heading', '## Section', '**Bold**', '*Italic*', '- List item', '[Link](url)'].map(fmt => (
            <button
              key={fmt}
              onClick={() => setDocs(prev => ({ ...prev, [activeDoc]: prev[activeDoc] + '\n' + fmt }))}
              className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-mono hover:bg-slate-200 transition-colors"
            >
              {fmt}
            </button>
          ))}
        </div>

        <textarea
          value={docs[activeDoc]}
          onChange={e => setDocs(prev => ({ ...prev, [activeDoc]: e.target.value }))}
          rows={24}
          placeholder={`Enter the full ${active.label} content here in plain text or Markdown format.\n\nExample:\n# Privacy Policy\n\nLast updated: January 1, 2026\n\n## 1. Information We Collect\n\nWe collect information you provide directly...`}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] resize-y"
        />

        <p className="text-xs text-slate-400 mt-2">
          ℹ️ Content is saved to the database and rendered on the respective legal page.
          The existing hardcoded content is shown as fallback if not overridden.
        </p>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveDoc} loading={savingDoc}>
          <Save className="w-4 h-4" /> Save {active.label}
        </Button>
      </div>
    </div>
  )
}

// =============================================================
// Shared: colour field with picker
// =============================================================
// =============================================================
// SEO TAB
// =============================================================
function SEOTab({ seo, setSeo, saving, onSave }: {
  seo: SEOSettings
  setSeo: (s: SEOSettings) => void
  saving: boolean
  onSave: () => void
}) {
  const set = (patch: Partial<SEOSettings>) => setSeo({ ...seo, ...patch })

  const field = (
    label: string,
    key: keyof SEOSettings,
    opts?: { placeholder?: string; hint?: string; rows?: number; mono?: boolean }
  ) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {opts?.hint && <p className="text-xs text-slate-400 mb-2">{opts.hint}</p>}
      {opts?.rows ? (
        <textarea
          value={(seo[key] ?? '') as string}
          onChange={e => set({ [key]: e.target.value } as Partial<SEOSettings>)}
          rows={opts.rows}
          placeholder={opts?.placeholder}
          className={`w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] resize-none ${opts?.mono ? 'font-mono' : ''}`}
        />
      ) : (
        <input
          type="text"
          value={(seo[key] ?? '') as string}
          onChange={e => set({ [key]: e.target.value } as Partial<SEOSettings>)}
          placeholder={opts?.placeholder}
          className={`w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] ${opts?.mono ? 'font-mono' : ''}`}
        />
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Section: Basic Meta */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Search className="w-4 h-4 text-[#3B82F6]" />
          <h3 className="font-semibold text-slate-900">Search Engine Basics</h3>
        </div>
        <div className="space-y-4">
          {field('Site Title', 'site_title', { placeholder: 'Oakmont Ridge Capital', hint: 'The name shown in browser tabs and search results.' })}
          {field('Title Separator', 'title_separator', { placeholder: ' | ', hint: 'Used between page name and site title, e.g. "Dashboard | Oakmont Ridge Capital".' })}
          {field('Meta Description', 'meta_description', {
            rows: 3,
            placeholder: 'A concise description of the site (150–160 characters) shown in search snippets.',
            hint: 'Recommended: 150–160 characters.',
          })}
          {field('Meta Keywords', 'meta_keywords', { placeholder: 'forex trading, copy trading, crypto investment', hint: 'Comma-separated. Minimal SEO impact but useful for categorisation.' })}
          {field('Robots Directive', 'robots', { placeholder: 'index, follow', hint: '"index, follow" is standard. Use "noindex" to hide the site from search engines.' })}
        </div>
      </Card>

      {/* Section: Open Graph / Social */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Globe className="w-4 h-4 text-[#3B82F6]" />
          <h3 className="font-semibold text-slate-900">Social Sharing (Open Graph)</h3>
          <p className="text-xs text-slate-400 ml-1">— Controls how the site looks when shared on Facebook, LinkedIn, WhatsApp, etc.</p>
        </div>
        <div className="space-y-4">
          {field('OG Title', 'og_title', { placeholder: 'Oakmont Ridge Capital — Copy Expert Traders', hint: 'Headline shown when the link is shared. Defaults to Site Title if empty.' })}
          {field('OG Description', 'og_description', { rows: 2, placeholder: 'Join thousands of investors copying the world\'s best traders.' })}
          {field('OG Image URL', 'og_image', { placeholder: 'https://oakmontridgecapital.com/og-image.png', hint: 'Recommended size: 1200×630 px. Enter an absolute URL.' })}
          {seo.og_image && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Preview:</p>
              <img
                src={seo.og_image}
                alt="OG Preview"
                className="w-full max-w-sm h-36 object-cover rounded-xl border border-slate-200"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Section: Twitter */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-5">Twitter / X Card</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Card Type</label>
            <select
              value={seo.twitter_card}
              onChange={e => set({ twitter_card: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF]"
            >
              <option value="summary_large_image">Summary with Large Image (recommended)</option>
              <option value="summary">Summary (small image)</option>
            </select>
          </div>
          {field('Twitter Handle', 'twitter_handle', { placeholder: '@oakmontridge', hint: 'Your @handle on Twitter/X.' })}
        </div>
      </Card>

      {/* Section: Analytics */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-1">Analytics & Tracking</h3>
        <p className="text-xs text-slate-400 mb-5">Scripts are injected once per session. Leave blank to disable.</p>
        <div className="space-y-4">
          {field('Google Analytics ID', 'google_analytics_id', { placeholder: 'G-XXXXXXXXXX', mono: true, hint: 'Found in your Google Analytics 4 property settings.' })}
          {field('Facebook Pixel ID', 'facebook_pixel_id', { placeholder: '123456789012345', mono: true, hint: 'Found in Facebook Events Manager → Pixel settings.' })}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} loading={saving}>
          <Save className="w-4 h-4" /> Save SEO Settings
        </Button>
      </div>
    </div>
  )
}

// =============================================================
// Shared: colour field with picker
// =============================================================
function ColorField({ label, description, value, onChange }: {
  label: string
  description: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <p className="text-xs text-slate-400 mb-2">{description}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF]"
          placeholder="#1E40AF"
        />
        <div
          className="w-10 h-10 rounded-lg border border-slate-200 flex-shrink-0"
          style={{ backgroundColor: value }}
        />
      </div>
    </div>
  )
}
