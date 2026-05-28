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
        { id: "transfer", name: "transfer", description: "Send cUSD or USDC to any Celo address" },
        { id: "balance", name: "balance", description: "Query token balances on Celo" },
        { id: "tx-lookup", name: "tx-lookup", description: "Look up Celo transaction details" },
      ],
    });

    const card = await agent.getAgentCard();
    return NextResponse.json(card);
  } catch (err) {
    console.error("[AgentCard] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
