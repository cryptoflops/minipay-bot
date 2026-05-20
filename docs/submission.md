# MiniPayBot -- Proof-of-Ship Submission

## Short Description

AI financial assistant for Celo MiniPay — chat to send stablecoins, check balances, or manage savings. Every action is a real on-chain Celo transaction.

## Track

AI Powered Apps & Agents

## Problem

MiniPay has 14M+ users across 60+ countries, but interacting with blockchain features still requires understanding wallets, addresses, and transaction flows. Users in emerging markets need simpler interfaces for financial actions. Existing AI agents don't leverage Celo-specific features like fee abstraction and local stablecoins.

**Competitors**: Generic chatbot wallets (none specifically built for Celo/MiniPay ecosystem with ERC-8004 identity).

## Solution

MiniPayBot is a conversational AI agent that:

1. **Understands natural language** -- users say "send 5 cUSD to Alice" instead of navigating complex UIs
2. **Executes real transactions** -- every action creates a verifiable on-chain tx on Celo mainnet
3. **Uses fee abstraction** -- pays gas in stablecoins so users (and the agent) never need native CELO
4. **Has on-chain identity** -- registered via ERC-8004 Agent Trust Protocol for verifiable AI identity
5. **Educates users** -- explains Celo concepts in plain language when asked

## Architecture

See [docs/architecture.md](./architecture.md) for the full system diagram.

Key components:
- **Next.js 15** with App Router
- **Vercel AI SDK** for LLM streaming and tool calling
- **viem** for Celo mainnet interactions
- **ERC-8004** for on-chain agent identity
- **Celo Fee Abstraction** (CIP-64) for stablecoin gas payments
- **OpenAI GPT-4o-mini** for reasoning

## Milestones (This Month)

1. ✅ Scaffolded Next.js project with AI SDK and Celo tooling
2. ✅ Implemented 5 Celo tools (balance, transfer, tx lookup, identity, education)
3. ✅ Built glassmorphism chat UI with inline tool result rendering
4. ✅ Created landing page with architecture diagram and feature cards
5. ✅ Deployed AgentActionLog smart contract to Celo mainnet
6. ✅ Built ERC-8004 identity integration (registration + metadata)
7. ✅ Created submission documentation (README, architecture, deck)
8. ⬜ Register agent on-chain via ERC-8004
9. ⬜ Deploy to Vercel and test in MiniPay WebView

## Asset Links

- **Logo**: See landing page hero
- **Screenshots**: Available at /chat page
- **Video**: TBD (1+2+1 format, own voice)
- **Presentation**: See docs/deck.md

## Links

- **Live Demo**: https://minipay-bot.vercel.app
- **GitHub**: https://github.com/cryptoflops/minipay-bot
- **KarmaGAP**: TBD
- **CeloScan (Agent)**: TBD
