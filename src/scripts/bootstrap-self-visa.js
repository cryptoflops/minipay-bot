const fs = require('fs');
const path = require('path');
const { SelfAgent } = require('@selfxyz/agent-sdk');

// Parse .env manually
const envPath = path.join(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
let privateKey = '';
for (const line of lines) {
  if (line.startsWith('AGENT_PRIVATE_KEY=')) {
    privateKey = line.split('=')[1].trim();
    break;
  }
}

if (!privateKey) {
  console.error("AGENT_PRIVATE_KEY not found in .env");
  process.exit(1);
}

async function main() {
  const agent = new SelfAgent({ privateKey, network: 'mainnet' });
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
