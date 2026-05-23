/**
 * Server-side Celo client using viem.
 * Configured with fee abstraction so the agent pays gas in cUSD.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  parseUnits,
  type Address,
} from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { erc20Abi } from "viem";
import { CELO_RPC_URL, TOKENS, DEFAULT_FEE_CURRENCY, CELOSCAN_URL, AGENT_ACTION_LOG_ADDRESS, AGENT_ACTION_LOG_ABI } from "@/lib/constants";

// -- Clients --

export const publicClient = createPublicClient({
  chain: celo,
  transport: http(CELO_RPC_URL),
});

function getAgentAccount() {
  const key = process.env.AGENT_PRIVATE_KEY || "0x0123456789012345678901234567890123456789012345678901234567890123";
  return privateKeyToAccount(key as `0x${string}`);
}

export function getAgentWalletClient() {
  return createWalletClient({
    account: getAgentAccount(),
    chain: celo,
    transport: http(CELO_RPC_URL),
  });
}

export function getAgentAddress(): Address {
  return getAgentAccount().address;
}

// -- Balance queries --

export async function getBalances(address: Address) {
  const [celoBalance, cusdBalance, usdcBalance] = await Promise.all([
    publicClient.getBalance({ address }),
    publicClient.readContract({
      address: TOKENS.CUSD.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    }),
    publicClient.readContract({
      address: TOKENS.USDC.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    }),
  ]);

  return {
    CELO: formatUnits(celoBalance, TOKENS.CELO.decimals),
    cUSD: formatUnits(cusdBalance, TOKENS.CUSD.decimals),
    USDC: formatUnits(usdcBalance, TOKENS.USDC.decimals),
  };
}

// -- Transfers --

export type TokenSymbol = "cUSD" | "USDC";

function getTokenConfig(symbol: TokenSymbol) {
  if (symbol === "cUSD") return TOKENS.CUSD;
  if (symbol === "USDC") return TOKENS.USDC;
  throw new Error(`Unsupported token: ${symbol}`);
}

export async function transferStablecoin(
  to: Address,
  amount: string,
  symbol: TokenSymbol
) {
  const token = getTokenConfig(symbol);
  const walletClient = getAgentWalletClient();
  const parsedAmount = parseUnits(amount, token.decimals);
  const agentAddress = getAgentAddress();

  // Check cUSD balance to decide on feeCurrency
  const cusdBalance = await publicClient.readContract({
    address: TOKENS.CUSD.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [agentAddress],
  });

  const feeCurrency = cusdBalance < 10000000000000000n ? undefined : DEFAULT_FEE_CURRENCY;

  const hash = await walletClient.writeContract({
    address: token.address,
    abi: erc20Abi,
    functionName: "transfer",
    args: [to, parsedAmount],
    // Fee abstraction: pay gas in stablecoins if available, fallback to CELO
    feeCurrency,
  } as any); // feeCurrency is Celo-specific, not in standard viem types

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return {
    hash,
    status: receipt.status === "success" ? "confirmed" : "failed",
    explorerUrl: `${CELOSCAN_URL}/tx/${hash}`,
    amount,
    symbol,
    to,
  };
}

// -- Transaction lookup --

export async function getTransactionInfo(hash: `0x${string}`) {
  const [tx, receipt] = await Promise.all([
    publicClient.getTransaction({ hash }),
    publicClient.getTransactionReceipt({ hash }).catch(() => null),
  ]);

  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: formatUnits(tx.value, 18),
    status: receipt ? (receipt.status === "success" ? "confirmed" : "failed") : "pending",
    blockNumber: receipt?.blockNumber?.toString() ?? "pending",
    explorerUrl: `${CELOSCAN_URL}/tx/${tx.hash}`,
  };
}

// -- On-chain action logging --

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export async function logAgentAction(
  user: `0x${string}`,
  actionType: string,
  txRef: `0x${string}` = `0x${"0".repeat(64)}` as `0x${string}`
) {
  // Skip logging if contract isn't deployed yet
  if (AGENT_ACTION_LOG_ADDRESS === ZERO_ADDRESS) {
    console.log(`[ActionLog] Skipped (no contract deployed): ${actionType} for ${user}`);
    return null;
  }

  try {
    const agentAddress = getAgentAddress();
    
    // Check cUSD balance to decide on feeCurrency
    const cusdBalance = await publicClient.readContract({
      address: TOKENS.CUSD.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [agentAddress],
    }).catch(() => 0n);

    const feeCurrency = cusdBalance < 10000000000000000n ? undefined : DEFAULT_FEE_CURRENCY;

    const walletClient = getAgentWalletClient();
    const hash = await walletClient.writeContract({
      address: AGENT_ACTION_LOG_ADDRESS,
      abi: AGENT_ACTION_LOG_ABI,
      functionName: "logAction",
      args: [user, actionType, txRef as `0x${string}`],
      feeCurrency,
    } as any);

    console.log(`[ActionLog] Logged "${actionType}" for ${user}: ${hash}`);
    return hash;
  } catch (err) {
    // Don't let logging failures break the main flow
    console.error("[ActionLog] Failed to log action on-chain:", err);
    return null;
  }
}

