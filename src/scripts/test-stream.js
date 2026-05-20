const { createGoogleGenerativeAI } = require("@ai-sdk/google");
const { streamText } = require("ai");
require("dotenv").config();

async function test() {
  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    console.log("Streaming text with gemini-2.5-flash...");
    const result = streamText({
      model: google("gemini-2.5-flash"),
      prompt: "Hello Gemini! How are you doing? Answer in one short sentence.",
    });

    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
    console.log("\nSUCCESS!");
  } catch (err) {
    console.error("ERROR generating stream:", err);
  }
}

test();
