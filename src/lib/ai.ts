import httpStatus from "http-status";
import { z } from "zod";
import config from "../config/index.js";
import { ApiError } from "../utils/apiError.js";

const TIMEOUT_MS = 25_000;

export type TAiImage = {
  mimeType: string;
  data: string; // base64
};

type TGenerateJson<T> = {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  images?: TAiImage[];
  // Sent to Groq instead of `prompt` when there are images, since the
  // fallback can't see them.
  textOnlyPrompt?: string;
  temperature?: number;
};

export type TAiProvider = "gemini" | "groq";

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

// Both providers get the schema; the reply is still validated here, since a
// model can return JSON that doesn't match it.
const jsonSchemaOf = (schema: z.ZodType) => {
  const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(schema) as Record<string, unknown>;
  return jsonSchema;
};

const geminiJson = async <T>({ system, prompt, schema, images = [], temperature = 0.4 }: TGenerateJson<T>) => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini_model}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": config.gemini_api_key, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }, ...images.map((image) => ({ inlineData: image }))],
          },
        ],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchemaOf(schema),
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${body?.error?.message ?? "no details"}`);
  }

  const candidate = body?.candidates?.[0];
  const text = candidate?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("");
  if (!text) {
    throw new Error(`Gemini returned no text (${candidate?.finishReason ?? "no candidate"})`);
  }

  return schema.parse(JSON.parse(text));
};

const groqJson = async <T>({ system, prompt, textOnlyPrompt, images = [], schema, temperature = 0.4 }: TGenerateJson<T>) => {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.groq_api_key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.groq_model,
      temperature,
      // JSON mode needs the shape spelled out in the prompt.
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${system}\n\nReply with one JSON object that matches this JSON Schema:\n${JSON.stringify(jsonSchemaOf(schema))}`,
        },
        { role: "user", content: images.length && textOnlyPrompt ? textOnlyPrompt : prompt },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${body?.error?.message ?? "no details"}`);
  }

  const text = body?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Groq returned no text");
  }

  return schema.parse(JSON.parse(text));
};

// Gemini first (it can see images); Groq when Gemini is rate-limited, down,
// or returns something unusable.
export const generateJson = async <T>(options: TGenerateJson<T>): Promise<{ data: T; provider: TAiProvider }> => {
  try {
    return { data: await geminiJson(options), provider: "gemini" };
  } catch (error) {
    console.warn(`Gemini failed, falling back to Groq: ${errorMessage(error)}`);
  }

  try {
    return { data: await groqJson(options), provider: "groq" };
  } catch (error) {
    console.warn(`Groq failed too: ${errorMessage(error)}`);
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "The AI assistant is busy right now. Please try again in a minute.",
    );
  }
};
