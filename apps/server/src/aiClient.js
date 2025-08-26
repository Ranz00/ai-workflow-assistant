import OpenAI from "openai";

export function createAIClient() {
  const useAzure =
    !!process.env.AZURE_OPENAI_API_KEY && !!process.env.AZURE_OPENAI_ENDPOINT;
  if (useAzure) {
    return new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
      defaultQuery: { "api-version": "2024-05-01-preview" }
    });
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function getModel() {
  return process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o-mini";
}
