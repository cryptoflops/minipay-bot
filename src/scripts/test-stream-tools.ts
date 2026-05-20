import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import * as dotenv from "dotenv";
dotenv.config();

import { SYSTEM_PROMPT } from "../agent/system-prompt";
import { celoTools } from "../agent/tools";

async function test() {
  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    console.log("Streaming text with gemini-2.5-flash and tools (maxSteps: 5)...");
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: "Explain Celo in one short sentence" }],
      tools: celoTools,
      maxSteps: 5,
    });

    console.log("Awaiting full stream chunks...");
    for await (const chunk of result.fullStream) {
      console.log("CHUNK TYPE:", chunk.type, JSON.stringify(chunk));
    }
    console.log("\nSUCCESS!");
  } catch (err) {
    console.error("ERROR generating stream:", err);
  }
}

test();
