import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Copy, ArrowDownToLine, ArrowUpFromLine, CheckCircle, AlertCircle,
  Shield, ExternalLink, ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, Gift,
  ChevronLeft, ChevronRight, Upload, ImageIcon, X, ArrowLeftRight, RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { invokeFunction } from '@/lib/functions'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/utils'
import { validateCryptoAddress, detectNetworkFromAddress } from '@/lib/crypto-validate'
import type { Currency } from '@/types/database'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface WalletData {
  balance_usdt: number
  balance_btc: number
  balance_eth: number
  total_profit: number
  total_invested: number
}

interface CryptoWalletData {
  currency: Currency
  network: string
  address: string
  label: string
  is_active: boolean
}

interface Transaction {
  id: string
  type: string
  amount: number
  currency: string
  status: string
  tx_hash?: string
  created_at: string
  note?: string
  metadata?: {
    from_currency?: string
    to_currency?: string
    from_amount?: number
    to_amount?: number
    rate?: number
  }
}

const TX_PER_PAGE = 10

const txCfg: Record<string, { icon: typeof ArrowDownRight; bg: string; color: string; sign: string; label: string }> = {
  deposit:     { icon: ArrowDownRight,  bg: 'bg-green-100',  color: 'text-green-600',  sign: '+', label: 'Deposit' },
  withdrawal:  { icon: ArrowUpRight,    bg: 'bg-red-100',    color: 'text-red-600',    sign: '-', label: 'Withdrawal' },
  profit:      { icon: TrendingUp,      bg: 'bg-blue-100',   color: 'text-blue-600',   sign: '+', label: 'Profit' },
  copy_profit: { icon: TrendingUp,      bg: 'bg-blue-100',   color: 'text-blue-600',   sign: '+', label: 'Copy Profit' },
  copy_earning:{ icon: TrendingUp,      bg: 'bg-blue-100',   color: 'text-blue-600',   sign: '+', label: 'Copy Profit' },
  fee:         { icon: TrendingDown,    bg: 'bg-slate-100',  color: 'text-slate-600',  sign: '-', label: 'Fee' },
  referral:    { icon: Gift,            bg: 'bg-purple-100', color: 'text-purple-600', sign: '+', label: 'Referral Bonus' },
  swap:        { icon: ArrowLeftRight,  bg: 'bg-violet-100', color: 'text-violet-600', sign: '',  label: 'Swap' },
}

function statusPill(status: string) {
  const cfg: Record<string, string> = {
    confirmed:  'bg-green-100 text-green-700',
    completed:  'bg-green-100 text-green-700',
    pending:    'bg-yellow-100 text-yellow-700',
    failed:     'bg-red-100 text-red-700',
    cancelled:  'bg-red-100 text-red-700',
    processing: 'bg-blue-100 text-blue-700',
  }
  return cfg[status] ?? 'bg-slate-100 text-slate-600'
}

