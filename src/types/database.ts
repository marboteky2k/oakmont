export type UserRole = 'super_admin' | 'admin' | 'copy_trader' | 'investor'
export type KycStatus = 'pending' | 'verified' | 'rejected'
export type TradingStyle = 'scalping' | 'swing' | 'day_trading' | 'position'
export type RiskLevel = 'low' | 'medium' | 'high'
export type SubscriptionStatus = 'active' | 'paused' | 'stopped'
export type InvestmentStatus = 'active' | 'completed' | 'cancelled'
export type TransactionType = 'deposit' | 'withdrawal' | 'profit' | 'fee' | 'transfer' | 'copy_earning'
export type TransactionStatus = 'pending' | 'pending_verification' | 'confirmed' | 'failed' | 'cancelled'
export type Currency = 'USDT' | 'BTC' | 'ETH'
export type TradeDirection = 'buy' | 'sell'
export type TradeStatus = 'open' | 'closed' | 'cancelled'
export type NotificationType = 'info' | 'success' | 'warning' | 'danger'
export type SettingType = 'text' | 'color' | 'image' | 'boolean' | 'json'
export type DocumentType = 'passport' | 'national_id' | 'drivers_license'
export type KycDocStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  role: UserRole
  kyc_status: KycStatus
  is_active: boolean
  email_verified: boolean
  referral_code?: string
  referred_by?: string
  country?: string
  date_of_birth?: string
  investment_experience?: string
  investment_goals?: string
  asset_interests?: string
  created_at: string
}

export type Exchange = 'binance' | 'okx' | 'bybit'
export type BotStrategy = 'grid' | 'dca' | 'momentum' | 'scalper'
export type BotStatus = 'active' | 'paused' | 'stopped'

export interface ExchangeApiKey {
  id: string
  user_id: string
  exchange: Exchange
  label: string
  api_key: string
  api_secret: string
  passphrase?: string
  is_active: boolean
  is_connected: boolean
  last_tested?: string
  created_at: string
}

export interface BotTrade {
  id: string
  user_id: string
  exchange: Exchange
  strategy: BotStrategy
  pair: string
  status: BotStatus
  profit_pct: number
  profit_usd: number
  total_trades: number
  total_invested: number
  config?: Record<string, unknown>
  started_at: string
  stopped_at?: string
}

export interface Wallet {
  id: string
  user_id: string
  balance_usdt: number
  balance_btc: number
  balance_eth: number
  total_profit: number
  total_invested: number
  updated_at: string
}

export interface CopyTrader {
  id: string
  user_id: string
  display_name: string
  bio?: string
  avatar_url?: string
  trading_style: TradingStyle
  risk_level: RiskLevel
  performance_fee: number
  min_copy_amount: number
  max_drawdown: number
  win_rate: number
  total_return_pct: number
  monthly_return_pct: number
  followers_count: number
  assets_under_management: number
  is_verified: boolean
  is_featured: boolean
  is_active: boolean
  created_at: string
}

export interface TraderPerformance {
  id: string
  trader_id: string
  month: string
  return_pct: number
  trades_count: number
  win_count: number
  loss_count: number
  profit_usd: number
  created_at: string
}

export interface CopySubscription {
  id: string
  investor_id: string
  trader_id: string
  allocated_amount: number
  current_value: number
  profit_loss: number
  status: SubscriptionStatus
  copy_ratio: number
  started_at: string
  stopped_at?: string
  copy_traders?: CopyTrader
}

export interface InvestmentPlan {
  id: string
  name: string
  description: string
  min_amount: number
  max_amount: number
  roi_percentage: number
  period_days: number
  risk_level: RiskLevel
  is_active: boolean
  created_at: string
}

export interface Investment {
  id: string
  user_id: string
  plan_id: string
  amount: number
  expected_return: number
  actual_return: number
  status: InvestmentStatus
  started_at: string
  maturity_at: string
  investment_plans?: InvestmentPlan
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  currency: Currency
  status: TransactionStatus
  crypto_address?: string
  tx_hash?: string
  network?: string
  note?: string
  receipt_url?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface TradeSignal {
  id: string
  trader_id: string
  pair: string
  direction: TradeDirection
  entry_price: number
  stop_loss: number
  take_profit: number
  lot_size: number
  status: TradeStatus
  profit_pips?: number
  profit_usd?: number
  opened_at: string
  closed_at?: string
  copy_traders?: CopyTrader
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  created_at: string
}

export interface SiteSetting {
  id: string
  key: string
  value: string
  type: SettingType
  section: string
  updated_at: string
}

export interface CryptoWallet {
  id: string
  currency: Currency
  network: string
  address: string
  label: string
  is_active: boolean
  created_at: string
}

export interface KycDocument {
  id: string
  user_id: string
  document_type: DocumentType
  front_url?: string
  back_url?: string
  selfie_url?: string
  status: KycDocStatus
  rejection_reason?: string
  reviewed_by?: string
  created_at: string
}

export interface AuditLog {
  id: string
  admin_id: string
  action: string
  target_type: string
  target_id: string
  details?: Record<string, unknown>
  ip_address?: string
  created_at: string
  users?: User
}

export type Database = {
  public: {
    Tables: {
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> }
      wallets: { Row: Wallet; Insert: Partial<Wallet>; Update: Partial<Wallet> }
      copy_traders: { Row: CopyTrader; Insert: Partial<CopyTrader>; Update: Partial<CopyTrader> }
      trader_performance: { Row: TraderPerformance; Insert: Partial<TraderPerformance>; Update: Partial<TraderPerformance> }
      copy_subscriptions: { Row: CopySubscription; Insert: Partial<CopySubscription>; Update: Partial<CopySubscription> }
      investment_plans: { Row: InvestmentPlan; Insert: Partial<InvestmentPlan>; Update: Partial<InvestmentPlan> }
      investments: { Row: Investment; Insert: Partial<Investment>; Update: Partial<Investment> }
      transactions: { Row: Transaction; Insert: Partial<Transaction>; Update: Partial<Transaction> }
      trade_signals: { Row: TradeSignal; Insert: Partial<TradeSignal>; Update: Partial<TradeSignal> }
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> }
      site_settings: { Row: SiteSetting; Insert: Partial<SiteSetting>; Update: Partial<SiteSetting> }
      crypto_wallets: { Row: CryptoWallet; Insert: Partial<CryptoWallet>; Update: Partial<CryptoWallet> }
      kyc_documents: { Row: KycDocument; Insert: Partial<KycDocument>; Update: Partial<KycDocument> }
      audit_logs: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> }
      chat_messages: { Row: ChatMessage; Insert: Partial<ChatMessage>; Update: Partial<ChatMessage> }
      user_trades: { Row: UserTrade; Insert: Partial<UserTrade>; Update: Partial<UserTrade> }
    }
  }
}

// =============================================================
// User Trades (manual trading)
// =============================================================
export type TradeStatusType = 'open' | 'closed' | 'cancelled'
export type TradeSide = 'buy' | 'sell'

export interface UserTrade {
  id: string
  user_id: string
  symbol: string
  direction: TradeSide
  amount_usdt: number
  entry_price: number
  close_price?: number | null
  profit_loss: number
  profit_loss_pct: number
  leverage: number
  stop_loss?: number | null
  take_profit?: number | null
  status: TradeStatusType
  opened_at: string
  closed_at?: string | null
  created_at: string
}

// =============================================================
// Chat
// =============================================================
export interface ChatMessage {
  id: string
  user_id: string
  message: string
  is_admin: boolean
  is_ai: boolean
  is_read: boolean
  attachment_url?: string | null
  created_at: string
}
