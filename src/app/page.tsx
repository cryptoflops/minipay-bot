import Link from "next/link";
import { AsciiBackground } from "@/components/AsciiBackground";
import { ArrowRight, Hexagon, MessageSquare, Wallet, ArrowLeftRight, Shield, History } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Top Navigation */}
      <header className="flex justify-between items-center w-full px-4 md:px-8 h-[56px] bg-surface/90 backdrop-blur-md border-b border-border fixed top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Two-node chain SVG logo */}
          <svg viewBox="0 0 160 32" className="h-[18px] w-auto text-text" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="MiniPayBot">
            <circle cx="8" cy="16" r="6" fill="var(--color-celo-green)"/>
            <line x1="14" y1="16" x2="26" y2="16" stroke="var(--color-celo-green)" strokeWidth="2.5"/>
            <circle cx="30" cy="16" r="5" stroke="var(--color-celo-green)" strokeWidth="2.5"/>
            <text x="42" y="21" fontFamily="inherit" fontWeight="700" fontSize="16" fill="currentColor">
              MiniPay<tspan fill="var(--color-celo-green)">Bot</tspan>
            </text>
          </svg>
        </div>
        <div>
          <Link
            href="/chat"
            className="text-[13px] font-semibold text-[var(--color-celo-green)] hover:bg-[var(--color-surface-offset)] transition-colors px-4 py-2 rounded-full border border-border flex items-center gap-2 active:scale-95 duration-100"
          >
            Try MiniPayBot <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Ascii Shader Background */}
      <AsciiBackground />

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col px-6 md:px-8 max-w-6xl mx-auto w-full pt-[88px] md:pt-[120px] pb-24 gap-16 md:gap-24 relative z-10">
        {/* Hero Section */}
        <section className="flex flex-col items-start max-w-3xl gap-6">
          <div className="flex items-center gap-2 text-xs font-mono text-text-muted px-3 py-1.5 bg-[var(--color-surface-offset)] border border-border rounded-full">
            <span className="w-2 h-2 rounded-full bg-[var(--color-celo-green)] animate-pulse"></span>
            Celo Mainnet · Live
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-text leading-tight tracking-tight">
            Your money, in plain language.
          </h1>
          <p className="text-lg md:text-xl text-text-muted max-w-2xl leading-relaxed">
            Interact with the Celo ecosystem entirely through natural conversation. Send funds, swap tokens, and check balances without ever touching a complex interface.
          </p>
          <Link
            href="/chat"
            className="mt-4 bg-[var(--color-celo-green)] text-[var(--color-bg)] font-semibold text-base px-8 py-4 rounded-full flex items-center gap-2 hover:bg-[var(--color-celo-green-hover)] transition-colors"
          >
            Try MiniPayBot <ArrowRight size={18} />
          </Link>

          {/* Trust Row */}
          <div className="flex flex-wrap gap-3 mt-8">
            <div className="flex items-center gap-2 text-sm text-text-muted px-4 py-2 bg-[var(--color-surface-2)] border border-border rounded-full">
              <Hexagon size={16} /> Celo Mainnet
            </div>
            <div className="flex items-center gap-2 text-sm text-text-muted px-4 py-2 bg-[var(--color-surface-2)] border border-border rounded-full">
              Gas paid in cUSD
            </div>
            <div className="flex items-center gap-2 text-sm text-text-muted px-4 py-2 bg-[var(--color-surface-2)] border border-border rounded-full">
              ERC-8004 Identity
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
          {/* Wide Card */}
          <div className="md:col-span-3 bg-surface border border-border rounded-xl p-8 flex flex-col justify-end relative overflow-hidden group hover:border-[var(--color-celo-green)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--color-celo-green)]/10">
            <div className="relative z-10 flex flex-col gap-3 max-w-xl">
              <MessageSquare className="text-[var(--color-celo-green)] mb-2" size={32} />
              <h3 className="text-2xl font-bold text-text">Conversational Transactions</h3>
              <p className="text-text-muted">Simply tell the bot "Send 5 cUSD to Alice" and it handles the rest. No complex forms or wallet addresses needed.</p>
            </div>
          </div>

          {/* Side-by-side Cards */}
          <div className="md:col-span-2 bg-surface border border-border rounded-xl p-8 flex flex-col justify-end hover:border-[var(--color-celo-green)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--color-celo-green)]/10">
            <Wallet className="text-[var(--color-celo-green)] mb-4" size={32} />
            <h3 className="text-xl font-bold text-text mb-2">Smart Portfolio</h3>
            <p className="text-text-muted">Ask "What's my balance?" to get real-time updates on your holdings across the Celo network.</p>
          </div>
          
          <div className="md:col-span-1 bg-surface border border-border rounded-xl p-8 flex flex-col justify-end hover:border-[var(--color-celo-green)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--color-celo-green)]/10">
            <ArrowLeftRight className="text-[var(--color-celo-green)] mb-4" size={32} />
            <h3 className="text-xl font-bold text-text mb-2">Instant Swaps</h3>
            <p className="text-text-muted">Seamlessly exchange tokens with minimal slippage directly in chat.</p>
          </div>

          {/* Small Cards */}
          <div className="md:col-span-1 bg-surface border border-border rounded-xl p-8 flex flex-col justify-end hover:border-[var(--color-celo-green)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--color-celo-green)]/10">
            <Shield className="text-[var(--color-celo-green)] mb-4" size={32} />
            <h3 className="text-xl font-bold text-text mb-2">Secure by Design</h3>
            <p className="text-text-muted">Non-custodial architecture ensuring you maintain full control.</p>
          </div>
          
          <div className="md:col-span-2 bg-surface border border-border rounded-xl p-8 flex flex-col justify-end hover:border-[var(--color-celo-green)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--color-celo-green)]/10">
            <History className="text-[var(--color-celo-green)] mb-4" size={32} />
            <h3 className="text-xl font-bold text-text mb-2">Human-Readable History</h3>
            <p className="text-text-muted">Review your past activities without deciphering raw transaction hashes.</p>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-border py-12 px-6 bg-surface">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          {/* Brand & Badges */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg text-text">MiniPay<span className="text-[var(--color-celo-green)]">Bot</span></span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--color-celo-green)]/10 text-[var(--color-celo-green)] uppercase tracking-wider border border-[var(--color-celo-green)]/20">Beta</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted bg-[var(--color-surface-offset)] px-3 py-1.5 rounded-full border border-border hover:border-[var(--color-celo-gold)] transition-colors">
              <Hexagon size={14} className="text-[var(--color-celo-gold)]" fill="var(--color-celo-gold)" fillOpacity={0.2} />
              <span>Built for <strong className="text-text">Celo Ecosystem</strong></span>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 text-sm text-[var(--color-text-faint)]">
            <a href="https://docs.celo.org" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-celo-green)] transition-colors">Documentation</a>
            <a href="https://github.com/cryptoflops/minipay-bot" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-celo-green)] transition-colors">GitHub</a>
            <a href="#" className="hover:text-text transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-text transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
