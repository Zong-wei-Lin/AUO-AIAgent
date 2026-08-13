export const FOUNDATION_MODEL = "gpt-5.6-luna";
export const RAG_AGENT_MODEL = "gpt-5.4-mini";

export const DEFAULT_MODEL = RAG_AGENT_MODEL;
export const DEFAULT_REASONING = Object.freeze({ effort: "low" });
export const DEFAULT_MODEL_SETTINGS = Object.freeze({
  reasoning: DEFAULT_REASONING,
});