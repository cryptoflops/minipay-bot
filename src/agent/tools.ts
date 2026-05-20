/**
 * AI SDK tool definitions for MiniPayBot.
 * Each tool executes real Celo transactions or queries.
 */

import { tool } from "ai";
import { z } from "zod";
import {
  getBalances,
  transferStablecoin,
  getTransactionInfo,
  getAgentAddress,
  logAgentAction,
} from "./celo-client";
import { CELOSCAN_URL, ERC8004, AGENT_NAME, AGENT_DESCRIPTION } from "@/lib/constants";

export function getCeloTools(userAddress?: string) {
  return {
    checkBalance: tool({
      description:
        "Check the stablecoin and CELO balances for a wallet address on Celo mainnet. If no address is provided, checks the connected user's wallet.",
      inputSchema: z.object({
        address: z
          .string()
          .regex(/^0x[a-fA-F0-9]{40}$/)
          .optional()
          .describe("The wallet address to check. Defaults to the connected user's wallet if omitted."),
      }),
      execute: async (args) => {
        const address = args.address;
        const target = address || userAddress;
        if (!target) {
          return {
            error: "No connected wallet found and no address was specified. Please connect your wallet or provide an address to check.",
          };
        }
        const targetAddress = target as `0x${string}`;
        const balances = await getBalances(targetAddress);

        // Log action on-chain (fire and forget)
        logAgentAction(targetAddress, "balanceCheck").catch(() => {});

        return {
          address: targetAddress,
          balances,
          explorerUrl: `${CELOSCAN_URL}/address/${targetAddress}`,
        };
      },
    }),

  transferStablecoin: tool({
    description:
      "Send stablecoins (cUSD or USDC) to a recipient address on Celo mainnet. The network fee is paid in stablecoins (fee abstraction), no native CELO needed.",
    inputSchema: z.object({
      to: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/)
        .describe("Recipient wallet address"),
      amount: z
        .string()
        .describe("Amount to send (e.g. '1.5' for 1.50 cUSD)"),
      token: z
        .enum(["cUSD", "USDC"])
        .default("cUSD")
        .describe("Which stablecoin to send"),
    }),
    execute: async ({ to, amount, token }) => {
      const result = await transferStablecoin(
        to as `0x${string}`,
        amount,
        token
      );

      // Log transfer action on-chain with the tx hash as reference
      if (result.hash) {
        logAgentAction(
          to as `0x${string}`,
          "transfer",
          result.hash as `0x${string}`
        ).catch(() => {});
      }

      return result;
    },
  }),

  getTransactionStatus: tool({
    description:
      "Look up the status of a transaction on Celo mainnet by its hash.",
    inputSchema: z.object({
      txHash: z
        .string()
        .regex(/^0x[a-fA-F0-9]{64}$/)
        .describe("Transaction hash to look up"),
    }),
    execute: async ({ txHash }) => {
      const info = await getTransactionInfo(txHash as `0x${string}`);
      return info;
    },
  }),

  getAgentIdentity: tool({
    description:
      "Show the agent's on-chain identity and information, including its ERC-8004 registration on Celo.",
    inputSchema: z.object({}),
    execute: async () => {
      const address = getAgentAddress();
      const balances = await getBalances(address);
      return {
        name: AGENT_NAME,
        description: AGENT_DESCRIPTION,
        walletAddress: address,
        balances,
        erc8004: {
          identityRegistry: ERC8004.identityRegistry,
          reputationRegistry: ERC8004.reputationRegistry,
          note: "Agent registered on-chain via ERC-8004 Agent Trust Protocol",
        },
        explorerUrl: `${CELOSCAN_URL}/address/${address}`,
      };
    },
  }),

  explainCelo: tool({
    description:
      "Explain how Celo, fee abstraction, or MiniPay works. Use this when the user asks educational questions about the blockchain.",
    inputSchema: z.object({
      topic: z
        .enum(["fee-abstraction", "stablecoins", "minipay", "celo-overview", "erc-8004"])
        .describe("The topic to explain"),
    }),
    execute: async ({ topic }) => {
      const explanations: Record<string, string> = {
        "fee-abstraction":
          "Fee abstraction is a Celo-native feature that lets you pay network fees in stablecoins (like cUSD or USDC) instead of the native CELO token. This means you only need stablecoins in your wallet to send transactions -- no need to buy CELO for fees. Under the hood, Celo uses fee currency adapters that convert your stablecoin payment to cover the network fee.",
        stablecoins:
          "Celo supports 15+ stablecoins pegged to various local currencies. The main ones are cUSD (Celo Dollar / USDm, 18 decimals), USDC (USD Coin, 6 decimals), and USDT (Tether, 6 decimals). These are real tokens backed by reserves, and they maintain a stable value of approximately $1 USD each.",
        minipay:
          "MiniPay is a stablecoin wallet built on Celo with 14M+ users across 60+ countries. It's designed for emerging markets where people need simple, low-cost digital payments. MiniPay supports fee abstraction so users never need to think about native tokens -- they just send and receive stablecoins.",
        "celo-overview":
          "Celo is an Ethereum L2 (Layer 2) built on the OP Stack. It has ~1 second block times, sub-cent transaction fees, and native support for stablecoin payments. Celo migrated from an independent L1 to an Ethereum L2 in March 2025. Chain ID is 42220.",
        "erc-8004":
          "ERC-8004 is the Agent Trust Protocol -- a standard for giving AI agents on-chain identity. It has three registries: Identity (agents register as ERC-721 NFTs), Reputation (on-chain feedback/ratings), and Validation (third-party verification). This lets anyone verify that an AI agent is who it claims to be, directly on-chain.",
      };
      return {
        topic,
        explanation: explanations[topic],
      };
    },
  }),
  };
}

export const celoTools = getCeloTools();
