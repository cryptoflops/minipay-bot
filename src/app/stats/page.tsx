"use client";

import { useState, useEffect, useCallback } from "react";
import { createPublicClient, http, formatUnits } from "viem";
import { celo } from "viem/chains";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  Wallet,
  BarChart3,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { AGENT_ADDRESS, ERC8004, AGENT_VERSION, AGENT_NAME } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Token config
// ---------------------------------------------------------------------------
const USDM_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as const;
const USDC_ADDRESS = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as const;
const USDT_ADDRESS = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as const;

const BALANCE_ABI = [{
  name: "balanceOf", type: "function", stateMutability: "view",
  inputs: [{ name: "account", type: "address" }],
  outputs: [{ name: "", type: "uint256" }],
}] as const;

const TOKENS_META = [
  { symbol: "USDm", address: USDM_ADDRESS, decimals: 18 },
  { symbol: "USDC", address: USDC_ADDRESS, decimals: 6 },
  { symbol: "USDT", address: USDT_ADDRESS, decimals: 6 },
] as const;

// ---------------------------------------------------------------------------
// Number formatting helper
// ---------------------------------------------------------------------------
function fmtNum(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Shared inline-style helpers (no Tailwind)
// ---------------------------------------------------------------------------
const cardStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "16px",
  padding: "20px",
  backdropFilter: "blur(12px)",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontFamily: "monospace",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  color: "var(--color-text-muted)",
  marginBottom: "4px",
};

const valueStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: "var(--color-text)",
};

