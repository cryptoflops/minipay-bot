const { createGoogleGenerativeAI } = require("@ai-sdk/google");
const { generateText } = require("ai");
require("dotenv").config();

async function test() {
  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    console.log("Generating text with gemini-2.5-flash...");
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: "Hello Gemini! How are you doing? Answer in one short sentence.",
    });

    console.log("SUCCESS! Response:");
    console.log(text);
  } catch (err) {
    console.error("ERROR generating text:", err);
  }
}

test();
