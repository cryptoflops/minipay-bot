import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, tool } from "ai";
import { z } from "zod";
import * as dotenv from "dotenv";
dotenv.config();

async function test() {
  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    console.log("Testing with simple weather tool...");
    const result = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: "What is the weather in Paris?",
      tools: {
        getWeather: tool({
          description: "Get the weather for a location",
          inputSchema: z.object({ city: z.string() }),
          execute: async ({ city }) => {
            console.log(`[TOOL] getWeather called for ${city}`);
            return { temperature: 22, condition: "Sunny" };
          },
        }),
      },
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
    console.error("ERROR:", err);
  }
}

test();
