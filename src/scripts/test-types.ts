import { CoreToolMessage } from "ai";

const msg: CoreToolMessage = {
  role: "tool",
  content: [
    {
      type: "tool-result",
      toolCallId: "123",
      toolName: "abc",
      result: "some-result"
    }
  ]
};

console.log("TypeScript checked successfully!");
