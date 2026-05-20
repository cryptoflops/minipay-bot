"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { 
  Copy, Check, ArrowUp, MessageSquare, ExternalLink, ChevronDown, LogOut,
  User, Settings, LayoutDashboard, Sun, Moon, Trash2, Mail, 
  PlusCircle, CheckCircle, RefreshCw, AlertCircle
} from "lucide-react";

const TwitterIcon = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useMiniPay } from "@/hooks/useMiniPay";
import { useFetchWithPayment } from "thirdweb/react";
import { thirdwebClient } from "@/components/Providers";
import { createWalletClient, createPublicClient, custom, http, parseEther } from "viem";
import { celo } from "viem/chains";
import { AGENT_ADDRESS } from "@/lib/constants";

const SUGGESTIONS = [
  "Check my balance",
  "Send 0.01 cUSD to 0x000...dead",
  "What is fee abstraction?",
  "Show your agent identity",
  "What is MiniPay?",
];

const MINIPAY_DEPOSIT_URL = 'https://minipay.opera.com/add_cash';

// Reusable Interactive Address Dropdown
function AddressChip({ address, balance, onDisconnect }: { address: string; balance?: string; onDisconnect?: () => void }) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface-offset)] border border-border hover:border-[var(--color-celo-green)]/50 transition-colors group"
      >
        <div className="flex items-center gap-1.5" title="Celo Mainnet • Connected">
          <div className="w-2 h-2 rounded-full bg-[var(--color-celo-green)] animate-pulse shadow-[0_0_8px_var(--color-celo-green)]" />
        </div>
        <span className="font-mono text-[13px] text-text group-hover:text-[var(--color-celo-green)] transition-colors">{truncated}</span>
        <ChevronDown size={14} className="text-text-muted group-hover:text-[var(--color-celo-green)] transition-colors" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50 p-1"
          >
            <div className="px-3 py-2 border-b border-border mb-1 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-[var(--color-celo-green)]" />
               <span className="text-xs font-medium text-text-muted">Celo Mainnet • Connected</span>
            </div>
            
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--color-surface-offset)] transition-colors text-left group"
            >
              <div className="flex flex-col">
                <span className="text-xs text-[var(--color-text-faint)] mb-0.5">Wallet Address</span>
                <span className="font-mono text-xs text-text truncate w-44">{address}</span>
              </div>
              <div className="text-text-muted group-hover:text-[var(--color-celo-green)] transition-colors ml-2 flex-shrink-0">
                {copied ? <Check size={14} className="text-[var(--color-celo-green)]" /> : <Copy size={14} />}
              </div>
            </button>

            {balance !== undefined && (
              <div className="px-3 py-2 border-t border-border flex justify-between items-center text-sm">
                <span className="text-text-muted">Balance</span>
                <span className="font-bold text-[var(--color-celo-green)]">{Number(balance).toFixed(2)} USDm</span>
              </div>
            )}

            {onDisconnect && (
              <button
                onClick={() => {
                  onDisconnect();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors text-left text-sm mt-1"
              >
                <LogOut size={14} />
                <span>Disconnect</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Tool Result Card Renderer
function ToolResult({ toolName, result }: { toolName: string; result: any }) {
  if (toolName === "checkBalance") {
    if (result.error) {
      return (
        <motion.div
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="w-[calc(100%-32px)] md:max-w-md bg-red-500/10 border border-red-500/30 rounded-2xl p-4 my-2"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-red-400 uppercase mb-2">
            <span>◎</span> Balance Query Failed
          </div>
          <hr className="border-red-500/20 mb-3" />
          <p className="text-sm text-red-300 leading-relaxed">
            {result.error}
          </p>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ clipPath: "inset(0 0 100% 0)" }}
        animate={{ clipPath: "inset(0 0 0% 0)" }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="w-[calc(100%-32px)] md:max-w-md bg-surface border border-border rounded-2xl p-4 my-2"
      >
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--color-text-faint)] uppercase mb-2">
          <span>◎</span> {toolName}
        </div>
        <hr className="border-border mb-3" />
        
        <div className="text-3xl font-bold text-[var(--color-celo-green)] mb-1">
          {Number(result.balances?.cUSD || 0).toFixed(2)} cUSD
        </div>
        <div className="mb-4">
          <AddressChip address={result.address || "0x0"} />
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--color-celo-green)]/10 text-[var(--color-celo-green)] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-celo-green)]"></span>
            Confirmed on Celo
          </div>
          {result.explorerUrl && (
            <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-text-muted hover:text-[var(--color-celo-green)] transition-colors">
              <ExternalLink size={12} /> CeloScan
            </a>
          )}
        </div>
      </motion.div>
    );
  }

  if (toolName === "transferStablecoin") {
    const isSuccess = result.status === "confirmed";
    const statusColor = isSuccess ? "var(--color-confirmed)" : "var(--color-failed)";
    
    return (
      <motion.div
        initial={{ clipPath: "inset(0 0 100% 0)" }}
        animate={{ clipPath: "inset(0 0 0% 0)" }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="w-[calc(100%-32px)] md:max-w-md bg-surface border border-border rounded-2xl p-4 my-2"
      >
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--color-text-faint)] uppercase mb-2">
          <span>◎</span> {toolName}
        </div>
        <hr className="border-border mb-3" />
        
        <div className="text-xl md:text-2xl font-bold text-[var(--color-celo-green)] mb-1">
          Sent {result.amount} {result.symbol}
        </div>
        <div className="text-sm text-text-muted flex items-center gap-2 mb-4">
          to <AddressChip address={result.to || "0x0"} />
        </div>

        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full font-medium" style={{ backgroundColor: `color-mix(in srgb, ${statusColor} 10%, transparent)`, color: statusColor }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }}></span>
            {isSuccess ? "Confirmed" : "Failed"}
          </div>
          {result.explorerUrl && (
            <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-text-muted hover:text-[var(--color-celo-green)] transition-colors">
              <ExternalLink size={12} /> CeloScan
            </a>
          )}
        </div>
      </motion.div>
    );
  }

  if (toolName === "getAgentIdentity") {
    return (
      <motion.div
        initial={{ clipPath: "inset(0 0 100% 0)" }}
        animate={{ clipPath: "inset(0 0 0% 0)" }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="w-[calc(100%-32px)] md:max-w-md bg-surface border border-border rounded-2xl p-4 my-2"
      >
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--color-text-faint)] uppercase mb-2">
          <span>◎</span> {toolName}
        </div>
        <hr className="border-border mb-3" />
        
        <div className="text-lg font-bold text-text mb-1">
          {result.name}
        </div>
        <div className="mb-4">
          <AddressChip address={result.walletAddress || "0x0"} />
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--color-surface-offset)] text-text-muted font-medium">
            ERC-8004 Identity
          </div>
          {result.explorerUrl && (
            <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-text-muted hover:text-[var(--color-celo-green)] transition-colors">
              <ExternalLink size={12} /> CeloScan
            </a>
          )}
        </div>
      </motion.div>
    );
  }

  if (toolName === "explainCelo") {
    return (
      <motion.div
        initial={{ clipPath: "inset(0 0 100% 0)" }}
        animate={{ clipPath: "inset(0 0 0% 0)" }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="w-[calc(100%-32px)] md:max-w-md bg-surface border border-border rounded-2xl p-4 my-2 overflow-hidden relative"
      >
        {/* Subtle watermark */}
        <div className="absolute -right-4 -bottom-4 opacity-5 text-[var(--color-celo-green)] pointer-events-none">
          <MessageSquare size={120} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--color-text-faint)] uppercase mb-2">
            <span>◎</span> {result.topic}
          </div>
          <hr className="border-border mb-3" />
          <p className="text-sm text-text-muted leading-relaxed">
            {result.explanation}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="text-xs font-mono text-[var(--color-text-faint)] my-2 p-2 rounded bg-[var(--color-surface-offset)]">
      Completed {toolName}
    </div>
  );
}

