import { motion } from 'framer-motion'
import { FileText, ChevronRight, AlertTriangle, Scale, Ban, CreditCard, RefreshCw, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PublicNav } from '@/components/layout/PublicNav'
import { LandingFooter } from '@/pages/landing/LandingFooter'
import { useLegalDoc } from '@/hooks/useCmsContent'

const EFFECTIVE_DATE = 'May 24, 2026'
const COMPANY       = 'Oakmont Ridge Capital Ltd.'
const CONTACT_EMAIL = 'legal@oakmontridge.com'

interface SectionProps { id: string; title: string; children: React.ReactNode }
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
  { id: 'acceptance',    label: 'Acceptance of Terms' },
  { id: 'eligibility',  label: 'Eligibility' },
  { id: 'account',      label: 'Account Responsibilities' },
  { id: 'services',     label: 'Platform Services' },
  { id: 'trading',      label: 'Copy Trading Risk Disclosure' },
  { id: 'payments',     label: 'Payments & Withdrawals' },
  { id: 'prohibited',   label: 'Prohibited Activities' },
  { id: 'intellectual', label: 'Intellectual Property' },
  { id: 'limitation',   label: 'Limitation of Liability' },
  { id: 'termination',  label: 'Termination' },
  { id: 'governing',    label: 'Governing Law' },
  { id: 'contact',      label: 'Contact' },
]

