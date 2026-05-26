import { useEffect, useRef, memo } from 'react'

// Symbol mapping: our internal symbols → TradingView format
export const TV_SYMBOL_MAP: Record<string, string> = {
  // Crypto (Binance)
  'BTC/USD':  'BINANCE:BTCUSDT',
  'ETH/USD':  'BINANCE:ETHUSDT',
  'BNB/USD':  'BINANCE:BNBUSDT',
  'SOL/USD':  'BINANCE:SOLUSDT',
  'XRP/USD':  'BINANCE:XRPUSDT',
  'ADA/USD':  'BINANCE:ADAUSDT',
  'DOGE/USD': 'BINANCE:DOGEUSDT',
  'AVAX/USD': 'BINANCE:AVAXUSDT',
  'USDT':     'BINANCE:BTCUSDT',
  // Forex
  'EUR/USD':  'FX:EURUSD',
  'GBP/USD':  'FX:GBPUSD',
  'USD/JPY':  'FX:USDJPY',
  'AUD/USD':  'FX:AUDUSD',
  'USD/CAD':  'FX:USDCAD',
  'EUR/GBP':  'FX:EURGBP',
  'USD/CHF':  'FX:USDCHF',
  'NZD/USD':  'FX:NZDUSD',
  // Commodities
  'XAU/USD':  'TVC:GOLD',
  'XAG/USD':  'TVC:SILVER',
  'WTI/USD':  'TVC:USOIL',
  'BRN/USD':  'TVC:UKOIL',
}

interface TradingViewChartProps {
  /** Internal symbol like "BTC/USD" or a raw TradingView symbol like "BINANCE:BTCUSDT" */
  symbol?: string
  interval?: '1' | '5' | '15' | '30' | '60' | '240' | 'D' | 'W'
  theme?: 'light' | 'dark'
  /** Pixel height. Pass 0 to fill the parent container (requires parent to have explicit height). */
  height?: number
  hideTopToolbar?: boolean
  allowSymbolChange?: boolean
  className?: string
  style?: React.CSSProperties
}

function TradingViewChart({
  symbol = 'BTC/USD',
  interval = '60',
  theme = 'light',
  height = 520,
  hideTopToolbar = false,
  allowSymbolChange = true,
  className,
  style,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const tvSymbol = TV_SYMBOL_MAP[symbol] ?? symbol
  const fill = height === 0

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Clear any previous widget markup
    container.innerHTML = ''

    const innerDiv = document.createElement('div')
    innerDiv.className = 'tradingview-widget-container__widget'
    innerDiv.style.height = fill ? '100%' : `${height}px`
    innerDiv.style.width = '100%'
    container.appendChild(innerDiv)

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    // TradingView reads config from script innerHTML
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval,
      timezone: 'Etc/UTC',
      theme,
      style: '1',
      locale: 'en',
      allow_symbol_change: allowSymbolChange,
      hide_top_toolbar: hideTopToolbar,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
    })
    container.appendChild(script)

    return () => {
      if (container) container.innerHTML = ''
    }
  }, [tvSymbol, interval, theme, height, hideTopToolbar, allowSymbolChange, fill])

  return (
    <div
      ref={containerRef}
      className={`tradingview-widget-container w-full overflow-hidden ${className ?? 'rounded-xl'}`}
      style={fill ? { height: '100%', ...style } : { height, ...style }}
    />
  )
}

export default memo(TradingViewChart)
