/**
 * Chat API route -- proxies user messages to the remote ElizaOS agent.
 * Protected by x402 micropayments via Thirdweb.
 */

import { settlePayment, facilitator } from "thirdweb/x402";
import { createThirdwebClient } from "thirdweb";
import { celo } from "thirdweb/chains";
import { getAgentAddress } from "@/agent/celo-client";

export const runtime = "edge";

// ElizaOS remote server config
const ELIZA_BASE_URL = process.env.ELIZA_BASE_URL || "http://18.195.127.114:3000";
const ELIZA_AGENT_ID = process.env.ELIZA_AGENT_ID || "7295663b-da7d-0086-8480-f5f429cb5d26";

// In-memory session map (address -> sessionId)
// For a production setup you would use a persistent store
const sessionMap = new Map<string, string>();

// Thirdweb client for x402 facilitator
const thirdwebClient = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY || "0000000000000000000000000000000000000000000000000000000000000000",
});

// x402 facilitator config
const thirdwebFacilitator = facilitator({
  client: thirdwebClient,
  serverWalletAddress: getAgentAddress(),
});

/**
 * Creates a new ElizaOS session for a given user address.
 * Returns the sessionId.
 */
async function createSession(userAddress: string): Promise<string> {
  // Use the user address to derive a deterministic UUID-like userId
  const userId = addressToUuid(userAddress);

  const res = await fetch(`${ELIZA_BASE_URL}/api/messaging/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agentId: ELIZA_AGENT_ID,
      userId,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create ElizaOS session (${res.status}) -- ${errText}`);
  }

  const data = await res.json();
  return data.sessionId;
}

/**
 * Sends a message to an existing ElizaOS session and returns the agent response text.
 */
async function sendMessageToSession(sessionId: string, content: string): Promise<string> {
  const res = await fetch(`${ELIZA_BASE_URL}/api/messaging/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      transport: "http",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElizaOS message failed (${res.status}) -- ${errText}`);
  }

  const data = await res.json();

  // Primary path: ElizaOS returns { success, agentResponse: { text: "..." } }
  if (data.agentResponse?.text) {
    return data.agentResponse.text;
  }

  // Fallback: array of messages
  if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
    const lastMsg = data.messages[data.messages.length - 1];
    return lastMsg?.content?.text || lastMsg?.content || JSON.stringify(lastMsg);
  }

  // Other fallbacks
  if (data.text) return data.text;
  if (data.content?.text) return data.content.text;
  if (data.content) return typeof data.content === "string" ? data.content : JSON.stringify(data.content);
  if (data.response) return typeof data.response === "string" ? data.response : JSON.stringify(data.response);

  return JSON.stringify(data);
}

/**
 * Convert an Ethereum address into a UUID v4 format string.
 * This is deterministic so the same address always maps to the same userId.
 */
function addressToUuid(address: string): string {
  // Pad the address (without 0x) to fill UUID slots
  const hex = address.replace("0x", "").toLowerCase().padEnd(32, "0");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    "4" + hex.slice(13, 16), // version 4
    "8" + hex.slice(17, 20), // variant bits
    hex.slice(20, 32),
  ].join("-");
}

/**
 * Get or create a session for the given user address.
 */
async function getOrCreateSession(userAddress: string): Promise<string> {
  const existing = sessionMap.get(userAddress);
  if (existing) {
    // Verify the session is still alive
    try {
      const checkRes = await fetch(`${ELIZA_BASE_URL}/api/messaging/sessions/${existing}`);
      if (checkRes.ok) {
        return existing;
      }
    } catch {
      // Session expired or unreachable, create a new one
    }
    sessionMap.delete(userAddress);
  }

  const sessionId = await createSession(userAddress);
  sessionMap.set(userAddress, sessionId);
  return sessionId;
}

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
    console.warn("Skipping x402 payment settlement -- THIRDWEB_SECRET_KEY is not configured.");
  }

  try {
    const { messages, userAddress } = await req.json();
    const addr = userAddress || "0x0000000000000000000000000000000000000000";
    console.log("Chat API invoked. User address:", addr, "Messages length:", messages?.length);

    // Extract the last user message text
    const lastUserMsg = messages?.filter((m: any) => m.role === "user").pop();
    let userText = "";

    if (lastUserMsg) {
      if (typeof lastUserMsg.content === "string") {
        userText = lastUserMsg.content;
      } else if (Array.isArray(lastUserMsg.parts)) {
        // Vercel AI SDK v4+ uses parts array
        userText = lastUserMsg.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join(" ");
      } else if (Array.isArray(lastUserMsg.content)) {
        userText = lastUserMsg.content
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join(" ");
      }
    }

    if (!userText) {
      return new Response(JSON.stringify({ error: "No user message found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Extracted user text:", userText);

    // Get or create an ElizaOS session for this user
    const sessionId = await getOrCreateSession(addr);
    console.log("Using ElizaOS session:", sessionId);

    // Send the message to ElizaOS and get the response
    const agentResponse = await sendMessageToSession(sessionId, userText);
    console.log("Agent response received, length:", agentResponse.length);

    // Return in Vercel AI SDK UIMessageStreamResponse format
    // This format is what useChat with DefaultChatTransport expects
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Vercel AI SDK stream protocol
        // Send a text part
        controller.enqueue(encoder.encode(`0:${JSON.stringify(agentResponse)}\n`));
        // Send finish message
        controller.enqueue(encoder.encode(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    });
  } catch (error) {
    console.error("FATAL ERROR in Chat API route:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