export default function WalletPage() {
  const { profile } = useAuth()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWalletData[]>([])
  const [txs, setTxs] = useState<Transaction[]>([])
  const [txLoading, setTxLoading] = useState(true)
  const [txFilter, setTxFilter] = useState('all')
  const [txPage, setTxPage] = useState(1)

  const [depositModal, setDepositModal] = useState(false)
  const [withdrawModal, setWithdrawModal] = useState(false)
  const [currency, setCurrency] = useState<Currency>('USDT')
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [addressError, setAddressError] = useState('')
  const [txHash, setTxHash] = useState('')
  const [processing, setProcessing] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [depositNetwork, setDepositNetwork] = useState('')

  // Withdrawal verification
  const [withdrawSent,      setWithdrawSent]      = useState(false)  // step 2: code entry
  const [withdrawVerified,  setWithdrawVerified]  = useState(false)  // step 3: success
  const [verifyCode,        setVerifyCode]        = useState('')      // 6-digit input
  const [verifyingCode,     setVerifyingCode]     = useState(false)
  const [codeError,         setCodeError]         = useState('')
  const [sendingWithdraw,   setSendingWithdraw]   = useState(false)
  const [emailDelivered,    setEmailDelivered]    = useState(true)   // false → show inline code
  const [inlineCode,        setInlineCode]        = useState('')     // fallback code when email fails
  // Receipt upload
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)

  // Crypto swap
  const [swapModal, setSwapModal]           = useState(false)
  const [swapFrom, setSwapFrom]             = useState<Currency>('USDT')
  const [swapTo, setSwapTo]                 = useState<Currency>('BTC')
  const [swapFromAmount, setSwapFromAmount] = useState('')

  // Refresh state
  const [refreshing, setRefreshing] = useState(false)

  // ── Fetch helpers (called on mount AND by the polling interval) ──
  const fetchWallet = async (uid: string) => {
    const { data } = await supabase.from('wallets').select('*').eq('user_id', uid).single()
    if (data) setWallet(data as unknown as WalletData)
  }

  const fetchTxs = async (uid: string) => {
    const { data } = await supabase
      .from('transactions').select('*').eq('user_id', uid)
      .order('created_at', { ascending: false }).limit(200)
    if (data) { setTxs(data as Transaction[]); setTxLoading(false) }
  }

  const refreshAll = async () => {
    if (!profile) return
    setRefreshing(true)
    await Promise.all([fetchWallet(profile.id), fetchTxs(profile.id)])
    setRefreshing(false)
  }

  useEffect(() => {
    if (!profile) return

    // ── Initial load ────────────────────────────────────────────
    fetchWallet(profile.id)
    fetchTxs(profile.id)
    supabase.from('crypto_wallets').select('*').eq('is_active', true)
      .then(({ data }) => { if (data) setCryptoWallets(data as unknown as CryptoWalletData[]) })

    // ── Poll every 15 s so balance reflects admin approval even
    //    if realtime is not enabled on the project ──────────────
    const pollId = window.setInterval(() => {
      fetchWallet(profile.id)
      fetchTxs(profile.id)
    }, 15_000)

    // ── Realtime (bonus — fires instantly if publication is set up) ─
    const walletChannel = supabase
      .channel(`wallet:${profile.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${profile.id}` },
        payload => { setWallet(payload.new as unknown as WalletData) })
      .subscribe()

    const txChannel = supabase
      .channel(`tx:${profile.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions', filter: `user_id=eq.${profile.id}` },
        payload => { setTxs(prev => [payload.new as Transaction, ...prev]) })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions', filter: `user_id=eq.${profile.id}` },
        payload => { setTxs(prev => prev.map(t => t.id === (payload.new as Transaction).id ? payload.new as Transaction : t)) })
      .subscribe()

    return () => {
      window.clearInterval(pollId)
      supabase.removeChannel(walletChannel)
      supabase.removeChannel(txChannel)
    }
  }, [profile?.id])

  const depositAddress = cryptoWallets.find(w =>
    w.currency === currency && (depositNetwork ? w.network === depositNetwork : true)
  ) ?? cryptoWallets.find(w => w.currency === currency)

  const availableNetworks = cryptoWallets
    .filter(w => w.currency === currency)
    .map(w => ({ value: w.network, label: w.network }))

  const copyAddress = () => {
    if (depositAddress?.address) {
      navigator.clipboard.writeText(depositAddress.address)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2500)
      toast.success('Address copied!')
    }
  }

  const handleAddressChange = (val: string) => {
    setAddress(val)
    if (!val) { setAddressError(''); return }
    const { valid, error } = validateCryptoAddress(val, currency)
    setAddressError(valid ? '' : (error ?? 'Invalid address'))
  }

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return }
    setReceiptFile(file)
    const reader = new FileReader()
    reader.onload = ev => setReceiptPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const uploadReceipt = async (txId: string): Promise<string | null> => {
    if (!receiptFile || !profile) return null
    setUploadingReceipt(true)
    try {
      const ext = receiptFile.name.split('.').pop() ?? 'jpg'
      const path = `${profile.id}/${txId}.${ext}`
      const { error } = await supabase.storage.from('receipts').upload(path, receiptFile, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('receipts').getPublicUrl(path)
      return data.publicUrl
    } catch {
      return null
    } finally {
      setUploadingReceipt(false)
    }
  }

  const handleDeposit = async () => {
    if (!profile || !amount) return
    setProcessing(true)
    try {
      // Insert transaction first to get its ID
      const { data: tx, error: txErr } = await supabase.from('transactions').insert({
        user_id: profile.id,
        type: 'deposit',
        amount: parseFloat(amount),
        currency,
        status: 'pending',
        tx_hash: txHash.trim() || null,
        network: depositAddress?.network,
        note: 'User deposit submission — pending admin confirmation',
        created_at: new Date().toISOString(),
      } as any).select().single()
      if (txErr) throw txErr

      // Upload receipt if attached
      if (receiptFile && tx) {
        const receiptUrl = await uploadReceipt(tx.id)
        if (receiptUrl) {
          await supabase.from('transactions').update({ receipt_url: receiptUrl } as any).eq('id', tx.id)
        }
      }

      toast.success('Deposit submitted! Our team will confirm within 1–4 hours.')
      setDepositModal(false)
      setAmount('')
      setTxHash('')
      setReceiptFile(null)
      setReceiptPreview(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const closeWithdrawModal = () => {
    setWithdrawModal(false)
    setWithdrawSent(false)
    setWithdrawVerified(false)
    setVerifyCode('')
    setCodeError('')
    setAmount('')
    setAddress('')
    setAddressError('')
    setEmailDelivered(true)
    setInlineCode('')
  }

  const submitCode = async () => {
    const trimmed = verifyCode.replace(/\s/g, '')
    if (trimmed.length !== 6) { setCodeError('Enter the 6-digit code from your email'); return }
    setVerifyingCode(true)
    setCodeError('')
    try {
      await invokeFunction('verify-withdrawal-code', { code: trimmed })
      setWithdrawVerified(true)
      toast.success('Withdrawal confirmed! It will be processed within 24 hours.')
      fetchWallet(profile!.id)
      fetchTxs(profile!.id)
    } catch (err: any) {
      setCodeError(err.message ?? 'Invalid or expired code')
    } finally {
      setVerifyingCode(false)
    }
  }

  const initiateWithdrawal = async () => {
    if (!address || !amount) { toast.error('Fill in all fields'); return }
    const { valid, error } = validateCryptoAddress(address, currency)
    if (!valid) { toast.error(error ?? 'Invalid wallet address'); return }
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return }

    // Check KYC
    if (profile?.kyc_status !== 'verified') {
      toast.error('KYC verification required before withdrawals. Please complete your identity verification.')
      return
    }

    // Check wallet balance (frontend guard — backend also checks)
    const available =
      currency === 'USDT' ? (wallet?.balance_usdt ?? 0) :
      currency === 'BTC'  ? (wallet?.balance_btc  ?? 0) :
                            (wallet?.balance_eth  ?? 0)
    if (amt > available) {
      toast.error(`Insufficient balance. Available: ${available.toFixed(8)} ${currency}`)
      return
    }

    setSendingWithdraw(true)
    try {
      const result = await invokeFunction<{
        tx_id: string; code: string; expires_mins: number; email_delivered: boolean
      }>('send-withdrawal-verification', {
        amount: amt, currency, address: address.trim(), network: detectedNetwork ?? undefined,
      })
      const delivered = result?.email_delivered !== false
      setEmailDelivered(delivered)
      if (result?.code) {
        setInlineCode(result.code)
        setVerifyCode(result.code) // pre-fill so user just clicks Confirm
      }
      setWithdrawSent(true)
      toast.success(delivered
        ? `Code sent to ${profile!.email ?? 'your email'} and shown below`
        : 'Your verification code is shown below — enter it to confirm'
      )
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to initiate withdrawal')
    } finally {
      setSendingWithdraw(false)
    }
  }

  // ── Crypto Swap ───────────────────────────────────────────────
  // Approximate USD rates — used for rate calculation only (not financial advice)
  const CRYPTO_RATES: Record<Currency, number> = { USDT: 1, BTC: 65000, ETH: 3500 }
  const SWAP_FEE = 0.005 // 0.5%

  const getSwapRate = (from: Currency, to: Currency) => CRYPTO_RATES[from] / CRYPTO_RATES[to]

  const swapFromAmt    = parseFloat(swapFromAmount) || 0
  const swapReceiveAmt = swapFromAmt > 0 ? swapFromAmt * getSwapRate(swapFrom, swapTo) * (1 - SWAP_FEE) : 0
  const swapAvail      = swapFrom === 'USDT' ? wallet?.balance_usdt : swapFrom === 'BTC' ? wallet?.balance_btc : wallet?.balance_eth
  const swapInsufficient = swapFromAmt > 0 && swapFromAmt > (swapAvail ?? 0)

  const flipSwap = () => {
    const prev = swapFrom
    setSwapFrom(swapTo)
    setSwapTo(prev)
    setSwapFromAmount('')
  }

  const openSwapModal = (from: Currency) => {
    setSwapFrom(from)
    setSwapTo(from === 'USDT' ? 'BTC' : from === 'BTC' ? 'USDT' : 'USDT')
    setSwapFromAmount('')
    setSwapModal(true)
  }

  const handleSwap = async () => {
    if (!profile) return
    if (isNaN(swapFromAmt) || swapFromAmt <= 0) { toast.error('Enter a valid amount'); return }
    if (swapInsufficient) { toast.error(`Insufficient ${swapFrom} balance`); return }

    const toAmt = Number(swapReceiveAmt.toFixed(8))

    setProcessing(true)
    try {
      const { error } = await supabase.rpc('process_crypto_swap', {
        p_user_id:      profile.id,
        p_from_currency: swapFrom,
        p_to_currency:   swapTo,
        p_from_amount:   swapFromAmt,
        p_to_amount:     toAmt,
        p_rate:          getSwapRate(swapFrom, swapTo),
      })
      if (error) throw error

      const displayTo = swapTo === 'USDT' ? toAmt.toFixed(2) : toAmt.toFixed(6)
      toast.success(`Swapped ${swapFromAmt} ${swapFrom} → ${displayTo} ${swapTo}`)
      setSwapModal(false)
      setSwapFromAmount('')

      // Refresh wallet & transactions
      supabase.from('wallets').select('*').eq('user_id', profile.id).single()
        .then(({ data }) => { if (data) setWallet(data as unknown as WalletData) })
      supabase.from('transactions').select('*').eq('user_id', profile.id)
        .order('created_at', { ascending: false }).limit(200)
        .then(({ data }) => { if (data) setTxs(data as Transaction[]) })
    } catch (err: any) {
      toast.error(err.message ?? 'Swap failed')
    } finally {
      setProcessing(false)
    }
  }

  const balances = [
    { currency: 'USDT' as Currency, balance: wallet?.balance_usdt ?? 0, icon: '💵', color: 'from-green-500 to-emerald-600', usd: wallet?.balance_usdt ?? 0 },
    { currency: 'BTC' as Currency,  balance: wallet?.balance_btc ?? 0,  icon: '₿',  color: 'from-orange-500 to-amber-600', usd: (wallet?.balance_btc ?? 0) * 65000 },
    { currency: 'ETH' as Currency,  balance: wallet?.balance_eth ?? 0,  icon: 'Ξ',  color: 'from-purple-500 to-violet-600', usd: (wallet?.balance_eth ?? 0) * 3500 },
  ]

  const totalUSD = balances.reduce((s, b) => s + b.usd, 0)
  const detectedNetwork = address ? detectNetworkFromAddress(address) : null

  // Transaction filtering & pagination
  const filteredTxs = txs.filter(tx => {
    if (txFilter === 'all')        return true
    if (txFilter === 'deposit')    return tx.type === 'deposit'
    if (txFilter === 'withdrawal') return tx.type === 'withdrawal'
    if (txFilter === 'profit')     return tx.type === 'profit' || tx.type === 'copy_profit' || tx.type === 'copy_earning'
    if (txFilter === 'swap')       return tx.type === 'swap'
    if (txFilter === 'fee')        return tx.type === 'fee'
    return true
  })

  const totalPages = Math.ceil(filteredTxs.length / TX_PER_PAGE)
  const paginatedTxs = filteredTxs.slice((txPage - 1) * TX_PER_PAGE, txPage * TX_PER_PAGE)

  const txFilterBtns = [
    { key: 'all',        label: 'All' },
    { key: 'deposit',    label: 'Deposits' },
    { key: 'withdrawal', label: 'Withdrawals' },
    { key: 'profit',     label: 'Profits' },
    { key: 'swap',       label: 'Swaps' },
    { key: 'fee',        label: 'Fees' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>

      {/* Total balance hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] rounded-2xl p-6 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-12 -translate-x-12" />
        <div className="flex items-center justify-between">
          <p className="text-blue-100 text-sm">Total Portfolio Value</p>
          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh balances"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <p className="text-4xl font-black mt-1 mb-6">{formatCurrency(totalUSD)}</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setDepositModal(true)} className="bg-white text-[#1E40AF] hover:bg-blue-50">
            <ArrowDownToLine className="w-4 h-4" /> Deposit
          </Button>
          <Button onClick={() => setWithdrawModal(true)} variant="outline" className="border-white text-white hover:bg-white/15">
            <ArrowUpFromLine className="w-4 h-4" /> Withdraw
          </Button>
          <Button onClick={() => openSwapModal('USDT')} variant="outline" className="border-white text-white hover:bg-white/15">
            <ArrowLeftRight className="w-4 h-4" /> Swap
          </Button>
        </div>
      </motion.div>

      {/* Crypto balance cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {balances.map((b, i) => (
          <motion.div key={b.currency} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card hover className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${b.color} opacity-10 -translate-y-8 translate-x-8`} />
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${b.color} flex items-center justify-center text-white text-xl font-bold`}>
                  {b.icon}
                </div>
                <p className="font-bold text-slate-900">{b.currency}</p>
              </div>
              <p className="text-2xl font-black text-slate-900">
                {b.balance.toFixed(b.currency === 'USDT' ? 2 : 6)}
              </p>
              <p className="text-sm text-slate-500 mt-1">≈ {formatCurrency(b.usd)}</p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1"
                  onClick={() => { setCurrency(b.currency); setDepositModal(true) }}>
                  Deposit
                </Button>
                <Button size="sm" variant="ghost" className="flex-1"
                  onClick={() => { setCurrency(b.currency); setWithdrawModal(true) }}>
                  Withdraw
                </Button>
                <Button size="sm" variant="ghost" className="px-2.5"
                  title={`Swap ${b.currency}`}
                  onClick={() => openSwapModal(b.currency)}>
                  <ArrowLeftRight className="w-3.5 h-3.5 text-violet-600" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Profit summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm text-slate-500 mb-1">Total Profit Earned</p>
          <p className="text-3xl font-black text-green-600">{formatCurrency(wallet?.total_profit ?? 0)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500 mb-1">Total Invested</p>
          <p className="text-3xl font-black text-[#1E40AF]">{formatCurrency(wallet?.total_invested ?? 0)}</p>
        </Card>
      </div>

      {/* ── Transaction History ── */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h3 className="font-bold text-slate-900">Transaction History</h3>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {txFilterBtns.map(btn => (
              <button
                key={btn.key}
                onClick={() => { setTxFilter(btn.key); setTxPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  txFilter === btn.key ? 'bg-white text-[#1E40AF] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {txLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : paginatedTxs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">No transactions in this category yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Date', 'Type', 'Currency', 'Amount', 'Status', 'Tx Hash'].map(col => (
                      <th key={col} className="text-left pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide pr-4 first:pl-1">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedTxs.map((tx, i) => {
                    const cfg = txCfg[tx.type] ?? txCfg.deposit
                    const Icon = cfg.icon
                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-slate-50/50"
                      >
                        <td className="py-3 pr-4 pl-1 text-slate-500 whitespace-nowrap">
                          {format(new Date(tx.created_at), 'MMM d, yyyy')}
                          <br />
                          <span className="text-xs text-slate-400">{format(new Date(tx.created_at), 'HH:mm')}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                            </div>
                            <span className="font-medium text-slate-700 whitespace-nowrap">{cfg.label}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{tx.currency}</span>
                        </td>
                        <td className={`py-3 pr-4 font-bold whitespace-nowrap ${cfg.color}`}>
                          {tx.type === 'swap' && tx.metadata?.to_currency ? (
                            <span className="text-violet-600">
                              {tx.metadata.from_amount} {tx.metadata.from_currency}
                              <span className="text-slate-400 font-normal mx-1">→</span>
                              {tx.metadata.to_currency === 'USDT'
                                ? Number(tx.metadata.to_amount).toFixed(2)
                                : Number(tx.metadata.to_amount).toFixed(6)
                              } {tx.metadata.to_currency}
                            </span>
                          ) : (
                            <>{cfg.sign}{formatCurrency(tx.amount)}</>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusPill(tx.status)}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 pr-1">
                          {tx.tx_hash ? (
                            <a
                              href="#"
                              className="flex items-center gap-1 text-xs text-[#3B82F6] hover:text-[#1E40AF] font-mono"
                              title={tx.tx_hash}
                            >
                              {tx.tx_hash.slice(0, 6)}…{tx.tx_hash.slice(-4)}
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                <p className="text-xs text-slate-500">
                  Showing {(txPage - 1) * TX_PER_PAGE + 1}–{Math.min(txPage * TX_PER_PAGE, filteredTxs.length)} of {filteredTxs.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTxPage(p => Math.max(1, p - 1))}
                    disabled={txPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-700 font-medium">{txPage} / {totalPages}</span>
                  <button
                    onClick={() => setTxPage(p => Math.min(totalPages, p + 1))}
                    disabled={txPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── Deposit Modal ── */}
      <Modal open={depositModal} onClose={() => setDepositModal(false)} title="Deposit Crypto" size="md">
        <div className="space-y-4">
          <Select
            label="Select Currency"
            options={[
              { value: 'USDT', label: 'USDT' },
              { value: 'BTC', label: 'Bitcoin (BTC)' },
              { value: 'ETH', label: 'Ethereum (ETH)' },
            ]}
            value={currency}
            onChange={e => { setCurrency(e.target.value as Currency); setTxHash(''); setAmount(''); setDepositNetwork('') }}
          />

          {availableNetworks.length > 1 && (
            <Select
              label="Select Network"
              options={availableNetworks}
              value={depositNetwork || availableNetworks[0]?.value}
              onChange={e => setDepositNetwork(e.target.value)}
            />
          )}

          {depositAddress ? (
            <div className="space-y-3">
              {/* QR Code */}
              <div className="flex flex-col items-center gap-3 bg-slate-50 rounded-xl p-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(depositAddress.address)}&size=180x180&margin=10&bgcolor=ffffff`}
                  alt={`${currency} deposit QR code`}
                  className="w-40 h-40 rounded-xl border border-slate-200"
                  loading="lazy"
                />
                <p className="text-xs text-slate-500 text-center">
                  Scan with your wallet app to deposit <strong>{currency}</strong>
                  {depositAddress.network && <> via <strong>{depositAddress.network}</strong></>}
                </p>
              </div>

              {/* Address */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-600">
                    Network: <span className="text-slate-800 font-semibold">{depositAddress.network}</span>
                  </p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Send <strong>{currency} only</strong> to this address:</p>
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2.5 border border-slate-200">
                  <code className="text-xs text-slate-700 flex-1 break-all font-mono">{depositAddress.address}</code>
                  <button onClick={copyAddress} className="flex-shrink-0 text-[#3B82F6] hover:text-[#1E40AF] transition-colors">
                    {copiedAddress ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-yellow-50 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700">
                  <strong>Only send {currency} on the {depositAddress.network} network.</strong> Wrong tokens or networks result in permanent loss.
                </p>
              </div>

              <Input label="Amount Sent" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
              <Input
                label="Transaction Hash (TX ID)"
                placeholder="Paste your transaction hash..."
                value={txHash}
                onChange={e => setTxHash(e.target.value.trim())}
                hint="Find this in your wallet's transaction history"
              />

              {/* Receipt upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Payment Receipt <span className="text-slate-400 font-normal">(optional but speeds up confirmation)</span>
                </label>
                {receiptPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img src={receiptPreview} alt="Receipt preview" className="w-full max-h-48 object-contain bg-slate-50" />
                    <button
                      onClick={() => { setReceiptFile(null); setReceiptPreview(null) }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-xs text-slate-500 text-center py-2 bg-slate-50 border-t border-slate-200">
                      <ImageIcon className="w-3 h-3 inline mr-1" />{receiptFile?.name}
                    </p>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-5 cursor-pointer hover:border-[#3B82F6] hover:bg-blue-50/40 transition-all group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#3B82F6] transition-colors" />
                    <span className="text-sm text-slate-500 group-hover:text-[#1E40AF] transition-colors text-center">
                      Click to upload screenshot or photo of payment receipt
                    </span>
                    <span className="text-xs text-slate-400">PNG, JPG, PDF · Max 10 MB</span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleReceiptChange} />
                  </label>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setDepositModal(false); setReceiptFile(null); setReceiptPreview(null) }} className="flex-1">Cancel</Button>
                <Button onClick={handleDeposit} loading={processing || uploadingReceipt} disabled={!amount} className="flex-1">
                  Submit Deposit
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No deposit address configured for {currency}.</p>
              <p className="text-xs text-slate-400 mt-1">Contact support to set one up.</p>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Withdraw Modal ── */}
      <Modal
        open={withdrawModal}
        onClose={closeWithdrawModal}
        title={withdrawVerified ? 'Withdrawal Confirmed' : withdrawSent ? 'Enter Verification Code' : 'Withdraw Crypto'}
      >
        {withdrawVerified ? (
          /* ── Step 3: Success ── */
          <div className="space-y-5 text-center py-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto"
            >
              <CheckCircle className="w-10 h-10 text-green-500" />
            </motion.div>
            <div>
              <p className="text-xl font-bold text-slate-900">Withdrawal Confirmed!</p>
              <p className="text-sm text-slate-500 mt-1.5">Your request has been submitted and will be processed within 24 hours.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-left text-sm space-y-2">
              <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="font-semibold">{amount} {currency}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-400 flex-shrink-0">Address</span><span className="font-mono text-xs text-slate-700 break-all text-right">{address}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Status</span><span className="text-amber-600 font-medium">Pending Review</span></div>
            </div>
            <Button onClick={closeWithdrawModal} className="w-full">Done</Button>
          </div>

        ) : withdrawSent ? (
          /* ── Step 2: Code entry ── */
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-[#3B82F6]" />
              </div>
              <p className="font-semibold text-slate-900 text-lg">Verify your withdrawal</p>
              <p className="text-sm text-slate-500 mt-1">
                Use the code below to confirm.
                {emailDelivered && <> A copy was also sent to <span className="font-medium text-slate-700">{profile?.email}</span>.</>}
              </p>
            </div>

            {/* Verification code — always shown prominently */}
            {inlineCode && (
              <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5 text-center">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Your Verification Code</p>
                <p className="text-4xl font-black text-green-800 tracking-[0.5em] font-mono select-all">{inlineCode}</p>
                <p className="text-xs text-green-600 mt-2">Enter this code in the field below — expires in 30 minutes</p>
              </div>
            )}

            {/* Code input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 text-center">
                Enter the 6-digit code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="_ _ _ _ _ _"
                value={verifyCode}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setVerifyCode(v)
                  setCodeError('')
                }}
                onKeyDown={e => e.key === 'Enter' && submitCode()}
                className={`w-full text-center text-3xl font-mono font-bold tracking-[0.5em] py-4 px-3 border-2 rounded-2xl outline-none transition-colors ${
                  codeError
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : verifyCode.length === 6
                    ? 'border-green-400 bg-green-50 text-green-800'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-[#3B82F6]'
                }`}
                autoFocus
              />
              {codeError && (
                <p className="text-xs text-red-500 text-center mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {codeError}
                </p>
              )}
            </div>

            {/* Withdrawal summary */}
            <div className="bg-slate-50 rounded-xl p-3.5 text-sm space-y-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Withdrawal Details</p>
              <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="font-semibold">{amount} {currency}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-400 flex-shrink-0">Address</span><span className="font-mono text-xs text-slate-700 break-all text-right">{address}</span></div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-700">
                <strong>Code expires in 30 minutes.</strong> Do not share this code with anyone.
                Oakmont Ridge will never ask for your code.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={closeWithdrawModal} className="flex-1">Cancel</Button>
              <Button
                onClick={submitCode}
                loading={verifyingCode}
                disabled={verifyCode.length !== 6}
                className="flex-1"
              >
                <Shield className="w-4 h-4" /> Confirm Withdrawal
              </Button>
            </div>
          </div>

        ) : (
          /* ── Step 1: Withdrawal form ── */
          <div className="space-y-4">
            {profile?.kyc_status !== 'verified' && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <strong>KYC required.</strong> You must complete identity verification before making withdrawals.{' '}
                  <a href="/kyc" className="underline font-semibold">Verify now →</a>
                </p>
              </div>
            )}

            <Select
              label="Select Currency"
              options={[
                { value: 'USDT', label: 'USDT' },
                { value: 'BTC', label: 'Bitcoin (BTC)' },
                { value: 'ETH', label: 'Ethereum (ETH)' },
              ]}
              value={currency}
              onChange={e => { setCurrency(e.target.value as Currency); setAddress(''); setAddressError('') }}
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">Amount</label>
                <button
                  className="text-xs text-[#3B82F6] font-medium hover:text-[#1E40AF]"
                  onClick={() => {
                    const max = currency === 'USDT' ? wallet?.balance_usdt : currency === 'BTC' ? wallet?.balance_btc : wallet?.balance_eth
                    setAmount((max ?? 0).toString())
                  }}
                >
                  Max
                </button>
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                hint={`Available: ${
                  currency === 'USDT' ? (wallet?.balance_usdt ?? 0).toFixed(2) :
                  currency === 'BTC'  ? (wallet?.balance_btc ?? 0).toFixed(6) :
                  (wallet?.balance_eth ?? 0).toFixed(6)
                } ${currency}`}
              />
            </div>

            <div>
              <Input
                label={`Your ${currency} Wallet Address`}
                placeholder={`Enter your ${currency} wallet address`}
                value={address}
                onChange={e => handleAddressChange(e.target.value)}
                error={addressError}
              />
              {detectedNetwork && !addressError && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Detected network: {detectedNetwork}
                </p>
              )}
            </div>

            <div className="flex items-start gap-2 bg-yellow-50 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-700 space-y-0.5">
                <p><strong>Withdrawals require email confirmation.</strong></p>
                <p>A 6-digit verification code will be sent to your registered email. Enter it here to confirm.</p>
                <p>Ensure your address is correct — transactions cannot be reversed.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={closeWithdrawModal} className="flex-1">Cancel</Button>
              <Button
                onClick={initiateWithdrawal}
                loading={sendingWithdraw}
                disabled={!!addressError || !address || !amount || profile?.kyc_status !== 'verified'}
                className="flex-1"
              >
                <Shield className="w-4 h-4" /> Send Confirmation Email
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Swap Modal ── */}
      <Modal
        open={swapModal}
        onClose={() => { setSwapModal(false); setSwapFromAmount('') }}
        title="Swap Crypto"
        size="sm"
      >
        <div className="space-y-4">

          {/* Info banner */}
          <div className="flex items-start gap-2 bg-violet-50 border border-violet-100 rounded-xl p-3">
            <RefreshCw className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-violet-700">
              Exchange between USDT, BTC, and ETH instantly. A <strong>0.5%</strong> conversion fee applies.
            </p>
          </div>

          {/* From */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">You Send</p>
            <div className="flex items-center gap-3">
              <select
                value={swapFrom}
                onChange={e => {
                  const val = e.target.value as Currency
                  setSwapFrom(val)
                  if (val === swapTo) setSwapTo(val === 'USDT' ? 'BTC' : 'USDT')
                  setSwapFromAmount('')
                }}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300 w-24 flex-shrink-0"
              >
                <option value="USDT">USDT</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
              <div className="relative flex-1">
                <input
                  type="number"
                  placeholder="0.00"
                  value={swapFromAmount}
                  onChange={e => setSwapFromAmount(e.target.value)}
                  className={`w-full text-right text-lg font-bold bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 transition-colors ${
                    swapInsufficient ? 'border-red-300 text-red-600' : 'border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className={`text-xs ${swapInsufficient ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                Available: {swapFrom === 'USDT'
                  ? (wallet?.balance_usdt ?? 0).toFixed(2)
                  : swapFrom === 'BTC'
                  ? (wallet?.balance_btc ?? 0).toFixed(6)
                  : (wallet?.balance_eth ?? 0).toFixed(6)
                } {swapFrom}
                {swapInsufficient && ' — Insufficient balance'}
              </p>
              <button
                className="text-xs text-violet-600 font-semibold hover:text-violet-800"
                onClick={() => setSwapFromAmount((swapAvail ?? 0).toString())}
              >
                Max
              </button>
            </div>
          </div>

          {/* Flip button */}
          <div className="flex justify-center">
            <button
              onClick={flipSwap}
              className="w-10 h-10 rounded-full bg-white border-2 border-violet-100 flex items-center justify-center hover:bg-violet-50 hover:border-violet-300 transition-all shadow-sm"
              title="Flip currencies"
            >
              <ArrowLeftRight className="w-4 h-4 text-violet-600" />
            </button>
          </div>

          {/* To */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">You Receive</p>
            <div className="flex items-center gap-3">
              <select
                value={swapTo}
                onChange={e => {
                  const val = e.target.value as Currency
                  setSwapTo(val)
                  if (val === swapFrom) setSwapFrom(val === 'USDT' ? 'BTC' : 'USDT')
                }}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300 w-24 flex-shrink-0"
              >
                <option value="USDT">USDT</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
              <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-right">
                <p className={`text-lg font-bold ${swapReceiveAmt > 0 ? 'text-green-600' : 'text-slate-300'}`}>
                  {swapReceiveAmt > 0
                    ? swapTo === 'USDT' ? swapReceiveAmt.toFixed(2) : swapReceiveAmt.toFixed(6)
                    : '0.00'}
                </p>
              </div>
            </div>
            {swapReceiveAmt > 0 && (
              <p className="text-xs text-slate-400">
                ≈ {formatCurrency(swapReceiveAmt * CRYPTO_RATES[swapTo])}
              </p>
            )}
          </div>

          {/* Rate & fee info */}
          {swapFromAmt > 0 && !swapInsufficient && (
            <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Exchange Rate</span>
                <span className="font-medium text-slate-700">
                  1 {swapFrom} = {getSwapRate(swapFrom, swapTo).toFixed(swapTo === 'USDT' ? 2 : 6)} {swapTo}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Network Fee (0.5%)</span>
                <span className="font-medium text-slate-700">
                  {(swapFromAmt * SWAP_FEE).toFixed(swapFrom === 'USDT' ? 2 : 6)} {swapFrom}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-1.5 mt-1">
                <span className="font-semibold text-slate-700">You receive</span>
                <span className="font-bold text-green-600">
                  {swapTo === 'USDT' ? swapReceiveAmt.toFixed(2) : swapReceiveAmt.toFixed(6)} {swapTo}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setSwapModal(false); setSwapFromAmount('') }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSwap}
              loading={processing}
              disabled={!swapFromAmount || swapFromAmt <= 0 || swapInsufficient}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
            >
              <ArrowLeftRight className="w-4 h-4" /> Confirm Swap
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
