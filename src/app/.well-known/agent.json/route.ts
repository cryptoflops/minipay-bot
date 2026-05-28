import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    type: "Agent",
    name: "MiniPayBot",
    description: "AI-powered payment assistant for MiniPay on Celo. Send, receive, and query stablecoin balances via natural language.",
    image: "https://minipay-bot.vercel.app/icon.png",
    endpoints: [
      {
        type: "a2a",
        url: "https://minipay-bot.vercel.app/.well-known/agent.json"
      },
      {
        type: "wallet",
        address: "0x207d064161cd85351be21eca570807ed8bcee0ad",
        chainId: 42220
      }
    ],
    supportedTrust: ["reputation"]
  });
}
