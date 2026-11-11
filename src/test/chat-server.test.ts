import { afterEach, describe, expect, it } from "vitest";
import { handleChat } from "@/lib/ai/chat.server";

const KEYS = ["GOOGLE_GENERATIVE_AI_API_KEY", "GEMINI_API_KEY"] as const;
const saved: Record<string, string | undefined> = {};

function fakeRequest(body: unknown) {
  return { json: async () => body } as unknown as Request;
}

describe("chat assistant", () => {
  afterEach(() => {
    for (const key of KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("answers a missing Gemini key inside the chat instead of failing the request", async () => {
    for (const key of KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }

    const res = await handleChat(
      fakeRequest({ messages: [{ id: "1", role: "user", parts: [{ type: "text", text: "Da li je mlijeko dobro za djecu?" }] }], lang: "sr" }),
    );

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("GOOGLE_GENERATIVE_AI_API_KEY");
    expect(text).toContain("text-delta");
  });

  it("rejects an empty conversation without a server error", async () => {
    saved["GOOGLE_GENERATIVE_AI_API_KEY"] = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
    process.env["GOOGLE_GENERATIVE_AI_API_KEY"] = "test-key";

    const res = await handleChat(fakeRequest({ messages: [] }));
    expect(res.status).toBe(400);
  });
});
