# MiniPayBot Architecture

## System Overview

MiniPayBot is a conversational AI agent that executes real blockchain transactions on Celo mainnet. It combines a large language model (OpenAI GPT-4o-mini) with on-chain tools to create an interactive financial assistant.

## Component Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                         │
│  ┌──────────────┐  ┌───────────────────────────┐   │
│  │ Landing Page  │  │      Chat Interface       │   │
│  │  (page.tsx)   │  │  (chat/page.tsx)          │   │
│  │              │  │  - useChat() hook          │   │
│  │  Hero + CTA  │  │  - ToolResult renderers    │   │
│  │  Features    │  │  - Suggestion pills        │   │
│  │  Architecture│  │  - Streaming responses     │   │
│  └──────────────┘  └───────────────────────────┘   │
└─────────────────────────┬───────────────────────────┘
                          │ POST /api/chat
┌─────────────────────────▼───────────────────────────┐
│                   API Layer                         │
│  ┌──────────────────────────────────────────────┐   │
│  │         Chat Route (api/chat/route.ts)        │   │
│  │  - Vercel AI SDK streamText()                │   │
│  │  - System prompt (MiniPayBot personality)    │   │
│  │  - Tool routing (maxSteps: 5)               │   │
│  └──────────────────────┬───────────────────────┘   │
│                         │                           │
│  ┌──────────────────────▼───────────────────────┐   │
│  │            Celo Tools (tools.ts)              │   │
│  │  ┌─────────────┐  ┌──────────────────────┐  │   │
│  │  │ checkBalance │  │ transferStablecoin   │  │   │
│  │  │ (read-only)  │  │ (writes to chain)    │  │   │
│  │  └─────────────┘  └──────────────────────┘  │   │
│  │  ┌─────────────┐  ┌──────────────────────┐  │   │
│  │  │ getTxStatus  │  │ getAgentIdentity     │  │   │
│  │  └─────────────┘  └──────────────────────┘  │   │
│  │  ┌─────────────┐                            │   │
│  │  │ explainCelo  │                            │   │
│  │  └─────────────┘                            │   │
│  └──────────────────────┬───────────────────────┘   │
│                         │                           │
│  ┌──────────────────────▼───────────────────────┐   │
│  │         Celo Client (celo-client.ts)          │   │
│  │  - viem PublicClient (read)                  │   │
│  │  - viem WalletClient (write, agent wallet)   │   │
│  │  - Fee abstraction (feeCurrency: cUSD)       │   │
│  └──────────────────────┬───────────────────────┘   │
└─────────────────────────┬───────────────────────────┘
                          │ JSON-RPC
┌─────────────────────────▼───────────────────────────┐
│              Celo Mainnet (42220)                    │
│  ┌───────────────┐  ┌──────────────────────────┐   │
│  │  ERC-20 cUSD   │  │  ERC-8004 Identity       │   │
│  │  0x765D...     │  │  0x8004A169...            │   │
│  └───────────────┘  └──────────────────────────┘   │
│  ┌───────────────┐  ┌──────────────────────────┐   │
│  │  ERC-20 USDC   │  │  ERC-8004 Reputation     │   │
│  │  0xcebA...     │  │  0x8004BAa1...            │   │
│  └───────────────┘  └──────────────────────────┘   │
│  ┌───────────────┐                                 │
│  │ AgentActionLog │                                 │
│  │  (deployed)    │                                 │
│  └───────────────┘                                 │
└─────────────────────────────────────────────────────┘
```

## Key Design Decisions

### Standalone Next.js over ElizaOS
We chose a standalone Next.js project over the ElizaOS framework because:
1. Matches our existing project stack (CeloSaver, ProofPay, MarketPulse are all Next.js)
2. Deploys to Vercel with zero config
3. Judges get a fast, accessible web UI to test
4. Uses exact Celo SDK patterns from official docs (viem, fee abstraction)

### AI SDK for LLM Integration
The AI SDK (maintained by Vercel, but platform-agnostic) provides streaming responses with built-in tool calling. When the LLM decides to check a balance or send tokens, it invokes a tool that executes a real Celo transaction. The result is streamed back inline. This runs natively on Cloudflare's Edge runtime.

### Fee Abstraction for Agent Treasury
The agent wallet only holds stablecoins (cUSD). All transactions use Celo's fee abstraction (CIP-64) with the cUSD adapter `0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e` so the agent never needs native CELO for gas.

### ERC-8004 for Verifiable Identity
The agent is registered on-chain via the ERC-8004 Agent Trust Protocol. This gives it a verifiable NFT identity and enables reputation tracking through the Reputation Registry.

## Libraries and Frameworks

| Library | Version | Purpose |
|---------|---------|---------|
| Next.js | 15.x | React framework, App Router |
| ai (AI SDK) | 6.x | LLM streaming, tool calling |
| @ai-sdk/openai | 1.x | OpenAI model provider |
| viem | 2.x | Ethereum/Celo client |
| react-markdown | 9.x | Markdown rendering in chat |
| tailwindcss | 4.x | Utility-first CSS |
| Foundry | latest | Smart contract toolchain |

## Contract Addresses (Celo Mainnet)

| Contract | Address |
|----------|---------|
| cUSD (USDm) | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| USDC | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` |
| cUSD Fee Adapter | `0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e` |
| USDC Fee Adapter | `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B` |
| ERC-8004 Identity | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| ERC-8004 Reputation | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| AgentActionLog | `0x4D50AE9B8A62B39Cd73d6C849ac0c8d20E1600a1` |
