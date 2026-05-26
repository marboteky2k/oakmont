import { motion } from 'framer-motion'
import { Cookie, ChevronRight, Settings, BarChart2, Shield, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PublicNav } from '@/components/layout/PublicNav'
import { LandingFooter } from '@/pages/landing/LandingFooter'
import { useLegalDoc } from '@/hooks/useCmsContent'

const EFFECTIVE_DATE = 'May 24, 2026'
const COMPANY        = 'Oakmont Ridge Capital Ltd.'
const CONTACT_EMAIL  = 'privacy@oakmontridge.com'

interface SectionProps {
  id: string
  title: string
  children: React.ReactNode
}

function Section({ id, title, children }: SectionProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4 }}
      className="scroll-mt-24"
    >
      <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>
      <div className="text-sm text-slate-600 leading-7 space-y-3">{children}</div>
    </motion.section>
  )
}

interface CookieTableRow {
  name: string
  type: string
  purpose: string
  duration: string
}

function CookieTable({ rows }: { rows: CookieTableRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 mt-3">
      <table className="w-full text-xs">
        <thead className="bg-slate-50">
          <tr>
            {['Cookie Name', 'Type', 'Purpose', 'Duration'].map((h) => (
              <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wide text-xs border-b border-slate-100">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-50/60">
              <td className="px-3 py-2.5 font-mono text-slate-800">{r.name}</td>
              <td className="px-3 py-2.5 text-slate-600">{r.type}</td>
              <td className="px-3 py-2.5 text-slate-600">{r.purpose}</td>
              <td className="px-3 py-2.5 text-slate-500">{r.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const TOC = [
  { id: 'what',      label: 'What Are Cookies?' },
  { id: 'types',     label: 'Types We Use' },
  { id: 'necessary', label: 'Strictly Necessary' },
  { id: 'analytics', label: 'Analytics Cookies' },
  { id: 'functional',label: 'Functional Cookies' },
  { id: 'cache',     label: 'Caching & Storage' },
  { id: 'control',   label: 'Your Choices' },
  { id: 'third',     label: 'Third-Party Cookies' },
  { id: 'changes',   label: 'Policy Changes' },
  { id: 'contact',   label: 'Contact Us' },
]

export default function CookiePolicy() {
  const cmsText = useLegalDoc('cookie_policy')
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1E40AF] to-[#1e3a8a] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-5"
          >
            <Cookie className="w-7 h-7 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-extrabold mb-2"
          >
            Cookie &amp; Cache Policy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-blue-200 text-sm"
          >
            Effective date: {EFFECTIVE_DATE} · {COMPANY}
          </motion.p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Table of contents */}
        <aside className="hidden lg:block">
          <div className="sticky top-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Contents</p>
            <ul className="space-y-0.5">
              {TOC.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#1E40AF] py-1 rounded transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Body */}
        <article className="lg:col-span-3 space-y-10 bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          {/* CMS override */}
          {cmsText ? (
            <div className="text-sm text-slate-600 leading-7 whitespace-pre-wrap">{cmsText}</div>
          ) : (<>
          <p className="text-sm text-slate-600 leading-7">
            This Cookie &amp; Cache Policy explains how {COMPANY} uses cookies, web storage, and caching technologies
            when you visit <strong>oakmontridge.com</strong>. Read this alongside our{' '}
            <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
          </p>

          <Section id="what" title="1. What Are Cookies?">
            <p>
              Cookies are small text files placed on your device by a website. They help the site remember your
              preferences, keep you logged in, understand how you navigate, and improve performance. Similar
              technologies include web storage (localStorage, sessionStorage) and service-worker caches.
            </p>
          </Section>

          <Section id="types" title="2. Cookie Categories We Use">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Shield,   label: 'Strictly Necessary', desc: 'Essential for the site to work. Cannot be disabled.',           color: 'text-blue-600 bg-blue-50' },
                { icon: BarChart2,label: 'Analytics',           desc: 'Help us understand how visitors interact with the platform.',   color: 'text-indigo-600 bg-indigo-50' },
                { icon: Settings, label: 'Functional',          desc: 'Remember your preferences such as language and theme.',         color: 'text-purple-600 bg-purple-50' },
                { icon: Bell,     label: 'Marketing',           desc: 'Used to deliver relevant advertisements (only with consent).',  color: 'text-amber-600 bg-amber-50' },
              ].map(({ icon: Icon, label, desc, color }) => (
                <div key={label} className={`flex items-start gap-3 rounded-xl border p-3.5 border-slate-100`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-xs">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="necessary" title="3. Strictly Necessary Cookies">
            <p>
              These cookies are required for the platform to function. They enable core features such as secure login,
              session management, CSRF protection, and API authentication. You cannot opt out of these cookies without
              disabling the platform entirely.
            </p>
            <CookieTable rows={[
              { name: 'sb-access-token',   type: 'Necessary', purpose: 'Supabase authentication JWT token',           duration: 'Session' },
              { name: 'sb-refresh-token',  type: 'Necessary', purpose: 'Supabase session refresh token',              duration: '7 days' },
              { name: 'oakmont_csrf',      type: 'Necessary', purpose: 'Cross-site request forgery protection',        duration: 'Session' },
              { name: 'oakmont_session',   type: 'Necessary', purpose: 'Encrypted session identifier',                 duration: '30 days' },
            ]} />
          </Section>

          <Section id="analytics" title="4. Analytics Cookies">
            <p>
              We use anonymised analytics to understand user behaviour and improve the product. No personally
              identifiable information is shared with analytics providers. These are set only when you accept
              analytics cookies in the consent banner.
            </p>
            <CookieTable rows={[
              { name: '_ga',               type: 'Analytics', purpose: 'Google Analytics — distinguishes users',       duration: '2 years' },
              { name: '_ga_XXXXXXXXXX',    type: 'Analytics', purpose: 'Google Analytics 4 session state',            duration: '2 years' },
              { name: 'oakmont_pageviews', type: 'Analytics', purpose: 'Internal page-visit counter (localStorage)',  duration: 'Persistent' },
            ]} />
          </Section>

          <Section id="functional" title="5. Functional Cookies">
            <p>
              Functional cookies remember choices you make to improve your experience, such as your preferred
              language, colour scheme, and notification settings.
            </p>
            <CookieTable rows={[
              { name: 'oakmont_theme',      type: 'Functional', purpose: 'Stores light/dark mode preference',     duration: '1 year' },
              { name: 'oakmont_lang',       type: 'Functional', purpose: 'Stores interface language selection',   duration: '1 year' },
              { name: 'oakmont_sidebar',    type: 'Functional', purpose: 'Stores sidebar collapsed state',        duration: '1 year' },
            ]} />
          </Section>

          <Section id="cache" title="6. Caching &amp; Browser Storage">
            <p>
              In addition to cookies, our platform uses browser-native storage for performance and offline support:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>localStorage</strong> — stores non-sensitive preference data (e.g. <code className="bg-slate-100 rounded px-1 text-xs">oakmont_cookie_consent</code>,
                theme, sidebar state) that persists between sessions. Cleared when you clear site data.
              </li>
              <li>
                <strong>sessionStorage</strong> — stores temporary UI state (e.g. active tab, scroll position)
                that is cleared automatically when you close the browser tab.
              </li>
              <li>
                <strong>Service Worker Cache</strong> — caches static assets (JS, CSS, fonts) for faster load times
                and limited offline access. The cache is versioned and purged on each deployment. No personal data is
                stored in the service worker cache.
              </li>
              <li>
                <strong>HTTP Cache headers</strong> — assets are served with appropriate <code className="bg-slate-100 rounded px-1 text-xs">Cache-Control</code> headers
                to reduce bandwidth. Financial data and authenticated API responses are marked <code className="bg-slate-100 rounded px-1 text-xs">no-store</code> to
                prevent caching of sensitive information.
              </li>
            </ul>
          </Section>

          <Section id="control" title="7. Managing Your Cookie Preferences">
            <p>
              You can manage cookie preferences in several ways:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Consent banner:</strong> when you first visit, a banner allows you to accept all cookies or
                select only strictly necessary cookies. Your choice is stored in <code className="bg-slate-100 rounded px-1 text-xs">oakmont_cookie_consent</code> in localStorage.
              </li>
              <li>
                <strong>Browser settings:</strong> all major browsers allow you to block or delete cookies. Note that
                blocking strictly necessary cookies will prevent you from logging in.
              </li>
              <li>
                <strong>Clear site data:</strong> in your browser's developer tools under Application → Storage, you
                can clear all cookies, localStorage, and caches for our domain.
              </li>
            </ul>
            <p>
              To revoke consent and see your stored preferences at any time, visit your{' '}
              <Link to="/settings" className="text-blue-600 hover:underline">Account Settings</Link> → Privacy.
            </p>
          </Section>

          <Section id="third" title="8. Third-Party Cookies">
            <p>
              Some third-party services embedded in our platform may set their own cookies:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Supabase</strong> — authentication and real-time data infrastructure.</li>
              <li><strong>Stripe</strong> — payment processing (if applicable); governed by <a href="https://stripe.com/cookies-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Stripe's Cookie Policy</a>.</li>
              <li><strong>Google Analytics</strong> — only loaded with analytics consent; governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google's Privacy Policy</a>.</li>
            </ul>
            <p>
              We do not control third-party cookies. Please review each provider's privacy policy for details.
            </p>
          </Section>

          <Section id="changes" title="9. Changes to This Policy">
            <p>
              We may update this Cookie &amp; Cache Policy periodically. Material changes will be announced via the
              consent banner or email at least 14 days before they take effect. The effective date at the top of this
              page reflects the most recent revision.
            </p>
          </Section>

          <Section id="contact" title="10. Contact Us">
            <p>For questions about our use of cookies:</p>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-sm">
              <p><strong>{COMPANY}</strong></p>
              <p>
                Email:{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </Section>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>© {new Date().getFullYear()} {COMPANY}. All rights reserved.</span>
            <Link to="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy →</Link>
          </div>
          </>)}
        </article>
      </div>
      <LandingFooter />
    </div>
  )
}
