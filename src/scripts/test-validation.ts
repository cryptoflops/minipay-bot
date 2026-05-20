import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import * as dotenv from "dotenv";
dotenv.config();

async function testShape(toolContent: any) {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    console.log("Testing tool content shape:", JSON.stringify(toolContent, null, 2));
    const result = await generateText({
      model: google("gemini-flash-latest"),
      messages: [
        { role: "user", content: "Hello" },
        {
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolCallId: "test-call-id",
              toolName: "test-tool",
              input: {}
            }
          ]
        },
        {
          role: "tool",
          content: toolContent
        }
      ],
      tools: {
        "test-tool": {
          description: "A test tool",
          parameters: { type: "object", properties: {} },
          execute: async () => "result"
        }
      }
    });
    console.log("PASSED! Result:", result.text);
  } catch (err: any) {
    console.log("FAILED:", err.message);
    if (err.cause && err.cause.issues) {
      console.log("ISSUES:", JSON.stringify(err.cause.issues.map((issue: any) => ({ path: issue.path, message: issue.message })), null, 2));
    } else {
      console.log("FULL ERROR:", err);
    }
  }
}

async function run() {
  console.log("--- TEST C: output as { type: 'json', value: ... } ---");
  await testShape([
    {
      type: "tool-result",
      toolCallId: "test-call-id",
      toolName: "test-tool",
      output: {
        type: "json",
        value: "some result"
      }
    }
  ]);
}

run();
