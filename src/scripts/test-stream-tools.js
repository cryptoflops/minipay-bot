const { createGoogleGenerativeAI } = require("@ai-sdk/google");
const { streamText } = require("ai");
require("dotenv").config();

// We need to mock SYSTEM_PROMPT and celoTools or import them
const { SYSTEM_PROMPT } = require("../src/agent/system-prompt");
const { celoTools } = require("../src/agent/tools");

async function test() {
  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    console.log("Streaming text with gemini-2.5-flash and tools...");
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: "Explain Celo in one short sentence" }],
      tools: celoTools,
    });

    console.log("Awaiting chunks...");
    for await (const chunk of result.fullStream) {
      console.log("CHUNK TYPE:", chunk.type, JSON.stringify(chunk));
    }
    console.log("\nSUCCESS!");
  } catch (err) {
    console.error("ERROR generating stream:", err);
  }
}

test();
