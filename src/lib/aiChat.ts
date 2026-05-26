// =============================================================
// AI Support Chat — Knowledge Base & Response Engine
// =============================================================
// Runs entirely on the client.  No external API key required.
// Covers 20+ topic categories with natural, helpful replies.
// =============================================================

interface KBEntry {
  /** Patterns that trigger this entry (tested against the full message, lowercase) */
  patterns: RegExp[]
  /** Pool of responses — one is picked at random so replies feel varied */
  responses: string[]
}

const KB: KBEntry[] = [
  // ── Greetings ──────────────────────────────────────────────
  {
    patterns: [/^hi\b/i, /^hello\b/i, /^hey\b/i, /^good (morning|afternoon|evening)/i, /^howdy/i, /^greetings/i],
    responses: [
      "Hi there! 👋 I'm the Oakmont Ridge AI support assistant. I can help you with deposits, withdrawals, copy trading, KYC, investment plans, and much more. What can I help you with today?",
      "Hello! Welcome to Oakmont Ridge support. I'm here to assist you around the clock. What do you need help with?",
    ],
  },

  // ── Deposits ───────────────────────────────────────────────
  {
    patterns: [/deposit/i, /fund.*account/i, /add.*money/i, /send.*crypto/i, /how.*pay/i, /top.*up/i],
    responses: [
      "To make a deposit:\n\n1. Go to **Wallet → Deposit** in your dashboard\n2. Select your cryptocurrency (USDT, BTC, or ETH)\n3. Choose the network (TRC-20 is cheapest for USDT)\n4. Copy the wallet address shown\n5. Send from your external wallet or exchange\n\nDeposits are credited automatically within **1–30 minutes** after blockchain confirmation. Minimum deposit is $10. Is there anything specific about depositing you'd like to know?",
      "We accept three cryptocurrencies for deposits:\n• **USDT** — TRC-20 (Tron) or ERC-20 (Ethereum)\n• **Bitcoin (BTC)** — Bitcoin mainnet\n• **Ethereum (ETH)** — Ethereum mainnet\n\nHead to **Wallet → Deposit**, pick your coin, copy the address, and send. Your balance updates automatically once the network confirms the transaction (usually within minutes). Need help with a specific network?",
    ],
  },

  // ── Withdrawals ────────────────────────────────────────────
  {
    patterns: [/withdraw/i, /cash.*out/i, /take.*out/i, /redeem/i, /payout/i, /get.*money.*out/i],
    responses: [
      "To withdraw your funds:\n\n1. Make sure your **KYC is verified** (required for all withdrawals)\n2. Go to **Wallet → Withdraw**\n3. Select the cryptocurrency and network\n4. Enter your destination wallet address carefully\n5. Enter the amount\n6. Click **Continue** — a **6-digit verification code** is sent to your registered email\n7. Enter the code to confirm the withdrawal\n\nWithdrawals are reviewed and processed within **1–3 business days**. Network fees are deducted from the withdrawal amount. Would you like help with any step?",
      "Withdrawal requests are processed within **1–3 business days** after submission. Requirements:\n✅ KYC verification completed\n✅ Valid destination wallet address for the chosen network\n✅ Email verification code (sent to your registered email when you submit)\n\nGo to **Wallet → Withdraw** to start. If your KYC is still pending, that's typically the most common reason for withdrawal delays. Is your account verified?",
    ],
  },

  // ── Withdrawal timing / status ─────────────────────────────
  {
    patterns: [/when.*withdraw.*arriv/i, /withdrawal.*status/i, /withdrawal.*pending/i, /how long.*withdraw/i, /withdrawal.*tak/i],
    responses: [
      "Withdrawal requests are typically processed within **1–3 business days** from submission. Here's what to check:\n\n• **Status: Pending** — Our team is reviewing it. This is normal.\n• **Status: Confirmed** — Funds sent on-chain. Check the txid in your transaction history.\n• **Status: Failed** — Usually means an invalid wallet address. Contact support to resubmit.\n\nIf your withdrawal has been pending for more than 3 business days, please let me know your transaction ID and I'll escalate it right away.",
    ],
  },

  // ── Copy Trading ───────────────────────────────────────────
  {
    patterns: [/copy trad/i, /mirror trad/i, /follow.*trader/i, /copy.*trader/i, /how.*copy/i],
    responses: [
      "Copy trading lets you automatically mirror the trades of our verified expert traders. Here's how it works:\n\n1. Go to **Copy Trading** in your dashboard\n2. Browse traders by performance, win rate, and risk level\n3. Click **Copy** on a trader you like\n4. Set your allocation amount (minimum $50)\n5. That's it! Every trade they make is automatically replicated in your account\n\nWe charge a **20% performance fee on profits only** — you pay nothing if there are no profits. You can stop copying anytime. Would you like tips on choosing the right trader?",
      "Our copy trading feature automatically mirrors trades from verified professional traders. Key things to know:\n• **Minimum copy amount:** $50\n• **Performance fee:** 20% of profits (nothing if no profit)\n• **Multiple traders:** You can copy several traders simultaneously\n• **Stop anytime:** Pause or stop with one click\n\nTo start, go to **Copy Trading**, filter by win rate or monthly return, and click **Copy** on your preferred trader. Past performance is shown for each trader so you can make an informed choice.",
    ],
  },

  // ── Selecting traders ──────────────────────────────────────
  {
    patterns: [/best.*trader/i, /which.*trader/i, /recommend.*trader/i, /top.*trader/i, /choose.*trader/i],
    responses: [
      "When choosing a trader to copy, look at these key metrics:\n\n📊 **Win Rate** — Look for 70%+ consistently over 3+ months\n📈 **Monthly Return** — 5–20% is sustainable; be cautious of anything above 30%\n📉 **Max Drawdown** — Lower is safer (under 20% is ideal)\n⏱️ **Trading Style** — Scalping (frequent), swing (medium), or position (long-term)\n🛡️ **Risk Level** — Match your own risk tolerance\n\nDiversifying across 2–3 traders with different styles can help balance risk. Head to **Copy Trading** and filter by these metrics to find the right fit!",
    ],
  },

  // ── Investment Plans ───────────────────────────────────────
  {
    patterns: [/investment.*plan/i, /fixed.*plan/i, /invest.*plan/i, /plan.*return/i, /staking/i, /fixed.*return/i, /invest.*program/i],
    responses: [
      "Our investment plans are fixed-term products that generate guaranteed daily returns:\n\n📦 **Starter Plan** — 30 days, 5% total APY\n📦 **Basic Plan** — 60 days, 10% total APY\n📦 **Advanced Plan** — 90 days, 18% total APY\n📦 **Premium Plan** — 180 days, 35% total APY\n\nReturns are credited daily to your account. Funds are locked during the plan term — early withdrawal is not available. To invest, go to **Investments → Choose Plan**. Need details on a specific plan?",
    ],
  },

  // ── KYC Verification ──────────────────────────────────────
  {
    patterns: [/kyc/i, /verif/i, /identity/i, /id.*check/i, /document/i, /passport/i, /national.*id/i],
    responses: [
      "KYC (identity verification) is required before making your first withdrawal. Here's how to complete it:\n\n1. Go to **KYC Verification** in your dashboard\n2. Upload a **government-issued ID** (passport, national ID, or driver's licence) — front and back\n3. Upload a **proof of address** (utility bill or bank statement, dated within 3 months)\n4. Take a **selfie** holding your ID\n5. Submit and wait for review\n\nVerification is typically completed within **24 hours**. You'll receive a notification once it's approved. Is your KYC submission already in?",
      "KYC is required for withdrawals and is mandatory per our compliance policy. The process:\n✅ Government-issued photo ID (passport or national ID)\n✅ Proof of address (bank statement or utility bill, within 3 months)\n✅ Selfie for liveness check\n\nOnce submitted, our compliance team reviews it within **24 hours**. If your KYC was rejected, the rejection reason is shown in the KYC section — you can re-submit corrected documents right away.",
    ],
  },

  // ── Email OTP / Security ────────────────────────────────────
  {
    patterns: [/2fa/i, /two.factor/i, /authenticator/i, /security code/i, /otp/i, /verif.*code/i, /email.*code/i],
    responses: [
      "When you initiate a withdrawal, we send a **6-digit verification code** to your registered email address. Simply enter that code to confirm the transaction. This ensures only you can authorise withdrawals — no authenticator app needed.\n\nIf you didn't receive the code, check your spam folder or go back and click Continue again to resend. Still having trouble? Contact support at support@oakmontridgecapital.com.",
    ],
  },

  // ── Password / Login issues ───────────────────────────────
  {
    patterns: [/forgot.*pass/i, /reset.*pass/i, /can.*login/i, /locked.*out/i, /can.*access/i, /password.*wrong/i, /wrong.*password/i],
    responses: [
      "If you've forgotten your password:\n\n1. Click **Forgot Password** on the login page\n2. Enter your registered email address\n3. Check your inbox for the reset link (also check spam/junk)\n4. Click the link and set a new password\n\nThe reset link expires after 1 hour. If you're not receiving the email, make sure you're entering the exact email used during registration. Still having trouble? Share your email address and I'll flag it for our team.",
    ],
  },

  // ── Referrals ─────────────────────────────────────────────
  {
    patterns: [/referral/i, /refer.*friend/i, /affiliate/i, /invite/i, /commission/i, /refer.*earn/i],
    responses: [
      "Our referral program is generous! Here's how it works:\n\n🔗 **Your unique link** is in **Settings → Referral Program**\n💰 **Commission:** 5% of your referral's first deposit, credited instantly\n🎯 **No minimum** — there's no threshold to claim\n👥 **No limit** — refer as many people as you like\n\nYour commission is added directly to your wallet balance and can be withdrawn or invested. Have you shared your referral link yet?",
    ],
  },

  // ── Transaction status ─────────────────────────────────────
  {
    patterns: [/transaction.*status/i, /transaction.*pending/i, /payment.*pending/i, /deposit.*not.*credited/i, /deposit.*missing/i, /deposit.*pending/i],
    responses: [
      "If your deposit isn't showing up:\n\n1. **Check the blockchain first** — search your transaction hash (txid) on the relevant explorer (tronscan.org for TRC-20, etherscan.io for ERC-20, blockchain.com for BTC)\n2. **Wait for confirmations** — USDT TRC-20 needs 20 confirmations, BTC needs 3\n3. **Check the address** — Ensure you sent to the exact address shown in your deposit history\n4. **Check network** — Sending TRC-20 USDT to an ERC-20 address won't arrive automatically\n\nIf the blockchain shows the transaction as confirmed but your balance hasn't updated after 2 hours, please share the transaction hash and I'll escalate it immediately.",
    ],
  },

  // ── Fees ──────────────────────────────────────────────────
  {
    patterns: [/fee/i, /charge/i, /commission.*fee/i, /cost/i, /how much.*pay/i],
    responses: [
      "Here's a full breakdown of our fees:\n\n✅ **Deposit fee:** FREE — no charges on deposits\n✅ **Account fee:** FREE — no subscription or monthly charges\n💰 **Performance fee:** 20% of copy trading profits only (zero if no profit)\n🔗 **Withdrawal fee:** Network gas fee only — deducted from withdrawal amount (varies by network)\n📦 **Investment plans:** No fee — returns are as advertised\n\nWe never charge hidden fees. You only pay performance fees when you earn. Any other questions about our pricing?",
    ],
  },

  // ── Profit / Earnings ─────────────────────────────────────
  {
    patterns: [/profit/i, /earning/i, /return/i, /how much.*earn/i, /interest/i, /daily.*return/i, /when.*profit/i],
    responses: [
      "Here's how earnings work on Oakmont Ridge:\n\n📈 **Copy Trading:** Profits are reflected in real-time as traders open/close positions. Your performance fee (20%) is calculated on net gains.\n\n📦 **Investment Plans:** Daily returns are credited to your account every day at midnight UTC. You can see the accrual in your transaction history.\n\n💵 **Referral Commissions:** Credited instantly when your referral makes their first deposit.\n\nAll earnings are added to your wallet balance and can be withdrawn or reinvested. Would you like to know more about maximising your returns?",
    ],
  },

  // ── Account / Registration ────────────────────────────────
  {
    patterns: [/create.*account/i, /register/i, /sign.*up/i, /open.*account/i, /new.*account/i],
    responses: [
      "Creating an account is quick and free:\n\n1. Click **Get Started** on the homepage\n2. Fill in your name, email, and password\n3. Verify your email address (check your inbox)\n4. Log in and start exploring\n\nNo deposit is required to create an account. KYC verification becomes necessary only when you're ready to make your first withdrawal. Is there anything preventing you from registering?",
    ],
  },

  // ── Email Verification ────────────────────────────────────
  {
    patterns: [/verif.*email/i, /confirm.*email/i, /email.*not.*arriv/i, /resend.*verif/i, /email.*link/i],
    responses: [
      "If you're not receiving the verification email:\n\n✅ Check your **Spam / Junk** folder — it often lands there\n✅ Make sure you typed your email correctly during registration\n✅ Add support@oakmontridgecapital.com to your contacts\n✅ Try the **Resend Verification** button on the login screen\n\nVerification emails are sent instantly. If you still haven't received it after 10 minutes and it's not in spam, let me know your registered email and I'll have our team send it manually.",
    ],
  },

  // ── Wallet / Balance ──────────────────────────────────────
  {
    patterns: [/wallet/i, /balance/i, /fund.*wallet/i, /wallet.*address/i],
    responses: [
      "Your **Wallet** section shows all your balances:\n• **Available balance** — funds you can invest, copy, or withdraw\n• **Invested balance** — funds locked in active investment plans\n• **Pending balance** — transactions being processed\n\nEach cryptocurrency (USDT, BTC, ETH) has its own deposit address. Always double-check you're copying the correct address and using the correct network before sending. Would you like help with a specific wallet action?",
    ],
  },

  // ── Bot Trading ───────────────────────────────────────────
  {
    patterns: [/bot.*trad/i, /auto.*trad/i, /trading.*bot/i, /algorithm/i, /api.*trad/i],
    responses: [
      "Our **Bot Trading** feature lets you automate strategies on connected exchanges:\n\n1. Go to **Exchanges** to connect your API keys (read+trade permissions)\n2. Head to **Bot Trading** and select a strategy\n3. Set your investment amount, risk level, and the pairs to trade\n4. Activate the bot and monitor performance in real-time\n\n⚠️ Bot trading involves market risk — only use funds you can afford to lose. You can pause or stop bots at any time. Need help connecting an exchange or setting up a strategy?",
    ],
  },

  // ── Exchanges / API Keys ──────────────────────────────────
  {
    patterns: [/exchange/i, /api key/i, /binance/i, /bybit/i, /connect.*exchange/i, /link.*exchange/i],
    responses: [
      "To connect an exchange for bot trading:\n\n1. Go to **Exchanges** in your dashboard\n2. Click **Add Exchange** and select your exchange (Binance, Bybit, etc.)\n3. Log in to your exchange and create an **API key** with these permissions:\n   • ✅ Read\n   • ✅ Spot trading (or Futures if applicable)\n   • ❌ Withdrawals (never enable this for safety)\n4. Copy the API Key and Secret into our form\n5. Save — we'll verify the connection automatically\n\nYour API keys are encrypted and never shared. Need help finding where to create API keys on a specific exchange?",
    ],
  },

  // ── Markets ───────────────────────────────────────────────
  {
    patterns: [/market/i, /chart/i, /price/i, /trading.*pair/i, /forex/i, /crypto.*price/i, /live.*chart/i],
    responses: [
      "Our **Markets** page shows live prices and interactive TradingView charts for:\n\n📊 **Cryptocurrencies** — BTC, ETH, BNB, SOL, XRP, and more\n💱 **Forex** — EUR/USD, GBP/USD, USD/JPY, and major pairs\n🏅 **Commodities** — Gold (XAU/USD), Silver, and Oil\n\nClick on any market to open a full interactive chart powered by TradingView. You can switch timeframes (1m, 5m, 1H, 1D) and draw technical indicators. Markets are open 24/7 for crypto and during forex trading hours for FX pairs.",
    ],
  },

  // ── Support escalation ────────────────────────────────────
  {
    patterns: [/human/i, /real.*agent/i, /speak.*someone/i, /talk.*person/i, /live.*support/i, /contact.*support/i, /escalat/i],
    responses: [
      "I understand — sometimes you need a human! Our support team is available **Monday–Friday, 9am–6pm UTC**.\n\nYou can reach a human agent by:\n📧 **Email:** support@oakmontridgecapital.com — we respond within 24 hours\n💬 **This chat** — type your issue and a human agent will pick it up during business hours\n\nI'll flag your conversation for priority attention. In the meantime, can you tell me more about your issue? I might be able to resolve it right now.",
    ],
  },

  // ── Account security / suspicious activity ────────────────
  {
    patterns: [/hack/i, /breach/i, /unauthori/i, /suspicious/i, /not.*me/i, /someone.*access/i, /secur.*issue/i],
    responses: [
      "🚨 **This is urgent — take these steps immediately:**\n\n1. **Change your password** right now at Settings → Security\n2. **Check your transactions** for any unrecognised activity\n3. **Revoke all sessions** in Settings → Security → Active Sessions\n4. **Email security@oakmontridgecapital.com** with details\n\nOur security team monitors for suspicious activity 24/7. We will investigate and, if necessary, freeze your account to protect your funds. Please act immediately and share any details that might help our investigation.",
    ],
  },

  // ── Thank you / Positive ──────────────────────────────────
  {
    patterns: [/thank/i, /thanks/i, /cheers/i, /great help/i, /helpful/i, /awesome/i, /perfect/i],
    responses: [
      "You're very welcome! 😊 I'm glad I could help. If you have any other questions — now or in the future — don't hesitate to reach out. We're here 24/7. Happy trading! 🚀",
      "Happy to help! Is there anything else you'd like to know? Our team is always here if you need more assistance.",
    ],
  },

  // ── Goodbye ───────────────────────────────────────────────
  {
    patterns: [/\bbye\b/i, /goodbye/i, /see you/i, /take care/i, /good night/i, /good day/i],
    responses: [
      "Goodbye! Take care and happy trading! Don't hesitate to reach out any time you need help. 👋",
    ],
  },
]

