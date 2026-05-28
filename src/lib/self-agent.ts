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
