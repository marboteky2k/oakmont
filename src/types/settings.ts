// =============================================================
// Site Settings — TypeScript interfaces
// Matches JSON stored in site_settings table (section='landing')
// =============================================================

export interface HeroStat {
  label: string
  value: number
  suffix: string
  prefix: string
}

export interface HeroSettings {
  headline: string
  subheadline: string
  cta_primary: string
  cta_secondary: string
  badge_text: string
  trust_points: string[]
  stats: HeroStat[]
}

export interface StatItem {
  label: string
  value: number
  suffix: string
  prefix: string
}

export interface StatsBarSettings {
  headline: string
  subheadline: string
  stats: StatItem[]
}

export interface Testimonial {
  name: string
  country: string
  flag: string
  initials: string
  color: string  // Tailwind class e.g. "bg-blue-500"
  stars: number
  quote: string
}

export interface TestimonialsSettings {
  items: Testimonial[]
}

export interface FAQItem {
  q: string
  a: string
}

export interface FAQSettings {
  headline: string
  subheadline: string
  items: FAQItem[]
}

export interface BrandSettings {
  company_name: string
  tagline: string
  primary_color: string  // hex e.g. "#1E40AF"
  accent_color: string   // hex e.g. "#3B82F6"
  support_email: string
  telegram_url: string
  whatsapp_url: string
  logo_url?: string      // uploaded logo image URL
}

export interface SiteSettings {
  hero: HeroSettings
  stats_bar: StatsBarSettings
  testimonials: TestimonialsSettings
  faq: FAQSettings
  brand: BrandSettings
}
