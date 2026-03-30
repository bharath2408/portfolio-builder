// AI provider — supports OpenRouter, Gemini, and Groq

export async function generateVibeDesign(
  prompt: string,
  context: {
    existingSections?: Array<{ name: string; blockCount: number }>;
    currentTheme?: Record<string, unknown>;
    portfolioTitle?: string;
  },
  systemPrompt: string,
): Promise<string | null> {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // Priority: OpenRouter > Gemini > Groq
  if (openrouterKey) {
    console.log("[Vibe AI] Using OpenRouter");
    const result = await generateWithOpenAICompat(
      prompt, context, systemPrompt, openrouterKey,
      "https://openrouter.ai/api/v1/chat/completions",
      process.env.AI_MODEL ?? "anthropic/claude-opus-4-20250918",
    );
    if (result) return result;
    console.log("[Vibe AI] OpenRouter failed, trying next provider");
  }

  if (geminiKey) {
    console.log("[Vibe AI] Using Gemini");
    const result = await generateWithGemini(prompt, context, systemPrompt, geminiKey);
    if (result) return result;
    console.log("[Vibe AI] Gemini failed, trying next provider");
  }

  if (groqKey) {
    console.log("[Vibe AI] Using Groq");
    return generateWithOpenAICompat(
      prompt, context, systemPrompt, groqKey,
      "https://api.groq.com/openai/v1/chat/completions",
      process.env.AI_MODEL ?? "llama-3.3-70b-versatile",
    );
  }

  return null;
}

// ─── OpenAI-compatible API (Groq, OpenRouter, Together) ──────────

async function generateWithOpenAICompat(
  prompt: string,
  context: {
    existingSections?: Array<{ name: string; blockCount: number }>;
    currentTheme?: Record<string, unknown>;
    portfolioTitle?: string;
  },
  systemPrompt: string,
  apiKey: string,
  baseUrl: string,
  model: string,
): Promise<string | null> {
  const contextStr = buildContextStr(context);

  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${contextStr}\n\nUser request: ${prompt}` },
        ],
        temperature: 0.7,
        max_tokens: 8192,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`AI API error (${model}):`, res.status, err);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error(`AI API error (${model}):`, err);
    return null;
  }
}

// ─── Gemini ──────────────────────────────────────────────────────

async function generateWithGemini(
  prompt: string,
  context: {
    existingSections?: Array<{ name: string; blockCount: number }>;
    currentTheme?: Record<string, unknown>;
    portfolioTitle?: string;
  },
  systemPrompt: string,
  apiKey: string,
): Promise<string | null> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.AI_MODEL ?? "gemini-2.0-flash";
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const contextStr = buildContextStr(context);
  const fullPrompt = `${systemPrompt}${contextStr}\n\nUser request: ${prompt}`;

  try {
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini API error:", err);
    return null;
  }
}

// ─── Shared ──────────────────────────────────────────────────────

function buildContextStr(context: {
  existingSections?: Array<{ name: string; blockCount: number }>;
  currentTheme?: Record<string, unknown>;
  portfolioTitle?: string;
}): string {
  if (context.existingSections?.length) {
    return `\n\nCurrent portfolio "${context.portfolioTitle ?? "Untitled"}" has these sections: ${context.existingSections.map((s) => `${s.name} (${s.blockCount} blocks)`).join(", ")}.\nCurrent theme: ${JSON.stringify(context.currentTheme ?? {})}`;
  }
  return `\n\nThis is a new empty portfolio titled "${context.portfolioTitle ?? "Untitled"}".`;
}
