# MiniPayBot

> Your AI financial assistant for Celo MiniPay. Chat to send stablecoins, check balances, or learn about Celo — every action is an on-chain Celo transaction.

[![Live on Celo Mainnet](https://img.shields.io/badge/Celo-Mainnet-brightgreen)](https://celoscan.io)
[![ERC-8004](https://img.shields.io/badge/ERC--8004-Agent%20Trust-yellow)](https://www.8004.org)

## What is MiniPayBot?

MiniPayBot is an AI-powered financial assistant that operates on the Celo blockchain. It uses natural language to help users:

- **Send stablecoins** (cUSD, USDC) to any address
- **Check wallet balances** across CELO, cUSD, and USDC
- **Look up transactions** on CeloScan
- **Learn about Celo** -- fee abstraction, stablecoins, MiniPay, ERC-8004

Every interaction creates a **real, verifiable on-chain transaction** on Celo mainnet. The agent pays network fees in stablecoins via Celo's fee abstraction, so it never needs native CELO for gas.

## Live Demo

**[Try MiniPayBot →](https://minipay-bot.vercel.app/chat)**

## Architecture

```
User (MiniPay / Browser)
    ↓ chat message
Next.js API Route (/api/chat)
    ├── AI SDK (streaming)
    ├── OpenAI GPT-4o-mini (reasoning)
    └── Celo Tools (viem)
        ├── checkBalance     → readContract (ERC-20)
        ├── transferStable   → writeContract (feeCurrency: cUSD adapter)
        ├── getAgentIdentity → ERC-8004 Identity Registry
        └── explainCelo      → Static knowledge base
    ↓ signed transaction
Celo Mainnet (Chain ID: 42220)
    └── Fee paid in cUSD via adapter 0x4806...
```

## Deployed Contracts (Celo Mainnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| AgentActionLog | `0xC30240D5ce3CD2AcB83968592AA5b9c8aE8Eb3cC` | On-chain audit trail of agent actions |
| ERC-8004 Identity | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | Agent identity registry |
| ERC-8004 Reputation | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` | Agent reputation system |

## Tech Stack

- **Next.js 15** -- React framework with App Router
- **Vercel AI SDK** -- LLM streaming and tool calling
- **viem** -- TypeScript Ethereum client
- **OpenAI GPT-4o-mini** -- Reasoning engine
- **ERC-8004** -- On-chain agent identity (Agent Trust Protocol)
- **Celo Fee Abstraction** -- Gas paid in cUSD (CIP-64)
- **Tailwind CSS** -- Styling
- **Foundry** -- Smart contract development

## MiniPay Compatible

MiniPayBot detects the MiniPay WebView environment and auto-connects. It follows all MiniPay UI copy rules:
- Uses "network fee" instead of "gas"
- Uses "stablecoin" instead of "crypto"
- Never displays or requires CELO token

## Getting Started

```bash
git clone https://github.com/cryptoflops/minipay-bot.git
cd minipay-bot
npm install
cp .env.example .env
# Add your OPENAI_API_KEY and AGENT_PRIVATE_KEY
npm run dev
```

Visit `http://localhost:3000/chat` to start chatting with the bot.

## Celo Proof-of-Ship

This project is submitted to the **AI Powered Apps & Agents** track in [Celo Proof-of-Ship](https://talent.app/~/earn/celo-proof-of-ship).

- **KarmaGAP**: [MiniPayBot on KarmaGAP](https://gap.karmahq.xyz)
- **Track**: AI Powered Apps & Agents
- **One-liner**: AI financial assistant for Celo MiniPay -- chat to send stablecoins, check balances, or manage savings

## License

MIT

