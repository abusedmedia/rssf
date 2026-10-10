import { Hono } from "hono";
import { z } from "zod";
import {
  formFieldSchema,
  formSchema,
  validateSubmission,
  type FormSchema,
} from "../shared/form-schema";
import { generateFormFromPrompt, refineFormSchema } from "./ai";
import {
  handleGoogleCallback,
  logout,
  requireAuth,
  startGoogleLogin,
  type AppEnv,
  getSessionUser,
} from "./auth";
import { submissionsToCsv } from "./csv";
import { randomId } from "./crypto";
import { checkSubmitRateLimit } from "./rate-limit";
import { slugifyTitle } from "./slug";
import { isExpired } from "../shared/expiry";
import { isFormTheme, normalizeFormTheme, type FormTheme } from "../shared/themes";

const app = new Hono<AppEnv>();

type FormRow = {
  id: string;
  owner_id: string;
  slug: string;
  schema_json: string;
  status: "draft" | "published";
  csv_export_enabled: number;
  theme: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

function parseSchema(json: string): FormSchema {
  return formSchema.parse(JSON.parse(json));
}

function serializeForm(row: FormRow) {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    theme: normalizeFormTheme(row.theme),
    expiresAt: row.expires_at,
    schema: parseSchema(row.schema_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getOwnedForm(
  c: { env: AppEnv["Bindings"] },
  formId: string,
  ownerId: string,
): Promise<FormRow | null> {
  return c.env.DB.prepare(
    "SELECT * FROM forms WHERE id = ? AND owner_id = ?",
  )
    .bind(formId, ownerId)
    .first<FormRow>();
}

app.get("/auth/google", (c) => startGoogleLogin(c));
app.get("/auth/callback", (c) => handleGoogleCallback(c));
app.post("/auth/logout", (c) => logout(c));

app.get("/api/me", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ user: null });
  return c.json({ user });
});

const api = new Hono<AppEnv>();
api.use("*", requireAuth);

api.get("/forms", async (c) => {
  const user = c.get("user");
  const { results } = await c.env.DB.prepare(
    `SELECT f.*,
            (SELECT COUNT(*) FROM submissions s WHERE s.form_id = f.id AND s.is_test = 0) AS submission_count
     FROM forms f
     WHERE f.owner_id = ?
     ORDER BY f.updated_at DESC`,
  )
    .bind(user.id)
    .all<FormRow & { submission_count: number }>();

  return c.json({
    forms: (results ?? []).map((row) => {
      const schema = parseSchema(row.schema_json);
      return {
        id: row.id,
        slug: row.slug,
        title: schema.title,
        status: row.status,
        submissionCount: Number(row.submission_count ?? 0),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }),
  });
});

api.post("/forms", async (c) => {
  const user = c.get("user");
  const body = z
    .object({ prompt: z.string().min(1).max(2000) })
    .safeParse(await c.req.json().catch(() => ({})));

  if (!body.success) {
    return c.json({ error: "prompt is required" }, 400);
  }

  let schema: FormSchema;
  try {
    schema = await generateFormFromPrompt(c.env, body.data.prompt);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate form";
    return c.json({ error: message }, 502);
  }

  const id = randomId(16);
  const slug = slugifyTitle(schema.title);

  await c.env.DB.prepare(
    `INSERT INTO forms (id, owner_id, slug, schema_json, status, csv_export_enabled)
     VALUES (?, ?, ?, ?, 'draft', 0)`,
  )
    .bind(id, user.id, slug, JSON.stringify(schema))
    .run();

  const row = await getOwnedForm(c, id, user.id);
  return c.json({ form: serializeForm(row!) }, 201);
});

api.get("/forms/:id", async (c) => {
  const user = c.get("user");
  const row = await getOwnedForm(c, c.req.param("id"), user.id);
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ form: serializeForm(row) });
});

api.post("/forms/:id/refine", async (c) => {
  const user = c.get("user");
  const row = await getOwnedForm(c, c.req.param("id"), user.id);
  if (!row) return c.json({ error: "Not found" }, 404);

  const body = z
    .object({ instruction: z.string().min(1).max(2000) })
    .safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ error: "instruction is required" }, 400);
  }

  const current = parseSchema(row.schema_json);
  let next: FormSchema;
  try {
    next = await refineFormSchema(c.env, current, body.data.instruction);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to refine form";
    return c.json({ error: message }, 502);
  }

  await c.env.DB.prepare(
    `UPDATE forms
     SET schema_json = ?, updated_at = datetime('now')
     WHERE id = ? AND owner_id = ?`,
  )
    .bind(JSON.stringify(next), row.id, user.id)
    .run();

  const updated = await getOwnedForm(c, row.id, user.id);
  return c.json({ form: serializeForm(updated!) });
});

