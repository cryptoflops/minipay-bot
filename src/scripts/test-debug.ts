import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import * as dotenv from "dotenv";
dotenv.config();

import { SYSTEM_PROMPT } from "../agent/system-prompt";
import { celoTools } from "../agent/tools";

async function test() {
  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    console.log("Generating text with gemini-2.5-pro...");
    const result = await generateText({
      model: google("gemini-2.5-pro"),
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: "Explain Celo in one short sentence" }],
      tools: celoTools,
      maxSteps: 5,
      onStepFinish({ text, toolCalls, toolResults, finishReason }) {
        console.log("--- STEP FINISHED ---");
        console.log("Finish Reason:", finishReason);
        console.log("Text generated:", text);
        console.log("Tool calls:", JSON.stringify(toolCalls));
        console.log("Tool results:", JSON.stringify(toolResults));
      },
    });

    console.log("Final text:", result.text);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

test();
