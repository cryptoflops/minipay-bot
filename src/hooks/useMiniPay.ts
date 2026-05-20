import { useEffect, useState, useCallback } from "react";
import { createWalletClient, createPublicClient, custom, http, formatUnits } from "viem";
import { celo } from "viem/chains";

const USDM_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as const;
const USDC_ADDRESS = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as const;
const USDT_ADDRESS = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as const;

const BALANCE_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export interface StableToken {
  symbol: "USDm" | "USDC" | "USDT";
  address: `0x${string}`;
  decimals: number;
  balance: string;
}

export function useMiniPay() {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [stableBalances, setStableBalances] = useState<StableToken[]>([
    { symbol: "USDm", address: USDM_ADDRESS, decimals: 18, balance: "0" },
    { symbol: "USDC", address: USDC_ADDRESS, decimals: 6, balance: "0" },
    { symbol: "USDT", address: USDT_ADDRESS, decimals: 6, balance: "0" },
  ]);

  const [preferredToken, setPreferredToken] = useState<StableToken>({
    symbol: "USDm",
    address: USDM_ADDRESS,
    decimals: 18,
    balance: "0",
  });

  const publicClient = createPublicClient({
    chain: celo,
    transport: http(),
  });

  const refreshBalances = useCallback(async () => {
    if (!address) return;
    try {
      const [usdmBal, usdcBal, usdtBal] = await Promise.all([
        publicClient.readContract({
          address: USDM_ADDRESS,
          abi: BALANCE_ABI,
          functionName: "balanceOf",
          args: [address],
        }).catch(() => 0n),
        publicClient.readContract({
          address: USDC_ADDRESS,
          abi: BALANCE_ABI,
          functionName: "balanceOf",
          args: [address],
        }).catch(() => 0n),
        publicClient.readContract({
          address: USDT_ADDRESS,
          abi: BALANCE_ABI,
          functionName: "balanceOf",
          args: [address],
        }).catch(() => 0n),
      ]);

      const usdmStr = formatUnits(usdmBal as bigint, 18);
      const usdcStr = formatUnits(usdcBal as bigint, 6);
      const usdtStr = formatUnits(usdtBal as bigint, 6);

      const usdmFloat = Number(usdmStr);
      const usdcFloat = Number(usdcStr);
      const usdtFloat = Number(usdtStr);

      const balances: StableToken[] = [
        { symbol: "USDm", address: USDM_ADDRESS, decimals: 18, balance: usdmStr },
        { symbol: "USDC", address: USDC_ADDRESS, decimals: 6, balance: usdcStr },
        { symbol: "USDT", address: USDT_ADDRESS, decimals: 6, balance: usdtStr },
      ];

      setStableBalances(balances);

      // Determine preferred token (highest balance)
      let preferred = balances[0]; // default to USDm
      let maxVal = usdmFloat;
      if (usdcFloat > maxVal) {
        maxVal = usdcFloat;
        preferred = balances[1];
      }
      if (usdtFloat > maxVal) {
        maxVal = usdtFloat;
        preferred = balances[2];
      }

      setPreferredToken(preferred);
    } catch (err) {
      console.error("Failed to fetch stablecoin balances", err);
    }
  }, [address]);

  // Helper function to auto-connect if requested
  const handleAutoConnect = useCallback(async (hasEth: boolean, isDev: boolean) => {
    if (hasEth) {
      try {
        const client = createWalletClient({
          chain: celo,
          transport: custom((window as any).ethereum),
        });
        const [addr] = await client.getAddresses();
        if (addr) {
          setAddress(addr);
        }
      } catch (err) {
        console.error("Failed to auto-connect wallet", err);
      }
    } else if (isDev) {
      // Mock fallback address in local dev mode when no web3 provider is injected
      setAddress("0x0Cf485F4c6b2a6087B4D5d4A590cAe8d22D7FA9a");
    }
  }, []);

  useEffect(() => {
    async function init() {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      const isDev = window.location.search.includes("dev=true") || process.env.NODE_ENV === "development";
      const hasEth = !!(window as any).ethereum;
      const mp = hasEth && (window as any).ethereum.isMiniPay === true;
      const allowed = mp || isDev;

      setIsMiniPay(allowed);
      setIsLoading(false);
    }
    init();
  }, [handleAutoConnect]);

  const connect = useCallback(async () => {
    setIsLoading(true);
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    const isDev = window.location.search.includes("dev=true") || process.env.NODE_ENV === "development";
    const hasEth = !!(window as any).ethereum;

    if (hasEth) {
      try {
        const client = createWalletClient({
          chain: celo,
          transport: custom((window as any).ethereum),
        });
        await client.requestAddresses();
        const [newAddr] = await client.getAddresses();
        if (newAddr) {
          setAddress(newAddr);
          localStorage.setItem("minipay_wallet_connected", "true");
        }
      } catch (err) {
        console.error("Failed to request address", err);
      }
    } else if (isDev) {
      setAddress("0x0Cf485F4c6b2a6087B4D5d4A590cAe8d22D7FA9a");
      localStorage.setItem("minipay_wallet_connected", "true");
    }
    setIsLoading(false);
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setStableBalances([
      { symbol: "USDm", address: USDM_ADDRESS, decimals: 18, balance: "0" },
      { symbol: "USDC", address: USDC_ADDRESS, decimals: 6, balance: "0" },
      { symbol: "USDT", address: USDT_ADDRESS, decimals: 6, balance: "0" },
    ]);
    setPreferredToken({
      symbol: "USDm",
      address: USDM_ADDRESS,
      decimals: 18,
      balance: "0",
    });
    localStorage.removeItem("minipay_wallet_connected");
  }, []);

  useEffect(() => {
    if (address) refreshBalances();
  }, [address, refreshBalances]);

  return {
    address,
    balance: preferredToken.balance, // For backward compatibility with existing components
    stableBalances,
    preferredToken,
    isMiniPay,
    isLoading,
    refreshBalances,
    connect,
    disconnect
  };
}
