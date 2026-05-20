/**
 * Celo network constants and contract addresses.
 * Sources: Celopedia skill (ai-agents.md, contracts.md, builder-guide.md)
 */

// -- Chain --
export const CELO_CHAIN_ID = 42220;
export const CELO_RPC_URL = process.env.CELO_RPC_URL || "https://forno.celo.org";
export const CELOSCAN_URL = "https://celoscan.io";

// -- Stablecoins (Celo Mainnet) --
export const TOKENS = {
  CUSD: {
    address: "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`,
    symbol: "cUSD",
    name: "Celo Dollar (USDm)",
    decimals: 18,
    feeAdapter: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e" as `0x${string}`,
  },
  USDC: {
    address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as `0x${string}`,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    feeAdapter: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B" as `0x${string}`,
  },
  USDT: {
    address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as `0x${string}`,
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    feeAdapter: "0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72" as `0x${string}`,
  },
  CELO: {
    address: "0x471EcE3750Da237f93B8E339c536989b8978a438" as `0x${string}`,
    symbol: "CELO",
    name: "CELO",
    decimals: 18,
    feeAdapter: null,
  },
} as const;

// -- ERC-8004: Agent Trust Protocol (Celo Mainnet) --
export const ERC8004 = {
  identityRegistry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as `0x${string}`,
  reputationRegistry: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63" as `0x${string}`,
} as const;

// -- Default fee currency for agent transactions --
export const DEFAULT_FEE_CURRENCY = TOKENS.CUSD.feeAdapter;

// -- AgentActionLog contract (deployed via Foundry) --
// Update this address after running: forge script script/Deploy.s.sol --rpc-url celo --broadcast
export const AGENT_ACTION_LOG_ADDRESS = (process.env.AGENT_ACTION_LOG_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const AGENT_ACTION_LOG_ABI = [
  {
    name: "logAction",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_user", type: "address" },
      { name: "_actionType", type: "string" },
      { name: "_txRef", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "getActionCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// -- Agent metadata --
export const AGENT_NAME = "MiniPayBot";
export const AGENT_DESCRIPTION =
  "AI financial assistant for Celo MiniPay users. Chat to send stablecoins, check balances, or learn about Celo.";
export const AGENT_VERSION = "1.0.0";

// -- Agent wallet address (client-accessible via public env or fallback) --
export const AGENT_ADDRESS = (process.env.NEXT_PUBLIC_AGENT_ADDRESS ||
  "0x207d064161cD85351Be21ecA570807eD8bCEe0AD") as `0x${string}`;
