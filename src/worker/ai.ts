import {
  FORM_JSON_SCHEMA,
  formSchema,
  type FormSchema,
  MAX_PROMPT_LENGTH,
} from "../shared/form-schema";
import type { Env } from "./env";

const SYSTEM_PROMPT = `You generate structured form definitions as JSON.
Rules:
- Return only data matching the provided JSON schema.
- version must always be 1.
- Use snake_case field keys starting with a letter.
- Choose the simplest field types that capture the request.
- select (dropdown), single_choice (radio), and multi_choice need at least 2 options; other types use an empty options array.
- Use select for longer option lists; single_choice for a few visible options.
- Keep titles short. Keep help text optional and brief.
- Maximum 30 fields.
- Prefer email, number, date, yes_no, select, and choice types when they fit.`;

function normalizePrompt(prompt: string): string {
  return prompt.trim().slice(0, MAX_PROMPT_LENGTH);
}

function extractJson(raw: unknown): unknown {
  if (raw && typeof raw === "object" && "response" in raw) {
    const response = (raw as { response: unknown }).response;
    if (typeof response === "string") {
      return JSON.parse(response);
    }
    return response;
  }
  if (typeof raw === "string") {
    return JSON.parse(raw);
  }
  return raw;
}

async function runOnce(
  env: Env,
  messages: Array<{ role: string; content: string }>,
): Promise<FormSchema> {
  const model = env.AI_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  const result = await env.AI.run(model as Parameters<Ai["run"]>[0], {
    messages,
    temperature: 0.2,
    max_tokens: 2048,
    response_format: {
      type: "json_schema",
      json_schema: FORM_JSON_SCHEMA,
    },
  } as Record<string, unknown>);

  const parsed = extractJson(result);
  return formSchema.parse(parsed);
}

export async function generateFormFromPrompt(
  env: Env,
  prompt: string,
): Promise<FormSchema> {
  const userPrompt = normalizePrompt(prompt);
  if (!userPrompt) {
    throw new Error("Prompt is required");
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Create a form that collects: ${userPrompt}`,
    },
  ];

  try {
    return await runOnce(env, messages);
  } catch {
    return await runOnce(env, messages);
  }
}

export async function refineFormSchema(
  env: Env,
  current: FormSchema,
  instruction: string,
): Promise<FormSchema> {
  const refinePrompt = normalizePrompt(instruction);
  if (!refinePrompt) {
    throw new Error("Instruction is required");
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Here is the current form JSON:\n${JSON.stringify(current, null, 2)}\n\nApply this change. Keep existing field keys stable unless a field is removed or clearly renamed. Change only what the instruction asks.\n\nInstruction: ${refinePrompt}`,
    },
  ];

  try {
    return await runOnce(env, messages);
  } catch {
    return await runOnce(env, messages);
  }
}
