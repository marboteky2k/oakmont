/**
 * SEOHead — Dynamically syncs SEO meta tags from Site Settings into <head>.
 * No external library needed — pure DOM manipulation via useEffect.
 * Runs once on mount and whenever settings change (e.g. after admin saves).
 */
import { useEffect } from 'react'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

function setMeta(name: string, content: string) {
  if (!content) return
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.name = name
    document.head.appendChild(el)
  }
  el.content = content
}

function setOg(property: string, content: string) {
  if (!content) return
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.content = content
}

function injectScript(id: string, src: string) {
  if (document.getElementById(id)) return
  const s = document.createElement('script')
  s.id   = id
  s.src  = src
  s.async = true
  document.head.appendChild(s)
}

function injectGtag(gId: string) {
  if (!gId || document.getElementById('gtag-js')) return
  // Load gtag.js
  injectScript('gtag-js', `https://www.googletagmanager.com/gtag/js?id=${gId}`)
  // Bootstrap data layer
  if (!(window as any).gtag) {
    const s = document.createElement('script')
    s.id = 'gtag-init'
    s.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gId}');
    `
    document.head.appendChild(s)
  }
}

function injectFbPixel(pixelId: string) {
  if (!pixelId || document.getElementById('fb-pixel')) return
  const s = document.createElement('script')
  s.id = 'fb-pixel'
  s.innerHTML = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init','${pixelId}');fbq('track','PageView');
  `
  document.head.appendChild(s)
}

export function SEOHead() {
  const { settings } = useSiteSettings()
  const seo = settings.seo

  useEffect(() => {
    // ── Title ──────────────────────────────────────────────────
    document.title = seo.site_title || 'Oakmont Ridge Capital'

    // ── Standard meta ─────────────────────────────────────────
    setMeta('description',        seo.meta_description)
    setMeta('keywords',           seo.meta_keywords)
    setMeta('robots',             seo.robots || 'index, follow')

    // ── Open Graph ────────────────────────────────────────────
    setOg('og:type',              'website')
    setOg('og:site_name',         seo.site_title)
    setOg('og:title',             seo.og_title || seo.site_title)
    setOg('og:description',       seo.og_description || seo.meta_description)
    setOg('og:image',             seo.og_image)

    // ── Twitter card ──────────────────────────────────────────
    setMeta('twitter:card',        seo.twitter_card || 'summary_large_image')
    setMeta('twitter:site',        seo.twitter_handle)
    setMeta('twitter:title',       seo.og_title || seo.site_title)
    setMeta('twitter:description', seo.og_description || seo.meta_description)
    setMeta('twitter:image',       seo.og_image)

    // ── Analytics (injected once per session) ─────────────────
    if (seo.google_analytics_id)  injectGtag(seo.google_analytics_id)
    if (seo.facebook_pixel_id)    injectFbPixel(seo.facebook_pixel_id)
  }, [seo])

  return null
}
