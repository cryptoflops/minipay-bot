// src/scripts/bootstrap-self-visa.ts
import { getSelfAgent } from "../lib/self-agent";

async function main() {
  const agent = getSelfAgent();
  console.log("Setting agent card for agent address:", agent.address);
  const txHash = await agent.setAgentCard({
    name: "MiniPayBot",
    description: "AI-powered payment assistant for MiniPay on Celo. Send, receive, and query stablecoin balances via natural language.",
    url: "https://minipay-bot.vercel.app",
    skills: [
      { id: "transfer", name: "transfer", description: "Send cUSD or USDC to any Celo address" },
      { id: "balance", name: "balance", description: "Query token balances on Celo" },
      { id: "tx-lookup", name: "tx-lookup", description: "Look up Celo transaction details" },
    ],
  });
  console.log("Agent card set successfully!");
  console.log("Tx Hash:", txHash);
  console.log("Visit https://app.ai.self.xyz/agents/107 and click Refresh Status");
}

main().catch((err) => {
  console.error("Failed to bootstrap self visa:", err);
});
