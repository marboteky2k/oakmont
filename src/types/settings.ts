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

export interface SEOSettings {
  site_title: string        // Base page title shown in browser tab
  title_separator: string   // e.g. " | " → "Dashboard | Oakmont Ridge Capital"
  meta_description: string
  meta_keywords: string
  og_title: string          // Open Graph title for social sharing
  og_description: string    // Open Graph description
  og_image: string          // Absolute URL for social share image (1200×630)
  twitter_card: string      // "summary_large_image" | "summary"
  twitter_handle: string    // "@oakmontridge"
  google_analytics_id: string  // "G-XXXXXXXXXX"
  facebook_pixel_id: string    // "123456789"
  robots: string            // "index, follow"
}

export interface SiteSettings {
  hero: HeroSettings
  stats_bar: StatsBarSettings
  testimonials: TestimonialsSettings
  faq: FAQSettings
  brand: BrandSettings
  seo: SEOSettings
}
