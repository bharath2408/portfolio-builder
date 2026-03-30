import {
  successResponse,
  errorResponse,
  withErrorHandler,
  requireAuth,
} from "@/lib/api/response";
import { generateVibeDesign } from "@/lib/ai/gemini";
import { VIBE_SYSTEM_PROMPT } from "@/lib/ai/vibe-prompt";

export const POST = withErrorHandler(async (req) => {
  await requireAuth();

  if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return errorResponse("SERVICE_UNAVAILABLE", "AI not configured. Set OPENAI_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY in .env", 503);
  }

  const body = await req.json();
  const { prompt, context } = body;

  if (!prompt || typeof prompt !== "string") {
    return errorResponse("VALIDATION_ERROR", "Prompt required", 400);
  }

  const result = await generateVibeDesign(
    prompt,
    context ?? {},
    VIBE_SYSTEM_PROMPT,
  );

  if (!result) {
    return errorResponse("INTERNAL_ERROR", "AI generation failed", 500);
  }

  try {
    const parsed = JSON.parse(result);
    return successResponse(parsed);
  } catch {
    return errorResponse("INTERNAL_ERROR", "Invalid AI response", 500);
  }
});
