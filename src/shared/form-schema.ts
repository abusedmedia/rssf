import { z } from "zod";

export const FIELD_TYPES = [
  "short_text",
  "long_text",
  "email",
  "number",
  "date",
  "select",
  "single_choice",
  "multi_choice",
  "yes_no",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const formFieldSchema = z
  .object({
    key: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-z][a-z0-9_]*$/, "key must be snake_case starting with a letter"),
    type: z.enum(FIELD_TYPES),
    label: z.string().min(1).max(200),
    required: z.boolean(),
    help: z.string().max(500).default(""),
    options: z.array(z.string().min(1).max(200)).max(50).default([]),
  })
  .superRefine((field, ctx) => {
    const needsOptions =
      field.type === "select" ||
      field.type === "single_choice" ||
      field.type === "multi_choice";
    if (needsOptions && field.options.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: `${field.type} fields need at least 2 options`,
        path: ["options"],
      });
    }
    if (!needsOptions && field.options.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `${field.type} fields must not have options`,
        path: ["options"],
      });
    }
  });

export const formSchema = z.object({
  version: z.literal(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  fields: z.array(formFieldSchema).min(1).max(30),
});

export type FormField = z.infer<typeof formFieldSchema>;
export type FormSchema = z.infer<typeof formSchema>;

/** JSON Schema passed to Workers AI JSON Mode. */
export const FORM_JSON_SCHEMA = {
  type: "object",
  properties: {
    version: { type: "number", const: 1 },
    title: { type: "string" },
    description: { type: "string" },
    fields: {
      type: "array",
      minItems: 1,
      maxItems: 30,
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          type: {
            type: "string",
            enum: [...FIELD_TYPES],
          },
          label: { type: "string" },
          required: { type: "boolean" },
          help: { type: "string" },
          options: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["key", "type", "label", "required", "help", "options"],
      },
    },
  },
  required: ["version", "title", "description", "fields"],
} as const;

export const MAX_PROMPT_LENGTH = 2000;

export function validateSubmission(
  schema: FormSchema,
  payload: Record<string, unknown>,
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const allowed = new Set(schema.fields.map((f) => f.key));
  for (const key of Object.keys(payload)) {
    if (!allowed.has(key)) {
      return { ok: false, error: `Unknown field: ${key}` };
    }
  }

  const data: Record<string, unknown> = {};

  for (const field of schema.fields) {
    const raw = payload[field.key];
    const missing =
      raw === undefined ||
      raw === null ||
      raw === "" ||
      (Array.isArray(raw) && raw.length === 0);

    if (missing) {
      if (field.required) {
        return { ok: false, error: `${field.label} is required` };
      }
      continue;
    }

    switch (field.type) {
      case "short_text":
      case "long_text": {
        if (typeof raw !== "string") {
          return { ok: false, error: `${field.label} must be text` };
        }
        const max = field.type === "short_text" ? 500 : 5000;
        if (raw.length > max) {
          return { ok: false, error: `${field.label} is too long` };
        }
        data[field.key] = raw;
        break;
      }
      case "email": {
        if (typeof raw !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
          return { ok: false, error: `${field.label} must be a valid email` };
        }
        data[field.key] = raw;
        break;
      }
      case "number": {
        const n = typeof raw === "number" ? raw : Number(raw);
        if (!Number.isFinite(n)) {
          return { ok: false, error: `${field.label} must be a number` };
        }
        data[field.key] = n;
        break;
      }
      case "date": {
        if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          return { ok: false, error: `${field.label} must be a date (YYYY-MM-DD)` };
        }
        data[field.key] = raw;
        break;
      }
      case "select":
      case "single_choice": {
        if (typeof raw !== "string" || !field.options.includes(raw)) {
          return { ok: false, error: `${field.label} must be one of the options` };
        }
        data[field.key] = raw;
        break;
      }
      case "multi_choice": {
        if (!Array.isArray(raw) || !raw.every((v) => typeof v === "string")) {
          return { ok: false, error: `${field.label} must be a list of options` };
        }
        for (const v of raw) {
          if (!field.options.includes(v)) {
            return { ok: false, error: `${field.label} has an invalid option` };
          }
        }
        data[field.key] = raw;
        break;
      }
      case "yes_no": {
        if (typeof raw !== "boolean") {
          return { ok: false, error: `${field.label} must be yes or no` };
        }
        data[field.key] = raw;
        break;
      }
    }
  }

  return { ok: true, data };
}
