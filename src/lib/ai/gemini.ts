import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getClient() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

export async function generateVibeDesign(
  prompt: string,
  context: {
    existingSections?: Array<{ name: string; blockCount: number }>;
    currentTheme?: Record<string, unknown>;
    portfolioTitle?: string;
  },
  systemPrompt: string,
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const contextStr = context.existingSections?.length
    ? `\n\nCurrent portfolio "${context.portfolioTitle ?? "Untitled"}" has these sections: ${context.existingSections.map((s) => `${s.name} (${s.blockCount} blocks)`).join(", ")}.\nCurrent theme: ${JSON.stringify(context.currentTheme ?? {})}`
    : `\n\nThis is a new empty portfolio titled "${context.portfolioTitle ?? "Untitled"}".`;

  const fullPrompt = `${systemPrompt}${contextStr}\n\nUser request: ${prompt}`;

  try {
    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();
    return text;
  } catch (err) {
    console.error("Gemini API error:", err);
    return null;
  }
}
