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

    console.log("Generating text with gemini-2.5-flash and tools (maxSteps: 5)...");
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: "Explain Celo in one short sentence" }],
      tools: celoTools,
      maxSteps: 5,
    });

    console.log("SUCCESS! Steps details:");
    result.steps.forEach((step, i) => {
      console.log(`Step ${i + 1}:`);
      console.log(`- Finish Reason: ${step.finishReason}`);
      console.log(`- Text: ${step.text}`);
      console.log(`- Tool Calls: ${JSON.stringify(step.toolCalls)}`);
    });
    console.log("Final Text Output:", result.text);
  } catch (err) {
    console.error("ERROR generating text:", err);
  }
}

test();