export default function TermsOfService() {
  const cmsText = useLegalDoc('terms_of_service')
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1E40AF] to-[#1e3a8a] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-5">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Terms of Service</h1>
            <p className="text-blue-200 text-sm">Effective date: {EFFECTIVE_DATE}</p>
            <p className="text-blue-100 text-sm mt-2 max-w-xl mx-auto">
              Please read these terms carefully before using the Oakmont Ridge Capital platform.
              By accessing our services, you agree to be bound by these terms.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link to="/" className="hover:text-[#1E40AF] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600">Terms of Service</span>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar TOC */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Contents</p>
              <nav className="space-y-1">
                {TOC.map(item => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-xs text-slate-600 hover:text-[#1E40AF] py-1 px-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-10">
            {/* CMS override */}
            {cmsText ? (
              <div className="text-sm text-slate-600 leading-7 whitespace-pre-wrap">{cmsText}</div>
            ) : (<>
            {/* Risk banner */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Risk Warning:</strong> Trading financial instruments, including Forex and cryptocurrencies,
                carries a high level of risk and may not be suitable for all investors. You may lose some or all of
                your invested capital. Only invest funds you can afford to lose.
              </p>
            </div>

            <Section id="acceptance" title="1. Acceptance of Terms">
              <p>
                By creating an account, accessing, or using any services provided by {COMPANY} ("Company", "we",
                "our", or "us"), you agree to be legally bound by these Terms of Service ("Terms") and all
                applicable laws and regulations.
              </p>
              <p>
                If you do not agree with any part of these Terms, you must not use our platform or services.
                We reserve the right to modify these Terms at any time. Continued use of the platform after
                changes are posted constitutes acceptance of the revised Terms.
              </p>
            </Section>

            <Section id="eligibility" title="2. Eligibility">
              <p>To use Oakmont Ridge Capital, you must:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Be at least 18 years of age (or the legal adult age in your jurisdiction)</li>
                <li>Have full legal capacity to enter into binding contracts</li>
                <li>Not be a resident of any jurisdiction where our services are restricted or prohibited</li>
                <li>Not be subject to any sanctions, embargoes, or trade restrictions</li>
                <li>Complete identity verification (KYC) as required by applicable regulations</li>
              </ul>
              <p>
                We reserve the right to refuse service to anyone for any reason at any time, including
                residents of restricted jurisdictions.
              </p>
            </Section>

            <Section id="account" title="3. Account Responsibilities">
              <p>
                You are solely responsible for maintaining the confidentiality of your account credentials,
                including your password and any two-factor authentication codes. You agree to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Update your account information promptly if it changes</li>
                <li>Notify us immediately of any unauthorised use of your account</li>
                <li>Not share your account with any third party</li>
                <li>Not create multiple accounts; one account per person is permitted</li>
              </ul>
              <p>
                We will not be liable for any losses resulting from unauthorised access to your account
                due to your failure to keep your credentials secure.
              </p>
            </Section>

            <Section id="services" title="4. Platform Services">
              <p>Oakmont Ridge Capital provides the following services:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Copy Trading</strong> — Mirror the trades of verified professional traders</li>
                <li><strong>Investment Plans</strong> — Fixed-term USDT investment products with stated returns</li>
                <li><strong>Crypto Wallet</strong> — Multi-currency wallet for USDT, BTC, and ETH</li>
                <li><strong>Analytics Dashboard</strong> — Real-time portfolio tracking and performance insights</li>
              </ul>
              <p>
                All services are provided "as is." We do not guarantee the availability, accuracy, or
                completeness of our platform at all times. Scheduled maintenance may temporarily
                interrupt services.
              </p>
            </Section>

            <Section id="trading" title="5. Copy Trading Risk Disclosure">
              <p>
                Copy trading allows you to replicate the trading positions of experienced traders. You
                acknowledge and accept the following risks:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Past performance of any trader does not guarantee future results</li>
                <li>You may lose part or all of your allocated copy-trading funds</li>
                <li>Market volatility, slippage, and liquidity may affect copied trade outcomes</li>
                <li>Traders may change their strategies at any time without notice</li>
                <li>Platform fees and commissions will reduce net returns</li>
              </ul>
              <p>
                All copy-trading decisions are made at your sole discretion. The Company is not a registered
                investment adviser and does not provide personalised investment advice.
              </p>
            </Section>

            <Section id="payments" title="6. Payments & Withdrawals">
              <p>
                All deposits are accepted exclusively in cryptocurrencies (USDT, BTC, ETH). By depositing
                funds, you confirm that the funds originate from legitimate sources and comply with all
                applicable anti-money-laundering laws.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Minimum deposit amounts are displayed on the platform and subject to change</li>
                <li>Withdrawal requests are typically processed within 1–3 business days</li>
                <li>Withdrawals require completed KYC verification</li>
                <li>Active investment plan funds may not be withdrawn before maturity</li>
                <li>We reserve the right to delay or block withdrawals pending compliance reviews</li>
              </ul>
              <p>
                Network transaction fees are the responsibility of the user and will be deducted from
                the withdrawal amount.
              </p>
            </Section>

            <Section id="prohibited" title="7. Prohibited Activities">
              <p>You agree not to engage in any of the following:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Fraudulent activity, misrepresentation, or identity theft</li>
                <li>Money laundering, terrorist financing, or any illegal financial activity</li>
                <li>Manipulating markets or engaging in coordinated trading schemes</li>
                <li>Using automated bots, scrapers, or scripts without written permission</li>
                <li>Attempting to gain unauthorised access to our systems or data</li>
                <li>Creating fake reviews, inflating trader statistics, or spreading misinformation</li>
                <li>Violating any applicable laws or regulations</li>
              </ul>
              <p>
                Violation of these prohibitions may result in immediate account suspension, fund
                freezing, and reporting to relevant authorities.
              </p>
            </Section>

            <Section id="intellectual" title="8. Intellectual Property">
              <p>
                All content on the Oakmont Ridge Capital platform, including text, graphics, logos,
                software, and data, is the exclusive property of {COMPANY} and is protected by
                applicable intellectual property laws.
              </p>
              <p>
                You are granted a limited, non-exclusive, non-transferable licence to access and use
                the platform for personal, non-commercial purposes. You may not reproduce, distribute,
                modify, or create derivative works without our prior written consent.
              </p>
            </Section>

            <Section id="limitation" title="9. Limitation of Liability">
              <p>
                To the maximum extent permitted by law, {COMPANY}, its directors, officers, employees,
                and affiliates shall not be liable for any:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Trading losses, whether direct or indirect</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>System outages, delays, or technical failures</li>
                <li>Third-party actions, including blockchain network failures</li>
                <li>Losses resulting from unauthorised account access</li>
              </ul>
              <p>
                In no event shall our total liability to you exceed the fees paid by you to the Company
                in the twelve (12) months preceding the claim.
              </p>
            </Section>

            <Section id="termination" title="10. Termination">
              <p>
                We reserve the right to suspend or terminate your account, at our sole discretion, with
                or without notice, for any reason including but not limited to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Violation of these Terms</li>
                <li>Suspected fraudulent or illegal activity</li>
                <li>Failure to complete KYC verification</li>
                <li>Extended account inactivity</li>
              </ul>
              <p>
                Upon termination, you may request a withdrawal of any remaining unrestricted funds,
                subject to compliance review. Provisions related to intellectual property, limitation
                of liability, and governing law survive termination.
              </p>
            </Section>

            <Section id="governing" title="11. Governing Law">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the
                jurisdiction in which {COMPANY} is incorporated. Any disputes arising from these Terms
                shall first be attempted to be resolved through good-faith negotiation. If unresolved,
                disputes shall be submitted to binding arbitration under the rules of the applicable
                arbitration body.
              </p>
            </Section>

            <Section id="contact" title="12. Contact">
              <p>
                If you have questions about these Terms, please contact our legal team:
              </p>
              <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#1E40AF] flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900">{COMPANY}</p>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1E40AF] hover:underline">{CONTACT_EMAIL}</a>
                </div>
              </div>
            </Section>

            <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-400">
              <Link to="/privacy" className="hover:text-[#1E40AF] transition-colors">Privacy Policy</Link>
              <Link to="/contact" className="hover:text-[#1E40AF] transition-colors">Contact Us</Link>
              <Link to="/" className="hover:text-[#1E40AF] transition-colors">← Back to Home</Link>
            </div>
            </>)}
          </div>
        </div>
      </div>
      <LandingFooter />
    </div>
  )
}
