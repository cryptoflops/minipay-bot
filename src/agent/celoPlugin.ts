import {
  type Action,
  type ActionResult,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  type Plugin,
  logger,
} from "@elizaos/core";
import { getBalances, transferStablecoin, getTransactionInfo, getAgentAddress, logAgentAction } from "./celo-client";
import { CELOSCAN_URL, ERC8004, AGENT_NAME, AGENT_DESCRIPTION } from "./constants";
import { type Address } from "viem";

// Helper to extract transfer parameters
async function extractTransferParams(
  runtime: IAgentRuntime,
  text: string
): Promise<{ to: string | null; amount: string | null; token: "cUSD" | "USDC" | null }> {
  const prompt = `You are a Celo transaction parameter extractor. Inspect the user request and extract:
1. "to" (a 42-character Celo/Ethereum wallet address starting with 0x)
2. "amount" (a number as a string, e.g. "1.5")
3. "token" (either "cUSD" or "USDC", default to "cUSD" if not specified)

User message: "${text}"

Return ONLY a valid JSON object with keys "to", "amount", "token". Do not include any explanation or markdown formatting other than raw JSON.
Example:
{"to": "0x765DE816845861e75A25fCA122bb6898B8B1282a", "amount": "1.5", "token": "cUSD"}`;

  try {
    const result = await runtime.generateText(prompt, { includeCharacter: false });
    const cleanText = result.text.trim().replace(/^```json/, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleanText);
    return {
      to: parsed.to || null,
      amount: parsed.amount || null,
      token: parsed.token === "USDC" ? "USDC" : "cUSD",
    };
  } catch (error) {
    logger.error("Error extracting transfer parameters:", error);
    // Regex fallback
    const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
    const amountMatch = text.match(/\b\d+(\.\d+)?\b/);
    const token = text.toLowerCase().includes("usdc") ? "USDC" : "cUSD";
    return {
      to: addressMatch ? addressMatch[0] : null,
      amount: amountMatch ? amountMatch[0] : null,
      token,
    };
  }
}

// 1. CHECK_BALANCE Action
const checkBalanceAction: Action = {
  name: "CHECK_BALANCE",
  similes: ["GET_BALANCE", "SHOW_BALANCE", "CHECK_BALANCES", "BALANCE"],
  description: "Check Celo, cUSD, and USDC balances for a wallet address.",
  validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
    return true;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ): Promise<ActionResult> => {
    try {
      const text = message.content.text || "";
      const addressRegex = /0x[a-fA-F0-9]{40}/;
      const match = text.match(addressRegex);
      
      let targetAddress: string | undefined = match ? match[0] : undefined;
      
      // If not in text, check message.content for userAddress passed from client
      if (!targetAddress && message.content && typeof (message.content as any).userAddress === "string") {
        targetAddress = (message.content as any).userAddress;
      }
      
      // If not in text, use the user's address passed in userId
      if (!targetAddress && message.userId && message.userId.match(addressRegex)) {
        targetAddress = message.userId;
      }
      
      if (!targetAddress) {
        await callback({
          text: "I couldn't find a Celo wallet address to check. Please provide a wallet address.",
          source: message.content.source,
        });
        return { success: false, text: "No wallet address provided" };
      }
      
      const balances = await getBalances(targetAddress as Address);
      
      // Log action on-chain
      logAgentAction(targetAddress as Address, "balanceCheck").catch(() => {});
      
      const responseText = `Here are the balances for ${targetAddress}:\n- **cUSD**: ${balances.cUSD}\n- **USDC**: ${balances.USDC}\n- **CELO**: ${balances.CELO}`;
      
      await callback({
        text: responseText,
        source: message.content.source,
      });
      
      return {
        success: true,
        text: responseText,
        data: { balances, address: targetAddress },
      };
    } catch (error) {
      logger.error("Error in CHECK_BALANCE action:", error);
      await callback({
        text: `Sorry, I encountered an error checking the balance.`,
        source: message.content.source,
      });
      return { success: false, error: new Error(error instanceof Error ? error.message : String(error)) };
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: { text: "What is my balance?" },
      },
      {
        name: "{{name2}}",
        content: { text: "Checking balances...", actions: ["CHECK_BALANCE"] },
      }
    ]
  ]
};

// 2. TRANSFER_STABLECOIN Action
const transferStablecoinAction: Action = {
  name: "TRANSFER_STABLECOIN",
  similes: ["SEND_COINS", "TRANSFER", "SEND_STABLECOIN", "PAY"],
  description: "Send stablecoins (cUSD or USDC) to a recipient address on Celo.",
  validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
    return true;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ): Promise<ActionResult> => {
    try {
      const text = message.content.text || "";
      const { to, amount, token } = await extractTransferParams(runtime, text);
      
      if (!to || !amount || !token) {
        await callback({
          text: "I need to know the recipient address, amount, and token (cUSD or USDC) to perform a transfer.",
          source: message.content.source,
        });
        return { success: false, text: "Missing transfer parameters" };
      }
      
      await callback({
        text: `Executing transfer of ${amount} ${token} to ${to}...`,
        source: message.content.source,
      });
      
      const result = await transferStablecoin(to as Address, amount, token);
      
      // Log transfer action on-chain with the tx hash as reference
      if (result.hash) {
        logAgentAction(to as Address, "transfer", result.hash as `0x${string}`).catch(() => {});
      }
      
      const responseText = `Transaction successful!\n- **Amount**: ${result.amount} ${result.symbol}\n- **Recipient**: ${result.to}\n- **Status**: ${result.status}\n- **Tx Hash**: ${result.hash}\n- **Explorer**: ${result.explorerUrl}`;
      
      await callback({
        text: responseText,
        source: message.content.source,
      });
      
      return {
        success: true,
        text: responseText,
        data: result,
      };
    } catch (error) {
      logger.error("Error in TRANSFER_STABLECOIN action:", error);
      await callback({
        text: `Sorry, the transfer failed: ${error instanceof Error ? error.message : String(error)}`,
        source: message.content.source,
      });
      return { success: false, error: new Error(error instanceof Error ? error.message : String(error)) };
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: { text: "Send 1.5 cUSD to 0x765DE816845861e75A25fCA122bb6898B8B1282a" },
      },
      {
        name: "{{name2}}",
        content: { text: "Initiating transfer...", actions: ["TRANSFER_STABLECOIN"] },
      }
    ]
  ]
};

// 3. GET_TRANSACTION_STATUS Action
const getTransactionStatusAction: Action = {
  name: "GET_TRANSACTION_STATUS",
  similes: ["TRANSACTION_STATUS", "CHECK_TX", "TX_STATUS", "LOOKUP_TX"],
  description: "Look up transaction status on Celo using a transaction hash.",
  validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
    return true;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ): Promise<ActionResult> => {
    try {
      const text = message.content.text || "";
      const txHashRegex = /0x[a-fA-F0-9]{64}/;
      const match = text.match(txHashRegex);
      
      if (!match) {
        await callback({
          text: "Please provide a valid 66-character transaction hash (starting with 0x) to look up.",
          source: message.content.source,
        });
        return { success: false, text: "No transaction hash provided" };
      }
      
      const txHash = match[0];
      const info = await getTransactionInfo(txHash as `0x${string}`);
      
      const responseText = `Transaction Info:\n- **Hash**: ${info.hash}\n- **Status**: ${info.status}\n- **From**: ${info.from}\n- **To**: ${info.to}\n- **Block**: ${info.blockNumber}\n- **Explorer**: ${info.explorerUrl}`;
      
      await callback({
        text: responseText,
        source: message.content.source,
      });
      
      return {
        success: true,
        text: responseText,
        data: info,
      };
    } catch (error) {
      logger.error("Error in GET_TRANSACTION_STATUS action:", error);
      await callback({
        text: `Error looking up transaction status.`,
        source: message.content.source,
      });
      return { success: false, error: new Error(error instanceof Error ? error.message : String(error)) };
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: { text: "Check status of tx 0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" },
      },
      {
        name: "{{name2}}",
        content: { text: "Looking up transaction...", actions: ["GET_TRANSACTION_STATUS"] },
      }
    ]
  ]
};

// 4. GET_AGENT_IDENTITY Action
const getAgentIdentityAction: Action = {
  name: "GET_AGENT_IDENTITY",
  similes: ["WHO_ARE_YOU", "ABOUT_YOURSELF", "AGENT_INFO", "ERC8004"],
  description: "Display the agent's on-chain identity (ERC-8004) and address.",
  validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
    return true;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ): Promise<ActionResult> => {
    try {
      const address = getAgentAddress();
      const balances = await getBalances(address);
      
      const responseText = `I am **${AGENT_NAME}**!\n\n${AGENT_DESCRIPTION}\n\n- **Wallet Address**: ${address}\n- **cUSD Balance**: ${balances.cUSD}\n- **USDC Balance**: ${balances.USDC}\n- **CELO Balance**: ${balances.CELO}\n- **ERC-8004 Identity Registry**: ${ERC8004.identityRegistry}\n- **ERC-8004 Reputation Registry**: ${ERC8004.reputationRegistry}\n- **Explorer**: ${CELOSCAN_URL}/address/${address}`;
      
      await callback({
        text: responseText,
        source: message.content.source,
      });
      
      return {
        success: true,
        text: responseText,
        data: { address, balances },
      };
    } catch (error) {
      logger.error("Error in GET_AGENT_IDENTITY action:", error);
      return { success: false, error: new Error(error instanceof Error ? error.message : String(error)) };
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: { text: "Tell me about yourself" },
      },
      {
        name: "{{name2}}",
        content: { text: "Displaying on-chain identity...", actions: ["GET_AGENT_IDENTITY"] },
      }
    ]
  ]
};

// 5. EXPLAIN_CELO Action
const explainCeloAction: Action = {
  name: "EXPLAIN_CELO",
  similes: ["EXPLAIN_CONCEPT", "EDUCATE", "HOW_DOES_IT_WORK"],
  description: "Explain Celo-specific concepts like fee abstraction, stablecoins, MiniPay, or ERC-8004.",
  validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
    return true;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ): Promise<ActionResult> => {
    const text = (message.content.text || "").toLowerCase();
    
    let topic = "celo-overview";
    if (text.includes("fee") || text.includes("gas") || text.includes("abstraction")) {
      topic = "fee-abstraction";
    } else if (text.includes("stable") || text.includes("cusd") || text.includes("usdc") || text.includes("usdt")) {
      topic = "stablecoins";
    } else if (text.includes("minipay")) {
      topic = "minipay";
    } else if (text.includes("8004") || text.includes("trust") || text.includes("reputation")) {
      topic = "erc-8004";
    }

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

    const explanation = explanations[topic];
    await callback({
      text: explanation,
      source: message.content.source,
    });

    return {
      success: true,
      text: explanation,
      data: { topic },
    };
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: { text: "What is fee abstraction?" },
      },
      {
        name: "{{name2}}",
        content: { text: "Explaining concept...", actions: ["EXPLAIN_CELO"] },
      }
    ]
  ]
};

export const celoPlugin: Plugin = {
  name: "celo-plugin",
  description: "Celo plugin with support for checking balance, transferring tokens, looking up transaction status, and displaying agent identity.",
  actions: [
    checkBalanceAction,
    transferStablecoinAction,
    getTransactionStatusAction,
    getAgentIdentityAction,
    explainCeloAction,
  ],
  providers: [],
};

export default celoPlugin;