// ── Generic / fallback ─────────────────────────────────────
const FALLBACK_RESPONSES = [
  "Thanks for reaching out! I want to make sure I give you the most accurate answer. Could you share a bit more detail about what you need help with? You can also email us at support@oakmontridgecapital.com and our team will respond within 24 hours.",
  "I'm not sure I fully understand your question yet. Could you rephrase it or give me more context? Alternatively, our human support agents are available Mon–Fri, 9am–6pm UTC at support@oakmontridgecapital.com.",
  "Great question! I want to give you the right answer. Could you give me a bit more detail? For urgent issues, please email support@oakmontridgecapital.com and our team will respond within 24 hours.",
]

// ── Response selection ─────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateAIReply(userMessage: string): string {
  const msg = userMessage.toLowerCase().trim()

  // Score each KB entry by how many patterns match
  let bestScore = 0
  let bestEntry: KBEntry | null = null

  for (const entry of KB) {
    const score = entry.patterns.filter(p => p.test(msg)).length
    if (score > bestScore) {
      bestScore = score
      bestEntry = entry
    }
  }

  if (bestEntry && bestScore > 0) {
    return pick(bestEntry.responses)
  }

  return pick(FALLBACK_RESPONSES)
}

/** Simulated typing delay — scales with response length so it feels natural */
export function typingDelay(response: string): number {
  // Base delay + a small factor per character, capped between 1.2s and 3.5s
  const base = 1200
  const perChar = 12
  return Math.min(Math.max(base + response.length * perChar * 0.1, 1200), 3500)
}
