import { motion } from 'framer-motion'
import { Shield, Mail, Lock, Eye, Database, Globe, RefreshCw, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PublicNav } from '@/components/layout/PublicNav'
import { LandingFooter } from '@/pages/landing/LandingFooter'
import { useLegalDoc } from '@/hooks/useCmsContent'

const EFFECTIVE_DATE = 'May 24, 2026'
const COMPANY       = 'Oakmont Ridge Capital Ltd.'
const CONTACT_EMAIL = 'privacy@oakmontridge.com'

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

const TOC = [
  { id: 'information',     label: 'Information We Collect' },
  { id: 'use',             label: 'How We Use Your Data' },
  { id: 'sharing',         label: 'Data Sharing' },
  { id: 'security',        label: 'Data Security' },
  { id: 'retention',       label: 'Data Retention' },
  { id: 'rights',          label: 'Your Rights' },
  { id: 'cookies',         label: 'Cookies' },
  { id: 'international',   label: 'International Transfers' },
  { id: 'children',        label: 'Children\'s Privacy' },
  { id: 'changes',         label: 'Policy Changes' },
  { id: 'contact',         label: 'Contact Us' },
]

export default function PrivacyPolicy() {
  const cmsText = useLegalDoc('privacy_policy')
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
            <Shield className="w-7 h-7 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-extrabold mb-2"
          >
            Privacy Policy
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
          {/* CMS override — if admin has set custom content, render it instead */}
          {cmsText ? (
            <div className="text-sm text-slate-600 leading-7 whitespace-pre-wrap">{cmsText}</div>
          ) : (<>
          <p className="text-sm text-slate-600 leading-7">
            {COMPANY} ("<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>") is committed to
            protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our platform at <strong>oakmontridge.com</strong> (the
            "<strong>Service</strong>"). Please read this policy carefully. If you disagree with its terms, please
            discontinue use of the Service.
          </p>

          <Section id="information" title="1. Information We Collect">
            <p>We collect information you provide directly to us:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Account data:</strong> full name, email address, phone number, country of residence, and password (stored hashed).</li>
              <li><strong>Identity verification (KYC):</strong> government-issued ID, proof of address, selfies submitted for anti-money-laundering compliance.</li>
              <li><strong>Financial data:</strong> wallet addresses, transaction history, investment amounts, and withdrawal details.</li>
              <li><strong>Communications:</strong> support tickets, chat messages, and email correspondence.</li>
            </ul>
            <p>We also collect data automatically:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Usage data:</strong> pages visited, features used, session duration, button clicks.</li>
              <li><strong>Device data:</strong> IP address, browser type, operating system, device identifiers.</li>
              <li><strong>Cookie data:</strong> see our <Link to="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</Link> for details.</li>
            </ul>
          </Section>

          <Section id="use" title="2. How We Use Your Data">
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Provide, operate, and improve the Service.</li>
              <li>Process transactions and send related notifications.</li>
              <li>Verify your identity and comply with KYC/AML regulations.</li>
              <li>Detect, prevent, and investigate fraud and security incidents.</li>
              <li>Communicate service updates, promotional offers (where consented), and legal notices.</li>
              <li>Conduct analytics and research to enhance user experience.</li>
              <li>Comply with applicable laws, court orders, and regulatory requirements.</li>
            </ul>
            <p>
              Our lawful bases for processing include performance of a contract (account operation), legal obligation
              (KYC/AML), legitimate interests (security, fraud prevention), and consent (marketing communications).
            </p>
          </Section>

          <Section id="sharing" title="3. Data Sharing">
            <p>We do <strong>not</strong> sell your personal data. We may share it with:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Service providers:</strong> cloud hosting (Supabase), email delivery, payment processors, and identity verification partners — bound by data processing agreements.</li>
              <li><strong>Copy traders:</strong> limited profile data (initials, subscription status) to enable trade-copying relationships you initiate.</li>
              <li><strong>Regulators and law enforcement:</strong> when required by applicable law, court order, or to protect rights and safety.</li>
              <li><strong>Business transfers:</strong> in the event of a merger, acquisition, or sale of assets, your data may be transferred to a successor entity.</li>
            </ul>
          </Section>

          <Section id="security" title="4. Data Security">
            <p>
              We implement industry-standard security measures including AES-256 encryption at rest, TLS 1.3 in transit,
              bcrypt password hashing, role-based access controls, and multi-factor authentication options. We regularly
              audit our systems for vulnerabilities.
            </p>
            <p>
              No method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security
              but will notify you promptly in the event of a confirmed breach affecting your data.
            </p>
          </Section>

          <Section id="retention" title="5. Data Retention">
            <p>
              We retain your account data for the duration of your account and for a period of <strong>7 years</strong>{' '}
              afterwards to comply with financial regulations and legal obligations. Transaction records are retained for
              a minimum of <strong>5 years</strong>. KYC documents are retained for <strong>5 years</strong> after
              the end of the business relationship. You may request deletion of data not subject to legal retention
              obligations via the contact details below.
            </p>
          </Section>

          <Section id="rights" title="6. Your Rights">
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Access</strong> the personal data we hold about you.</li>
              <li><strong>Rectify</strong> inaccurate or incomplete data.</li>
              <li><strong>Erase</strong> your data (where not overridden by legal obligations).</li>
              <li><strong>Restrict</strong> or <strong>object</strong> to processing in certain circumstances.</li>
              <li><strong>Data portability</strong> — receive your data in a machine-readable format.</li>
              <li><strong>Withdraw consent</strong> for marketing at any time.</li>
              <li><strong>Lodge a complaint</strong> with your local data protection authority.</li>
            </ul>
            <p>
              To exercise any right, email us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>.
              We will respond within 30 days.
            </p>
          </Section>

          <Section id="cookies" title="7. Cookies">
            <p>
              We use cookies and similar tracking technologies to personalise your experience and analyse traffic.
              For a full explanation of which cookies we use and how to manage them, see our{' '}
              <Link to="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</Link>.
            </p>
          </Section>

          <Section id="international" title="8. International Data Transfers">
            <p>
              {COMPANY} operates globally. Your data may be processed in countries outside your own, including the
              United Kingdom, United States, and European Union. Where transfers occur outside the EEA, we rely on
              Standard Contractual Clauses or adequacy decisions to ensure appropriate safeguards.
            </p>
          </Section>

          <Section id="children" title="9. Children's Privacy">
            <p>
              The Service is not directed to individuals under the age of <strong>18</strong>. We do not knowingly
              collect personal information from minors. If we become aware that a child has provided us with personal
              data, we will delete it promptly. Contact us if you believe a minor has submitted data.
            </p>
          </Section>

          <Section id="changes" title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will post the revised version on this page with
              an updated effective date and, for material changes, notify you by email or in-app alert at least 14 days
              before the change takes effect. Continued use of the Service after the effective date constitutes
              acceptance of the updated policy.
            </p>
          </Section>

          <Section id="contact" title="11. Contact Us">
            <p>For privacy-related enquiries:</p>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-sm">
              <p><strong>{COMPANY}</strong></p>
              <p>Data Protection Officer</p>
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
            <Link to="/cookie-policy" className="hover:text-slate-600 transition-colors">Cookie Policy →</Link>
          </div>
          </>)}
        </article>
      </div>
      <LandingFooter />
    </div>
  )
}