api.patch("/forms/:id", async (c) => {
  const user = c.get("user");
  const row = await getOwnedForm(c, c.req.param("id"), user.id);
  if (!row) return c.json({ error: "Not found" }, 404);

  const body = z
    .object({
      status: z.enum(["draft", "published"]).optional(),
      theme: z.string().optional(),
      expiresAt: z
        .union([
          z.string().refine((value) => Number.isFinite(Date.parse(value))),
          z.null(),
        ])
        .optional(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).optional(),
      fields: z.array(formFieldSchema).min(1).max(30).optional(),
    })
    .safeParse(await c.req.json().catch(() => ({})));

  if (!body.success) {
    return c.json({ error: "Invalid body" }, 400);
  }

  const status = body.data.status ?? row.status;
  if (body.data.theme !== undefined && !isFormTheme(body.data.theme)) {
    return c.json({ error: "Invalid theme" }, 400);
  }
  const theme: FormTheme =
    body.data.theme && isFormTheme(body.data.theme)
      ? body.data.theme
      : normalizeFormTheme(row.theme);
  const expiresAt =
    body.data.expiresAt === undefined ? row.expires_at : body.data.expiresAt;

  let schemaJson = row.schema_json;
  if (
    body.data.title !== undefined ||
    body.data.description !== undefined ||
    body.data.fields !== undefined
  ) {
    const schema = parseSchema(row.schema_json);
    if (body.data.title !== undefined) schema.title = body.data.title.trim();
    if (body.data.description !== undefined) {
      schema.description = body.data.description;
    }
    if (body.data.fields !== undefined) {
      schema.fields = body.data.fields;
    }
    try {
      schemaJson = JSON.stringify(formSchema.parse(schema));
    } catch {
      return c.json({ error: "Invalid fields" }, 400);
    }
  }

  let slug = row.slug;
  if (status === "published" && row.status !== "published") {
    const schema = parseSchema(schemaJson);
    slug = slugifyTitle(schema.title);
  }

  await c.env.DB.prepare(
    `UPDATE forms
     SET status = ?, theme = ?, slug = ?, expires_at = ?, schema_json = ?, updated_at = datetime('now')
     WHERE id = ? AND owner_id = ?`,
  )
    .bind(status, theme, slug, expiresAt, schemaJson, row.id, user.id)
    .run();

  const updated = await getOwnedForm(c, row.id, user.id);
  return c.json({ form: serializeForm(updated!) });
});

api.delete("/forms/:id", async (c) => {
  const user = c.get("user");
  const row = await getOwnedForm(c, c.req.param("id"), user.id);
  if (!row) return c.json({ error: "Not found" }, 404);

  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM submissions WHERE form_id = ?").bind(row.id),
    c.env.DB.prepare(
      "DELETE FROM forms WHERE id = ? AND owner_id = ?",
    ).bind(row.id, user.id),
  ]);

  return c.json({ ok: true });
});

api.post("/forms/:id/test-submit", async (c) => {
  const user = c.get("user");
  const row = await getOwnedForm(c, c.req.param("id"), user.id);
  if (!row) return c.json({ error: "Not found" }, 404);

  const payload = (await c.req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!payload || typeof payload !== "object") {
    return c.json({ error: "Invalid payload" }, 400);
  }

  const schema = parseSchema(row.schema_json);
  const result = validateSubmission(schema, payload);
  if (!result.ok) {
    return c.json({ error: result.error }, 400);
  }

  const id = randomId(16);
  await c.env.DB.prepare(
    `INSERT INTO submissions (id, form_id, payload_json, is_test)
     VALUES (?, ?, ?, 1)`,
  )
    .bind(id, row.id, JSON.stringify(result.data))
    .run();

  return c.json({ ok: true, id }, 201);
});

