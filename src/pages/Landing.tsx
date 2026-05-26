import { LandingNav } from './landing/LandingNav'
import { HeroSection } from './landing/HeroSection'
import { MarketTicker } from './landing/MarketTicker'
import { HowItWorks } from './landing/HowItWorks'
import { TradersSection } from './landing/TradersSection'
import { PlansSection } from './landing/PlansSection'
import { Testimonials } from './landing/Testimonials'
import { StatsSection } from './landing/StatsSection'
import { TrustSection } from './landing/TrustSection'
import { FAQSection } from './landing/FAQSection'
import { LandingFooter } from './landing/LandingFooter'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white" style={{ scrollBehavior: 'smooth' }}>
      <LandingNav />
      <HeroSection />
      <MarketTicker />
      <HowItWorks />
      <TradersSection />
      <PlansSection />
      <Testimonials />
      <StatsSection />
      <TrustSection />
      <FAQSection />
      <LandingFooter />
    </div>
  )
}
