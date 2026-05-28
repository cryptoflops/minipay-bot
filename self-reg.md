# For MiniPayBot we need to register agent on Self (done)

Now we need to integrate it to MiniPayBot project
[https://agentvisa.self.xyz/integration](https://agentvisa.self.xyz/integration)
[https://github.com/selfxyz/self-agent-id](https://github.com/selfxyz/self-agent-id)
To be eligible for AI Agents Prize Pool Requirements:
The project uses agents that: • registered with 8004 • registered with Self Agent ID • wallet with onchain tx
[https://celoplatform.notion.site/Proof-of-Ship-17cd5cb803de8060ba10d22a72b549f8](https://celoplatform.notion.site/Proof-of-Ship-17cd5cb803de8060ba10d22a72b549f8)

Here is the complete integration plan for Self Agent ID into MiniPayBot, based on my analysis of both the [selfxyz/self-agent-id](https://github.com/selfxyz/self-agent-id) SDK  and the [cryptoflops/minipay-bot](https://github.com/cryptoflops/minipay-bot) codebase .

***

## Status: What's Already Done

From the screenshots, your agent (`Agent #107`, wallet `0x207d...e0ad`) is:

- ✅ Registered on-chain with Self Agent ID (Mainnet, Celo)
- ✅ Verified at Level 100, expires May 21, 2027
- ⚠️ **Celo Agent Visa: None** — 0 transactions, needs at least 1 on-chain tx to qualify for Tourist visa

***

## Step 1 — Install the SDK

In the `minipay-bot` project root:

```bash
npm install @selfxyz/agent-sdk
```


***

## Step 2 — Add Environment Variables

Update your `.env` (and `.env.example`) to add the agent's private key for Self signing. This key belongs to the registered wallet `0x207d...e0ad`:

```env
# Self Agent ID — private key for the registered agent wallet
AGENT_PRIVATE_KEY=0x<your_agent_private_key_here>
```

> **Security:** This key is already used by `celo-client.ts` to power the existing `getAgentAccount()` function . No new key is needed — the same wallet is registered with Self.

***

## Step 3 — Create `src/lib/self-agent.ts`

This module wraps the SDK and exposes a singleton `SelfAgent` instance:

```typescript
/**
 * Self Agent ID integration for MiniPayBot.
 * Agent #107 — verified on Celo Mainnet.
 * Registry: 0xaC3DF9ABf80d0F5c020C06B04Cced27763355944
 */
import { SelfAgent } from "@selfxyz/agent-sdk";

let _agent: SelfAgent | null = null;

export function getSelfAgent(): SelfAgent {
  if (!_agent) {
    const key = process.env.AGENT_PRIVATE_KEY;
    if (!key) throw new Error("AGENT_PRIVATE_KEY is not set");
    _agent = new SelfAgent({ privateKey: key as `0x${string}`, network: "mainnet" });
  }
  return _agent;
}

/**
 * Checks that the agent is registered and verified on-chain.
 * Logs a warning if not — does not throw so the app degrades gracefully.
 */
export async function assertSelfAgentRegistered(): Promise<void> {
  const agent = getSelfAgent();
  const [registered, info] = await Promise.all([
    agent.isRegistered(),
    agent.getInfo(),
  ]);

  if (!registered) {
    console.warn("[Self] Agent is NOT registered on-chain. Visit app.ai.self.xyz to register.");
    return;
  }

  console.log(`[Self] Agent #${info.agentId} verified=${info.isVerified} address=${agent.address}`);
}

/**
 * Signs an outgoing HTTP request using Self Agent ID headers.
 * Use this when calling external APIs that verify Self signatures.
 */
export async function selfSignedHeaders(
  method: string,
  url: string,
  body?: string
): Promise<Record<string, string>> {
  return getSelfAgent().signRequest(method, url, body ?? "");
}
```


***

## Step 4 — Update `src/app/api/chat/route.ts`

Add Self Agent ID verification to the chat route. The agent signs its own outgoing requests to ElizaOS, proving on-chain identity. Insert the highlighted block:

```typescript
import { getSelfAgent, assertSelfAgentRegistered } from "@/lib/self-agent";

// Add at the top of the POST handler, before the payment settlement:
export async function POST(req: Request) {
  // --- Self Agent ID: verify agent is registered on-chain ---
  // (runs async in background — does not block response)
  assertSelfAgentRegistered().catch(console.error);

  // Sign the outgoing ElizaOS request with Self Agent headers
  const selfHeaders = await getSelfAgent()
    .signRequest("POST", `${ELIZA_BASE_URL}/api/messaging/sessions`, "")
    .catch(() => ({})); // graceful fallback if signing fails

  // ... existing x402 payment code ...
```

Then, pass `selfHeaders` when calling ElizaOS in `createSession()` and `sendMessageToSession()`:

```typescript
async function createSession(userAddress: string): Promise<string> {
  const agent = getSelfAgent();
  const signedHeaders = await agent.signRequest(
    "POST",
    `${ELIZA_BASE_URL}/api/messaging/sessions`,
    JSON.stringify({ agentId: ELIZA_AGENT_ID, userId: addressToUuid(userAddress) })
  ).catch(() => ({}));

  const res = await fetch(`${ELIZA_BASE_URL}/api/messaging/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...signedHeaders,  // <-- Self Agent ID auth headers
      ...(process.env.ELIZA_SERVER_AUTH_TOKEN
        ? { Authorization: `Bearer ${process.env.ELIZA_SERVER_AUTH_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({ agentId: ELIZA_AGENT_ID, userId: addressToUuid(userAddress) }),
  });
  // ... rest unchanged
}
```


***

## Step 5 — Add a `GET /api/agent-card` Route

This exposes the machine-readable A2A agent card required by the Self ecosystem. Create `src/app/api/agent-card/route.ts`:

```typescript
import { getSelfAgent } from "@/lib/self-agent";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const agent = getSelfAgent();

    // Set or refresh the on-chain agent card
    await agent.setAgentCard({
      name: "MiniPayBot",
      description: "AI-powered payment assistant for MiniPay on Celo. Send, receive, and query stablecoin balances via natural language.",
      url: "https://minipay-bot.vercel.app",
      skills: [
        { name: "transfer", description: "Send cUSD or USDC to any Celo address" },
        { name: "balance", description: "Query token balances on Celo" },
        { name: "tx-lookup", description: "Look up Celo transaction details" },
      ],
    });

    const card = await agent.getAgentCard();
    return NextResponse.json(card);
  } catch (err) {
    console.error("[AgentCard] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```


***

## Step 6 — Trigger an On-Chain Transaction (Celo Agent Visa)

Your Self Agent Visa is currently `None` because the agent wallet has 0 transactions. You need **at least 1 on-chain tx** from `0x207d...e0ad` to qualify for the Tourist visa tier.[^1]

The fastest way is to run the agent card write from Step 5 — it sends a transaction from your wallet. Alternatively, trigger any small on-chain action from the agent wallet (e.g., a 0-value transfer or direct call to the registry).

You can also call this once from a script:

```typescript
// scripts/bootstrap-self-visa.ts
import { getSelfAgent } from "../src/lib/self-agent";

async function main() {
  const agent = getSelfAgent();
  const txHash = await agent.setAgentCard({
    name: "MiniPayBot",
    description: "AI payment assistant on Celo MiniPay",
    url: "https://minipay-bot.vercel.app",
  });
  console.log("Agent card set, tx:", txHash);
  console.log("Visit https://app.ai.self.xyz/agents/107 and click Refresh Status");
}

main().catch(console.error);
```

Run it with: `npx ts-node --project tsconfig.json src/scripts/bootstrap-self-visa.ts`

***

## Step 7 — Fill in the Proof-of-Ship Form

Based on the screenshots:[^2][^3][^1]


| Field | Value |
| :-- | :-- |
| **Self Agent ID NFT** | Agent \#107 |
| **Link to agent on 8004.io** | Your ElizaOS endpoint (e.g., `http://18.195.127.114:3000` or the public URL) |
| **Agent's Wallet on Celo** | `0x207d064161cd85351be21eca570807ed8bcee0ad` |

The "Link to agent on 8004.io" field (currently marked as required/missing in the form) needs to be the publicly accessible URL where your ElizaOS agent is running — formatted as `https://8004.io/agents/<your-agent-id>` if you've published there, or directly the agent's API URL.

***

## Summary Checklist

- [x] Agent \#107 registered on Self — Level 100 verified
- [ ] `npm install @selfxyz/agent-sdk`
- [ ] Add `src/lib/self-agent.ts`
- [ ] Patch `src/app/api/chat/route.ts` with signing headers
- [ ] Add `src/app/api/agent-card/route.ts`
- [ ] Run `bootstrap-self-visa.ts` to generate the first on-chain tx → Tourist visa
- [ ] Submit 8004.io agent link in the Proof-of-Ship form

<div align="center">⁂</div>

[^1]: Screenshot-2026-05-28-at-07.04.28.jpg

[^2]: Screenshot-2026-05-28-at-06.55.08.jpg

[^3]: Screenshot-2026-05-28-at-06.54.51.jpg