api.get("/forms/:id/submissions", async (c) => {
  const user = c.get("user");
  const row = await getOwnedForm(c, c.req.param("id"), user.id);
  if (!row) return c.json({ error: "Not found" }, 404);

  const { results } = await c.env.DB.prepare(
    `SELECT id, payload_json, is_test, created_at
     FROM submissions
     WHERE form_id = ?
     ORDER BY created_at DESC
     LIMIT 500`,
  )
    .bind(row.id)
    .all<{
      id: string;
      payload_json: string;
      is_test: number;
      created_at: string;
    }>();

  return c.json({
    submissions: (results ?? []).map((s) => ({
      id: s.id,
      payload: JSON.parse(s.payload_json) as Record<string, unknown>,
      isTest: s.is_test === 1,
      createdAt: s.created_at,
    })),
  });
});

api.delete("/forms/:id/submissions/:submissionId", async (c) => {
  const user = c.get("user");
  const row = await getOwnedForm(c, c.req.param("id"), user.id);
  if (!row) return c.json({ error: "Not found" }, 404);

  const result = await c.env.DB.prepare(
    `DELETE FROM submissions
     WHERE id = ? AND form_id = ?`,
  )
    .bind(c.req.param("submissionId"), row.id)
    .run();

  if (!result.meta.changes) {
    return c.json({ error: "Submission not found" }, 404);
  }

  return c.json({ ok: true });
});

api.get("/forms/:id/export.csv", async (c) => {
  const user = c.get("user");
  const row = await getOwnedForm(c, c.req.param("id"), user.id);
  if (!row) return c.json({ error: "Not found" }, 404);

  const schema = parseSchema(row.schema_json);
  const { results } = await c.env.DB.prepare(
    `SELECT id, payload_json, is_test, created_at
     FROM submissions
     WHERE form_id = ?
     ORDER BY created_at ASC`,
  )
    .bind(row.id)
    .all<{
      id: string;
      payload_json: string;
      is_test: number;
      created_at: string;
    }>();

  const csv = submissionsToCsv(schema, results ?? []);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${row.slug}.csv"`,
    },
  });
});

app.get("/api/public/forms/:slug", async (c) => {
  const row = await c.env.DB.prepare(
    `SELECT slug, schema_json, theme, expires_at FROM forms WHERE slug = ? AND status = 'published'`,
  )
    .bind(c.req.param("slug"))
    .first<{
      slug: string;
      schema_json: string;
      theme: string;
      expires_at: string | null;
    }>();

  if (!row) return c.json({ error: "Not found" }, 404);

  const schema = parseSchema(row.schema_json);
  return c.json({
    slug: row.slug,
    theme: normalizeFormTheme(row.theme),
    expiresAt: row.expires_at,
    expired: isExpired(row.expires_at),
    title: schema.title,
    description: schema.description,
    fields: schema.fields,
  });
});

app.post("/api/public/forms/:slug/submit", async (c) => {
  const row = await c.env.DB.prepare(
    `SELECT id, schema_json, expires_at FROM forms WHERE slug = ? AND status = 'published'`,
  )
    .bind(c.req.param("slug"))
    .first<{ id: string; schema_json: string; expires_at: string | null }>();

  if (!row) return c.json({ error: "Not found" }, 404);
  if (isExpired(row.expires_at)) {
    return c.json({ error: "This form has expired" }, 403);
  }

  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const limit = await checkSubmitRateLimit(c.env, row.id, ip);
  if (!limit.allowed) {
    c.header("Retry-After", String(limit.retryAfterSec));
    return c.json({ error: "Too many submissions. Try again later." }, 429);
  }

  const payload = (await c.req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!payload || typeof payload !== "object") {
    return c.json({ error: "Invalid payload" }, 400);
  }

  const schema = parseSchema(row.schema_json);
  const result = validateSubmission(schema, payload);
  if (!result.ok) {
    return c.json({ error: result.error }, 400);
  }

  const id = randomId(16);
  await c.env.DB.prepare(
    `INSERT INTO submissions (id, form_id, payload_json, is_test)
     VALUES (?, ?, ?, 0)`,
  )
    .bind(id, row.id, JSON.stringify(result.data))
    .run();

  return c.json({ ok: true, id }, 201);
});

// Authenticated API mounts after public routes so /api/public/* stays open.
app.route("/api", api);

app.all("*", (c) => c.json({ error: "Not found" }, 404));

export default app;
