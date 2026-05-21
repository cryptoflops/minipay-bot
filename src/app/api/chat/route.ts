/**
 * Chat API route -- Vercel AI SDK streaming endpoint.
 * Connects OpenAI to Celo tools for real blockchain interactions.
 * Protected by x402 micropayments via Thirdweb.
 */

import { createOpenAI } from "@ai-sdk/openai";

const gaia = createOpenAI({
  baseURL: process.env.GAIA_BASE_URL || "https://0x07813ec0c4bb08ceeb1b99ddf021af4682f9459c.gaia.domains/v1",
  apiKey: process.env.GAIA_API_KEY || "empty",
});
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { SYSTEM_PROMPT } from "@/agent/system-prompt";
import { getCeloTools } from "@/agent/tools";
import { settlePayment, facilitator } from "thirdweb/x402";
import { createThirdwebClient } from "thirdweb";
import { celo } from "thirdweb/chains";
import { getAgentAddress } from "@/agent/celo-client";

export const runtime = "edge";

// Thirdweb client for x402 facilitator
const thirdwebClient = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY || "0000000000000000000000000000000000000000000000000000000000000000",
});

// x402 facilitator config
const thirdwebFacilitator = facilitator({
  client: thirdwebClient,
  serverWalletAddress: getAgentAddress(),
});

export async function POST(req: Request) {
  const hasThirdwebKey = 
    process.env.THIRDWEB_SECRET_KEY && 
    process.env.THIRDWEB_SECRET_KEY !== "0000000000000000000000000000000000000000000000000000000000000000";

  if (hasThirdwebKey) {
    const paymentData =
      req.headers.get("payment-signature") || req.headers.get("x-payment");

    // Settle x402 payment before delivering the AI response
    const paymentResult = await settlePayment({
      resourceUrl: new URL("/api/chat", req.url).toString(),
      method: "POST",
      paymentData,
      payTo: getAgentAddress(),
      network: celo,
      price: "$0.001",
      facilitator: thirdwebFacilitator,
      routeConfig: {
        description: "AI chat response from MiniPayBot",
      },
    });

    if (paymentResult.status !== 200) {
      return new Response(
        JSON.stringify(paymentResult.responseBody),
        {
          status: paymentResult.status,
          headers: paymentResult.responseHeaders,
        }
      );
    }
  } else {
    console.warn("Skipping x402 payment settlement: THIRDWEB_SECRET_KEY is not configured.");
  }

  try {
    const { messages, userAddress } = await req.json();
    console.log("Chat API invoked. User address:", userAddress, "Messages length:", messages?.length);
    console.log("Last user message:", JSON.stringify(messages?.[messages.length - 1]));

    const modelMessages = await convertToModelMessages(messages);

    const systemPrompt = userAddress 
      ? `Connected user wallet address: ${userAddress}\n\n${SYSTEM_PROMPT}` 
      : SYSTEM_PROMPT;

    const result = streamText({
      model: gaia(process.env.GAIA_MODEL || "llama"),
      system: systemPrompt,
      messages: modelMessages,
      tools: getCeloTools(userAddress),
      stopWhen: stepCountIs(5),
    });

    console.log("Stream generated successfully. Constructing UI message stream response...");
    const response = result.toUIMessageStreamResponse();
    return response;
  } catch (error) {
    console.error("FATAL ERROR in Chat API route:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
