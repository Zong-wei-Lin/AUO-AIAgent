import OpenAI from "openai";
import { OPENAI_API_KEY } from "../config.js";

export const client = new OpenAI({ apiKey: OPENAI_API_KEY });

export { DEFAULT_MODEL, DEFAULT_REASONING } from "./models.js";