declare module "@google/generative-ai" {
  export interface GenerationConfig {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
    topP?: number;
    topK?: number;
  }

  export interface GenerateContentResult {
    response: {
      text(): string;
    };
  }

  export interface GenerativeModel {
    generateContent(prompt: string): Promise<GenerateContentResult>;
  }

  export interface GetGenerativeModelParams {
    model: string;
    generationConfig?: GenerationConfig;
  }

  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(params: GetGenerativeModelParams): GenerativeModel;
  }
}
