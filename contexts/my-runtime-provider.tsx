"use client";
import type { ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { backendUrl } from "@/lib/constants";
const MyModelAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    console.log("Backend url:", backendUrl);
    const lastUserMessage = messages.filter((msg) => msg.role === "user").pop()
      ?.content?.[0];
    const userMessageText =
      typeof lastUserMessage === "object" && "text" in lastUserMessage
        ? lastUserMessage.text
        : "";
    const result = await fetch(`${backendUrl}/api/chat/multiagent_graph`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessageText,
      }),
      signal: abortSignal,
    });
    if (!result.body) {
      throw new Error("Response body is null");
    }
    const reader = result.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    let isJson = false;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        text += chunk;
        if (!isJson && text.trim().startsWith("{")) {
          isJson = true;
        }
        if (isJson) {
          try {
            const jsonResponse = JSON.parse(text);
            yield {
              content: [
                {
                  type: "text",
                  text:
                    `**Technical Knowledge:**\n${jsonResponse.technical_knowledge}\n\n` +
                    `**Company Design:**\n${jsonResponse.company_design}\n\n` +
                    `**Current Operation:**\n${jsonResponse.current_operation}\n\n` +
                    `**Engineer Decision:**\n${jsonResponse.engineer_decision}`,
                },
              ],
            };
          } catch (e) {
            yield {
              content: [{ type: "text", text: "Processing..." }],
            };
          }
        } else {
          yield {
            content: [{ type: "text", text }],
          };
        }
      }
    } catch (error) {
      console.error("Error reading stream:", error);
      yield {
        content: [{ type: "text", text: "Error processing response." }],
      };
    }
  },
};
export function MyRuntimeProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const runtime = useLocalRuntime(MyModelAdapter);
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
