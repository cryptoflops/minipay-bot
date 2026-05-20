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

    const messages: any[] = [{ role: "user", content: "Can you explain Celo using the explainCelo tool?" }];

    console.log("Starting manual loop step 1...");
    const result1 = await generateText({
      model: google("gemini-flash-latest"),
      system: SYSTEM_PROMPT,
      messages,
      tools: celoTools,
    });

    console.log("Step 1 finish reason:", result1.finishReason);
    console.log("Step 1 text:", result1.text);
    console.log("Step 1 tool calls:", JSON.stringify(result1.toolCalls));

    if (result1.toolCalls && result1.toolCalls.length > 0) {
      // 1. Add assistant message with tool calls
      messages.push({
        role: "assistant",
        content: result1.toolCalls.map(tc => ({
          type: "tool-call",
          toolCallId: tc.toolCallId,
          toolName: tc.toolName,
          input: tc.input || (tc as any).args,
          providerOptions: tc.providerMetadata,
        })),
      });

      // 2. Execute tools and add tool result messages
      const toolResults = [];
      for (const tc of result1.toolCalls) {
        const toolInstance = (celoTools as any)[tc.toolName];
        if (toolInstance && toolInstance.execute) {
          console.log(`Executing tool ${tc.toolName}...`);
          const args = tc.args || (tc as any).input;
          const output = await toolInstance.execute(args);
          console.log(`Tool output:`, JSON.stringify(output));
          toolResults.push({
            type: "tool-result",
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            output: {
              type: "json",
              value: output,
            },
          });
        }
      }

      messages.push({
        role: "tool",
        content: toolResults,
      });

      console.log("Waiting 5 seconds to prevent rate limit before Step 2...");
      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log("Starting manual loop step 2 with messages:", JSON.stringify(messages, null, 2));
      const result2 = await generateText({
        model: google("gemini-flash-latest"),
        system: SYSTEM_PROMPT,
        messages,
        tools: celoTools,
      });

      console.log("Step 2 finish reason:", result2.finishReason);
      console.log("Step 2 text:", result2.text);
    }
  } catch (err) {
    console.error("ERROR in manual loop:", err);
  }
}

test();