export default function ChatPage() {
  const { address, balance, isMiniPay, isLoading: isWalletLoading, connect, disconnect } = useMiniPay();
  const addressRef = useRef(address);
  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  const { fetchWithPayment } = useFetchWithPayment(thirdwebClient, {
    parseAs: "raw",
  });
  
  const { messages, sendMessage, status, error, regenerate, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: fetchWithPayment as any,
      body: () => ({
        userAddress: addressRef.current,
      }),
    }),
  });
  
  const [input, setInput] = useState("");
  const isLoading = status === 'submitted' || status === 'streaming';

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Custom states for the new UI/UX requirements
  const [activeTab, setActiveTab] = useState<"chat" | "dashboard" | "account" | "settings">("chat");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isMounted, setIsMounted] = useState(false);

  // User Profile
  const [profile, setProfile] = useState({
    email: "",
    xAccount: "",
    points: 0,
    dailyUnregisteredUsage: 0,
    lastResetDate: "",
  });

  // Account editing form inputs
  const [emailInput, setEmailInput] = useState("");
  const [xAccountInput, setXAccountInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  // Micropayment state triggers
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentReason, setPaymentReason] = useState<"unregistered_fee" | "buy_points" | "daily_limit" | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const publicClient = createPublicClient({
    chain: celo,
    transport: http(),
  });

  // Load configuration and history on mount
  useEffect(() => {
    // Theme setup
    const storedTheme = localStorage.getItem("minipay_bot_theme") || "dark";
    setTheme(storedTheme as any);
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Profile loading with daily reset checks
    const storedProfile = localStorage.getItem("minipay_bot_user_profile");
    let currentProfile = {
      email: "",
      xAccount: "",
      points: 0,
      dailyUnregisteredUsage: 0,
      lastResetDate: "",
    };

    if (storedProfile) {
      try {
        currentProfile = JSON.parse(storedProfile);
      } catch (e) {
        console.error(e);
      }
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (currentProfile.lastResetDate !== todayStr) {
      currentProfile.lastResetDate = todayStr;
      currentProfile.dailyUnregisteredUsage = 0;
      const hasSocials = currentProfile.email.trim() !== "" && currentProfile.xAccount.trim() !== "";
      currentProfile.points = hasSocials ? 5 : 0;
      localStorage.setItem("minipay_bot_user_profile", JSON.stringify(currentProfile));
    }

    setProfile(currentProfile);
    setEmailInput(currentProfile.email);
    setXAccountInput(currentProfile.xAccount);

    // Chat history loading
    const storedHistory = localStorage.getItem("minipay_bot_chat_history");
    if (storedHistory) {
      try {
        setMessages(JSON.parse(storedHistory));
      } catch (e) {
        console.error(e);
      }
    }

    setIsMounted(true);
  }, [setMessages]);

  // Synchronize history
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("minipay_bot_chat_history", JSON.stringify(messages));
    }
  }, [messages, isMounted]);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("minipay_bot_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    setTimeout(() => {
      const todayStr = new Date().toISOString().split("T")[0];
      const hadSocials = profile.email.trim() !== "" && profile.xAccount.trim() !== "";
      const hasSocials = emailInput.trim() !== "" && xAccountInput.trim() !== "";

      let newPoints = profile.points;
      if (!hadSocials && hasSocials) {
        newPoints = Math.max(newPoints, 5); // Refill/credit 5 points on first connection
      }

      const updatedProfile = {
        ...profile,
        email: emailInput,
        xAccount: xAccountInput,
        points: newPoints,
        lastResetDate: todayStr,
      };

      setProfile(updatedProfile);
      localStorage.setItem("minipay_bot_user_profile", JSON.stringify(updatedProfile));
      setIsSavingProfile(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 600);
  };

  // Perform Celo Mainnet payment
  const executePayment = async () => {
    setIsPaying(true);
    try {
      const isDev = typeof window !== "undefined" && (window.location.search.includes("dev=true") || process.env.NODE_ENV === "development");
      
      if (isDev && !(window as any).ethereum) {
        await new Promise((r) => setTimeout(r, 1200));
      } else {
        const client = createWalletClient({
          chain: celo,
          transport: custom((window as any).ethereum),
        });
        const [userAddr] = await client.getAddresses();
        if (!userAddr) throw new Error("No wallet connected");

        const hash = await client.sendTransaction({
          account: userAddr,
          to: AGENT_ADDRESS,
          value: parseEther("1"), // 1 CELO
        });

        await publicClient.waitForTransactionReceipt({ hash });
      }

      // Handle Success
      if (paymentReason === "buy_points") {
        const updatedProfile = {
          ...profile,
          points: profile.points + 5,
        };
        setProfile(updatedProfile);
        localStorage.setItem("minipay_bot_user_profile", JSON.stringify(updatedProfile));
        
        setShowPaymentModal(false);
        setPaymentReason(null);
        setIsPaying(false);

        if (pendingMessage) {
          sendMessage({ text: pendingMessage });
          setPendingMessage(null);
        }
      } else if (paymentReason === "unregistered_fee") {
        const updatedProfile = {
          ...profile,
          dailyUnregisteredUsage: profile.dailyUnregisteredUsage + 1,
        };
        setProfile(updatedProfile);
        localStorage.setItem("minipay_bot_user_profile", JSON.stringify(updatedProfile));
        
        setShowPaymentModal(false);
        setPaymentReason(null);
        setIsPaying(false);

        if (pendingMessage) {
          sendMessage({ text: pendingMessage });
          setPendingMessage(null);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert("Payment failed: " + (err.message || "User rejected transacting"));
      setIsPaying(false);
    }
  };

  // Submit input check point limits
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const hasSocials = profile.email.trim() !== "" && profile.xAccount.trim() !== "";
    if (hasSocials) {
      if (profile.points > 0) {
        const updatedProfile = {
          ...profile,
          points: profile.points - 1,
        };
        setProfile(updatedProfile);
        localStorage.setItem("minipay_bot_user_profile", JSON.stringify(updatedProfile));
        sendMessage({ text: input });
        setInput("");
      } else {
        setPendingMessage(input);
        setPaymentReason("buy_points");
        setShowPaymentModal(true);
      }
    } else {
      if (profile.dailyUnregisteredUsage < 10) {
        setPendingMessage(input);
        setPaymentReason("unregistered_fee");
        setShowPaymentModal(true);
      } else {
        setPendingMessage(null);
        setPaymentReason("daily_limit");
        setShowPaymentModal(true);
      }
    }
  };

  // Chat History deletes
  const handleDeleteMessage = (userMsgId: string) => {
    const index = messages.findIndex(m => m.id === userMsgId);
    if (index !== -1) {
      const nextMsg = messages[index + 1];
      setMessages(prev => prev.filter(m => m.id !== userMsgId && (!nextMsg || m.id !== nextMsg.id)));
    }
  };

  const handleClearAllHistory = () => {
    if (confirm("Are you sure you want to clear your chat history?")) {
      setMessages([]);
      localStorage.removeItem("minipay_bot_chat_history");
    }
  };

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    };
    
    scrollToBottom();
    
    const container = scrollRef.current;
    if (container && container.firstElementChild) {
      const resizeObserver = new ResizeObserver(() => {
        if (!container) return;
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
        if (isNearBottom) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }
      });
      resizeObserver.observe(container.firstElementChild);
      return () => resizeObserver.disconnect();
    }
  }, [messages, activeTab]);

  const handleSuggestion = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  if (!isMounted) {
    return (
      <div className="fixed inset-0 flex flex-col bg-[var(--color-bg)] justify-center items-center">
        <div className="w-10 h-10 rounded-full border-4 border-border border-t-[var(--color-celo-green)] animate-spin" />
      </div>
    );
  }

  if (!isWalletLoading && !isMiniPay) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--color-bg)] z-50">
         <div className="w-16 h-16 rounded-2xl bg-[var(--color-celo-green)]/10 text-[var(--color-celo-green)] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(53,208,127,0.2)]">
            <MessageSquare size={32} />
         </div>
         <h1 className="text-2xl font-bold text-text mb-2">MiniPay Required</h1>
         <p className="text-sm text-text-muted max-w-sm text-center mb-6">
           This application requires the MiniPay wallet on Celo. Please open this link inside the MiniPay app.
         </p>
         <Link href="/" className="px-6 py-2.5 rounded-full bg-[var(--color-surface-offset)] border border-border text-text hover:border-[var(--color-celo-green)]/50 hover:text-[var(--color-celo-green)] transition-all">
           Return Home
         </Link>
      </div>
    );
  }

  const userMessages = messages.filter(m => m.role === "user");

  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--color-bg)]">
      {/* Top Nav */}
      <header className="flex-shrink-0 flex justify-between items-center w-full px-4 md:px-6 h-[56px] bg-surface border-b border-[var(--color-divider)] z-20">
        <Link href="/" className="flex items-center gap-2 group">
          <svg viewBox="0 0 160 32" className="h-[18px] w-auto text-text" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="MiniPayBot">
            <circle cx="8" cy="16" r="6" fill="var(--color-celo-green)"/>
            <line x1="14" y1="16" x2="26" y2="16" stroke="var(--color-celo-green)" strokeWidth="2.5"/>
            <circle cx="30" cy="16" r="5" stroke="var(--color-celo-green)" strokeWidth="2.5"/>
            <text x="42" y="21" fontFamily="inherit" fontWeight="600" fontSize="16" fill="currentColor">
              MiniPay<tspan fill="var(--color-celo-green)">Bot</tspan>
            </text>
          </svg>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--color-surface-offset)] transition-colors text-text-muted hover:text-text"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-400" />}
          </button>

          {address ? (
            <AddressChip address={address} balance={balance} onDisconnect={disconnect} />
          ) : isWalletLoading ? (
            <div className="animate-pulse bg-[var(--color-surface-offset)] h-8 w-32 rounded-full" />
          ) : (
            <button 
              onClick={connect}
              className="px-4 py-1.5 rounded-full bg-[var(--color-celo-green)] text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_2px_10px_rgba(53,208,127,0.2)]"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {!address ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-celo-green)]/10 text-[var(--color-celo-green)] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(53,208,127,0.15)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text mb-2">Connect Your Wallet</h2>
            <p className="text-sm text-text-muted mb-6 leading-relaxed">
              Please connect your MiniPay or Celo wallet to access your agent and start executing on-chain commands.
            </p>
            <button 
              onClick={connect}
              className="px-6 py-2.5 rounded-full bg-[var(--color-celo-green)] text-black font-semibold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(53,208,127,0.3)]"
            >
              Connect Wallet
            </button>
          </motion.div>
        </div>
      ) : (
        <>
          {/* Main content pane based on active tab */}
          {activeTab === "chat" && (
            <div 
              ref={scrollRef} 
              className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-44"
            >
              <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
                
                {/* Empty State */}
                {messages.length === 0 && (
                  <motion.div 
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
                      }
                    }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                      <MessageSquare className="text-[var(--color-text-faint)] mb-4" size={48} />
                    </motion.div>
                    <motion.h2 
                      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                      className="text-lg font-medium text-text mb-2"
                    >
                      Start a conversation
                    </motion.h2>
                    <motion.p 
                      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                      className="text-sm text-text-muted max-w-sm"
                    >
                      Ask me to check your balance, send cUSD, or explain how Celo works.
                    </motion.p>
                  </motion.div>
                )}

                {/* Chat Bubbles */}
                <AnimatePresence initial={false}>
                  {messages.map((m) => {
                    const isUser = m.role === "user";
                    return (
                      <motion.div 
                        key={m.id} 
                        layout="position"
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                          <div 
                            className={`
                              px-4 py-3 text-[15px] leading-relaxed
                              ${isUser 
                                ? "bg-[var(--color-celo-green)] text-[var(--color-text-inverse)] rounded-2xl rounded-br-sm" 
                                : "bg-surface text-text border border-border rounded-2xl rounded-bl-sm"
                              }
                            `}
                          >
                            {/* Render text parts */}
                            {m.parts?.filter(p => p.type === 'text').map((part: any, i) => (
                              <div key={i} className={`prose ${isUser ? 'prose-invert' : 'prose-p:text-text'} max-w-none`}>
                                <ReactMarkdown>{part.text}</ReactMarkdown>
                              </div>
                            ))}
                            
                            {/* Streaming indicator */}
                            {m.id === messages[messages.length - 1]?.id && isLoading && !isUser && (
                               <motion.span 
                                 animate={{ opacity: [0, 1, 0] }} 
                                 transition={{ repeat: Infinity, duration: 0.8 }}
                                 className="inline-block w-1.5 h-4 ml-1 bg-[var(--color-celo-green)] align-middle"
                               />
                            )}
                          </div>

                          {/* Render tool results outside the bubble, inline in the thread */}
                          <div className="w-full flex flex-col mt-2">
                            {m.parts?.filter(p => p.type.startsWith('tool-')).map((part: any, i) => {
                              const toolName = part.type.replace('tool-', '');
                              
                              if (part.state === 'output-available') {
                                 return <ToolResult key={i} toolName={toolName} result={part.output} />;
                              }
                              
                              if (part.state === 'input-streaming' || part.state === 'input-available') {
                                 return (
                                   <div key={i} className="flex items-center gap-2 text-xs font-mono text-text-muted my-2 px-2">
                                     <div className="w-3 h-3 rounded-full border-2 border-border border-t-[var(--color-celo-green)] animate-spin" />
                                     Executing {toolName}...
                                   </div>
                                 );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Thinking Indicator */}
                {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-celo-green)] animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-celo-green)] animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-celo-green)] animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                      <span className="text-xs text-text-muted font-medium">Agent is thinking...</span>
                    </div>
                  </motion.div>
                )}

                {/* Error Message Card */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start w-full my-4"
                  >
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 w-full max-w-md">
                      <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>An error occurred</span>
                      </div>
                      <p className="text-xs text-red-300 mb-3 leading-relaxed">
                        {error.message || "Failed to generate a response. The Gemini API rate limit may have been exceeded."}
                      </p>
                      <button
                        type="button"
                        onClick={() => regenerate()}
                        className="px-4 py-2 rounded-full bg-red-500 text-white font-medium text-xs hover:bg-red-600 transition-colors"
                      >
                        Retry Request
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-24 max-w-3xl mx-auto w-full flex flex-col gap-6">
              <h2 className="text-2xl font-extrabold text-text">Dashboard</h2>
              
              {/* Account Status Card */}
              <div className={`p-5 rounded-2xl border bg-surface shadow-sm ${profile.email && profile.xAccount ? 'border-[var(--color-celo-green)]/30' : 'border-amber-500/30'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${profile.email && profile.xAccount ? 'bg-[var(--color-celo-green)]/15 text-[var(--color-celo-green)]' : 'bg-amber-500/15 text-amber-500'}`}>
                      {profile.email && profile.xAccount ? "Registered Member" : "Guest Wallet"}
                    </span>
                    <h3 className="text-lg font-bold text-text mt-2">
                      {profile.email && profile.xAccount ? "Standard Tier Account" : "Free Trial Tier"}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-text-muted">Balance</span>
                    <div className="text-xl font-bold text-[var(--color-celo-green)]">{Number(balance).toFixed(2)} USDm</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 py-4 border-t border-b border-border">
                  <div>
                    <span className="text-xs text-text-muted block">AI Agent Daily Points</span>
                    <span className="text-2xl font-extrabold text-text">{profile.points} <span className="text-sm font-normal text-text-muted">/ 5 free</span></span>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted block">Unregistered Daily Usage</span>
                    <span className="text-2xl font-extrabold text-text">{profile.dailyUnregisteredUsage} <span className="text-sm font-normal text-text-muted">/ 10 max</span></span>
                  </div>
                </div>

                {profile.email && profile.xAccount ? (
                  <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <p className="text-xs text-text-muted">
                      You receive 5 free points daily. Need more? Buy 5 points for 1 CELO.
                    </p>
                    <button
                      onClick={() => {
                        setPaymentReason("buy_points");
                        setShowPaymentModal(true);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-[var(--color-celo-green)] text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_2px_10px_rgba(53,208,127,0.2)]"
                    >
                      Buy 5 Points
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <p className="text-xs text-text-muted">
                      Link your email and x.com accounts in the Account page to receive 5 free agent calls daily.
                    </p>
                    <button
                      onClick={() => setActiveTab("account")}
                      className="w-full sm:w-auto px-4 py-2 rounded-full bg-[var(--color-surface-offset)] border border-border text-text hover:border-[var(--color-celo-green)]/50 transition-colors text-xs font-semibold"
                    >
                      Link Socials
                    </button>
                  </div>
                )}
              </div>

              {/* Chat History Management Card */}
              <div className="p-5 rounded-2xl border border-border bg-surface shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-text">Chat History ({userMessages.length})</h3>
                  {userMessages.length > 0 && (
                    <button
                      onClick={handleClearAllHistory}
                      className="text-xs text-red-400 hover:text-red-500 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={14} /> Clear All
                    </button>
                  )}
                </div>

                {userMessages.length === 0 ? (
                  <div className="py-8 text-center text-xs text-text-muted">
                    No chat history found. Start chatting with the agent!
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                    {userMessages.map((userMsg) => {
                      const msgText = userMsg.parts
                        ?.filter((p: any) => p.type === 'text')
                        ?.map((p: any) => p.text)
                        ?.join('\n') || "";
                      return (
                        <div key={userMsg.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-offset)] border border-border hover:border-border/80 transition-colors group">
                          <button
                            onClick={() => {
                              setInput(msgText);
                              setActiveTab("chat");
                            }}
                            className="flex-1 text-left text-xs font-medium text-text truncate mr-4 hover:text-[var(--color-celo-green)] transition-colors"
                          >
                            {msgText}
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(userMsg.id)}
                            className="p-1 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                            title="Delete request and response"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-24 max-w-3xl mx-auto w-full flex flex-col gap-6">
              <h2 className="text-2xl font-extrabold text-text">User Account</h2>
              
              <div className="p-5 rounded-2xl border border-border bg-surface shadow-sm">
                <h3 className="text-base font-bold text-text mb-2">Social Connections</h3>
                <p className="text-xs text-text-muted mb-6">
                  Register your socials to unlock the 5 free daily points tier. Unregistered wallets pay a fee of 1 CELO per usage.
                </p>

                <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-muted block mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" size={16} />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-transparent text-sm focus:border-[var(--color-celo-green)] focus:ring-1 focus:ring-[var(--color-celo-green)] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-muted block mb-1.5">x.com (Twitter) Handle</label>
                    <div className="relative">
                      <TwitterIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" size={16} />
                      <input
                        type="text"
                        required
                        placeholder="@username"
                        value={xAccountInput}
                        onChange={(e) => setXAccountInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-transparent text-sm focus:border-[var(--color-celo-green)] focus:ring-1 focus:ring-[var(--color-celo-green)] transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full mt-2 py-3 rounded-xl bg-[var(--color-celo-green)] text-black font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(53,208,127,0.25)]"
                  >
                    {isSavingProfile ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : saveStatus === "saved" ? (
                      <>
                        <CheckCircle size={16} />
                        <span>Saved successfully</span>
                      </>
                    ) : (
                      <span>Save Profile</span>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-24 max-w-3xl mx-auto w-full flex flex-col gap-6">
              <h2 className="text-2xl font-extrabold text-text">Settings</h2>
              
              {/* Theme Section */}
              <div className="p-5 rounded-2xl border border-border bg-surface shadow-sm">
                <h3 className="text-base font-bold text-text mb-4">Aesthetics</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-text block">Theme Selection</span>
                    <span className="text-xs text-text-muted">Choose your preferred application color theme.</span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface-offset)] border border-border text-text hover:border-[var(--color-celo-green)]/50 transition-colors"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun size={16} className="text-yellow-400" />
                        <span className="text-xs font-semibold">Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon size={16} className="text-indigo-400" />
                        <span className="text-xs font-semibold">Dark Mode</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Developer / System Info */}
              <div className="p-5 rounded-2xl border border-border bg-surface shadow-sm">
                <h3 className="text-base font-bold text-text mb-4">System Configurations</h3>
                <div className="flex flex-col gap-3 text-xs font-mono text-text-muted">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span>Network</span>
                    <span className="text-text">Celo Mainnet</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span>RPC Endpoint</span>
                    <span className="text-text">https://forno.celo.org</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span>Agent Address</span>
                    <span className="text-text">0x207d...0AD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wallet Client</span>
                    <span className="text-text">Viem Injector</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Sticky Area (Only on Chat tab) */}
          {activeTab === "chat" && (
            <div className="absolute bottom-[64px] left-0 right-0 bg-[var(--color-bg)]/80 backdrop-blur-md pb-2 z-20">
              <div className="max-w-3xl mx-auto w-full px-4 md:px-6 pt-2 pb-4 flex flex-col gap-3">
                
                {/* Points Status Micro-Indicator */}
                <div className="flex justify-between items-center text-[11px] text-text-muted px-2 font-semibold">
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${profile.email && profile.xAccount ? 'bg-[var(--color-celo-green)]' : 'bg-amber-500'}`} />
                    <span>{profile.email && profile.xAccount ? "Registered Standard Account" : "Guest Mode"}</span>
                  </div>
                  <div>
                    {profile.email && profile.xAccount 
                      ? `${profile.points} / 5 Daily Points` 
                      : `${profile.dailyUnregisteredUsage} / 10 Daily Uses (1 CELO fee)`
                    }
                  </div>
                </div>

                {/* Suggestion Pills */}
                {messages.length === 0 && (
                  <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide snap-x">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestion(s)}
                        className="snap-start flex-shrink-0 px-4 py-2 rounded-full text-[13px] bg-[var(--color-surface-offset)] text-[var(--color-celo-green)] hover:bg-[var(--color-surface-2)] transition-transform active:scale-95 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-celo-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Bar */}
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2 bg-surface border border-border rounded-full p-1 pl-4 shadow-sm focus-within:border-[var(--color-celo-green)] focus-within:ring-1 focus-within:ring-[var(--color-celo-green)] transition-all"
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-transparent border-none text-[16px] text-text placeholder-[var(--color-text-faint)] focus:outline-none focus:ring-0 py-2 min-h-[44px]"
                    disabled={isLoading}
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="w-[40px] h-[40px] flex-shrink-0 flex items-center justify-center rounded-full bg-[var(--color-celo-green)] text-[var(--color-surface)] hover:bg-[var(--color-celo-green-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowUp size={20} strokeWidth={2.5} />
                  </motion.button>
                </form>
              </div>
            </div>
          )}

          {/* Bottom Navigation Bar */}
          <nav className="flex-shrink-0 flex items-center justify-around w-full h-[64px] bg-surface border-t border-[var(--color-divider)] z-20 pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex flex-col items-center gap-1 py-1.5 px-4 transition-colors ${activeTab === "chat" ? "text-[var(--color-celo-green)]" : "text-text-muted hover:text-text"}`}
            >
              <MessageSquare size={20} />
              <span className="text-[10px] font-bold">Chat</span>
            </button>
            
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex flex-col items-center gap-1 py-1.5 px-4 transition-colors ${activeTab === "dashboard" ? "text-[var(--color-celo-green)]" : "text-text-muted hover:text-text"}`}
            >
              <LayoutDashboard size={20} />
              <span className="text-[10px] font-bold">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("account")}
              className={`flex flex-col items-center gap-1 py-1.5 px-4 transition-colors ${activeTab === "account" ? "text-[var(--color-celo-green)]" : "text-text-muted hover:text-text"}`}
            >
              <User size={20} />
              <span className="text-[10px] font-bold">Account</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex flex-col items-center gap-1 py-1.5 px-4 transition-colors ${activeTab === "settings" ? "text-[var(--color-celo-green)]" : "text-text-muted hover:text-text"}`}
            >
              <Settings size={20} />
              <span className="text-[10px] font-bold">Settings</span>
            </button>
          </nav>

          {/* Payment Overlay Modal */}
          <AnimatePresence>
            {showPaymentModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-sm bg-surface border border-border rounded-2xl p-6 shadow-2xl relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 text-amber-500 font-bold mb-4">
                    <AlertCircle className="flex-shrink-0" size={24} />
                    <h3 className="text-lg font-bold text-text">
                      {paymentReason === "buy_points" ? "Buy Daily Points" : paymentReason === "daily_limit" ? "Daily Limit Reached" : "Payment Required"}
                    </h3>
                  </div>

                  <p className="text-sm text-text-muted leading-relaxed mb-6">
                    {paymentReason === "buy_points" 
                      ? "You have run out of daily points. Pay 1 CELO to buy 5 additional agent calls?" 
                      : paymentReason === "daily_limit"
                      ? "You have reached your daily limit of 10 requests. Link your email and X account in the Account tab to receive 5 free daily points, or deposit funds to continue."
                      : "Since your socials are not connected, sending this message requires a fee of 1 CELO. Would you like to proceed?"
                    }
                  </p>

                  <div className="flex flex-col gap-3">
                    {paymentReason !== "daily_limit" && (
                      <button
                        onClick={executePayment}
                        disabled={isPaying}
                        className="w-full py-3 rounded-full bg-[var(--color-celo-green)] text-black font-bold text-sm hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(53,208,127,0.2)]"
                      >
                        {isPaying ? (
                          <>
                            <RefreshCw className="animate-spin" size={16} />
                            <span>Confirming on Celo...</span>
                          </>
                        ) : (
                          <span>Pay 1 CELO</span>
                        )}
                      </button>
                    )}

                    {paymentReason === "daily_limit" && (
                      <button
                        onClick={() => {
                          setShowPaymentModal(false);
                          setPaymentReason(null);
                          setActiveTab("account");
                        }}
                        className="w-full py-3 rounded-full bg-[var(--color-celo-green)] text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(53,208,127,0.2)]"
                      >
                        Link Socials for Free Points
                      </button>
                    )}

                    {!isPaying && (
                      <>
                        <button
                          onClick={() => {
                            setShowPaymentModal(false);
                            setPaymentReason(null);
                            setPendingMessage(null);
                          }}
                          className="w-full py-2.5 rounded-full bg-[var(--color-surface-offset)] border border-border text-text hover:bg-[var(--color-surface-2)] transition-colors text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <a
                          href={MINIPAY_DEPOSIT_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 rounded-full border border-[var(--color-celo-green)]/30 text-[var(--color-celo-green)] hover:bg-[var(--color-celo-green)]/5 transition-colors text-xs font-semibold text-center block"
                        >
                          Need funds? Deposit here
                        </a>
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