const skeletonStyle: React.CSSProperties = {
  height: "24px",
  width: "96px",
  borderRadius: "6px",
  background: "var(--color-surface-offset, rgba(255,255,255,0.06))",
  animation: "pulse 1.5s ease-in-out infinite",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface OnChainData {
  stables: { symbol: string; balance: string; raw: number }[];
  txCount: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function StatsPage() {
  const [data, setData] = useState<OnChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [spinning, setSpinning] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setSpinning(true);

    try {
      const publicClient = createPublicClient({
        chain: celo,
        transport: http(),
      });

      const [usdmBal, usdcBal, usdtBal, txCount] = await Promise.all([
        publicClient.readContract({
          address: USDM_ADDRESS,
          abi: BALANCE_ABI,
          functionName: "balanceOf",
          args: [AGENT_ADDRESS],
        }).catch(() => 0n),
        publicClient.readContract({
          address: USDC_ADDRESS,
          abi: BALANCE_ABI,
          functionName: "balanceOf",
          args: [AGENT_ADDRESS],
        }).catch(() => 0n),
        publicClient.readContract({
          address: USDT_ADDRESS,
          abi: BALANCE_ABI,
          functionName: "balanceOf",
          args: [AGENT_ADDRESS],
        }).catch(() => 0n),
        publicClient.getTransactionCount({ address: AGENT_ADDRESS }),
      ]);

      const usdmVal = Number(formatUnits(usdmBal as bigint, 18));
      const usdcVal = Number(formatUnits(usdcBal as bigint, 6));
      const usdtVal = Number(formatUnits(usdtBal as bigint, 6));

      setData({
        stables: [
          { symbol: "USDm", balance: fmtNum(usdmVal), raw: usdmVal },
          { symbol: "USDC", balance: fmtNum(usdcVal), raw: usdcVal },
          { symbol: "USDT", balance: fmtNum(usdtVal), raw: usdtVal },
        ],
        txCount,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch on-chain stats", err);
    } finally {
      setLoading(false);
      setTimeout(() => setSpinning(false), 600);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Container animation
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.07, delayChildren: 0.1 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Pulse keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes spin-refresh {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* ---- Header ---- */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 16px",
          height: "56px",
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <Link
          href="/chat"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--color-text-muted)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 500,
            transition: "color 0.15s",
          }}
        >
          <ArrowLeft size={18} />
          <span>Back to Chat</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {lastUpdated && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--color-text-muted)",
                fontFamily: "monospace",
              }}
            >
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1px solid var(--color-border)",
              background: "transparent",
              color: "var(--color-text-muted)",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "border-color 0.15s, color 0.15s",
            }}
            title="Refresh stats"
          >
            <RefreshCw
              size={16}
              style={spinning ? { animation: "spin-refresh 0.8s linear infinite" } : undefined}
            />
          </button>
        </div>
      </header>

      {/* ---- Body ---- */}
      <motion.main
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          flex: 1,
          maxWidth: "720px",
          width: "100%",
          margin: "0 auto",
          padding: "24px 16px 64px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Page title */}
        <motion.div variants={item}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <BarChart3 size={22} style={{ color: "var(--color-celo-green)" }} />
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>
              {AGENT_NAME} Stats
            </h1>
          </div>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>
            Public on-chain analytics and app info. No wallet required.
          </p>
        </motion.div>

        {/* ================================================================ */}
        {/*  ON-CHAIN METRICS                                                */}
        {/* ================================================================ */}
        <motion.div variants={item}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Activity size={16} style={{ color: "var(--color-celo-green)" }} />
            <h2 style={{ fontSize: "14px", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              On-Chain Metrics
            </h2>
          </div>

          {/* Stablecoin balances grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            {TOKENS_META.map((t) => {
              const stableData = data?.stables.find((s) => s.symbol === t.symbol);
              return (
                <div key={t.symbol} style={cardStyle}>
                  <div style={labelStyle}>{t.symbol} Balance</div>
                  {loading ? (
                    <div style={skeletonStyle} />
                  ) : (
                    <div style={{ ...valueStyle, color: "var(--color-celo-green)" }}>
                      {stableData?.balance ?? "0.00"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tx count row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "12px",
            }}
          >
            <div style={cardStyle}>
              <div style={labelStyle}>Transactions</div>
              {loading ? (
                <div style={skeletonStyle} />
              ) : (
                <div style={valueStyle}>{fmtNum(data?.txCount ?? 0, 0)}</div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ================================================================ */}
        {/*  APP INFO                                                        */}
        {/* ================================================================ */}
        <motion.div variants={item}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Wallet size={16} style={{ color: "var(--color-celo-green)" }} />
            <h2 style={{ fontSize: "14px", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              App Info
            </h2>
          </div>

          <div style={cardStyle}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <InfoRow label="App Name" value={AGENT_NAME} />
              <InfoRow label="Version" value={AGENT_VERSION} />
              <InfoRow label="Network" value="Celo Mainnet (42220)" />
              <InfoRow
                label="Agent Address"
                value={truncateAddress(AGENT_ADDRESS)}
                href={`https://celoscan.io/address/${AGENT_ADDRESS}`}
              />
              <InfoRow
                label="Source / Docs"
                value="GitHub Repository"
                href="https://github.com/psy-hodivka/minipay-bot"
              />
            </div>
          </div>
        </motion.div>

        {/* ================================================================ */}
        {/*  PROTOCOL INFO                                                   */}
        {/* ================================================================ */}
        <motion.div variants={item}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Shield size={16} style={{ color: "var(--color-celo-green)" }} />
            <h2 style={{ fontSize: "14px", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Protocol Info
            </h2>
          </div>

          <div style={cardStyle}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <InfoRow
                label="ERC-8004 Identity Registry"
                value={truncateAddress(ERC8004.identityRegistry)}
                href={`https://celoscan.io/address/${ERC8004.identityRegistry}`}
              />
              <InfoRow
                label="ERC-8004 Reputation Registry"
                value={truncateAddress(ERC8004.reputationRegistry)}
                href={`https://celoscan.io/address/${ERC8004.reputationRegistry}`}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={labelStyle}>x402 Payment Protocol</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--color-celo-green)",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--color-celo-green)",
                      boxShadow: "0 0 8px var(--color-celo-green)",
                    }}
                  />
                  Active
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ---- Footer ---- */}
        <motion.div
          variants={item}
          style={{
            textAlign: "center",
            fontSize: "11px",
            color: "var(--color-text-muted)",
            paddingTop: "8px",
          }}
        >
          Built on Celo &middot; Powered by MiniPay
        </motion.div>
      </motion.main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InfoRow sub-component
// ---------------------------------------------------------------------------
function InfoRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "4px",
      }}
    >
      <span style={labelStyle}>{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--color-celo-green)",
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
        >
          {value}
          <ExternalLink size={12} />
        </a>
      ) : (
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text)" }}>
          {value}
        </span>
      )}
    </div>
  );
}
