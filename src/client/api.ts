import type { FormField, FormSchema } from "../shared/form-schema";
import type { FormTheme } from "../shared/themes";

export type FormSummary = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FormDetail = {
  id: string;
  slug: string;
  status: "draft" | "published";
  theme: FormTheme;
  expiresAt: string | null;
  schema: FormSchema;
  createdAt: string;
  updatedAt: string;
};

export type Submission = {
  id: string;
  payload: Record<string, unknown>;
  isTest: boolean;
  createdAt: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function listForms(): Promise<FormSummary[]> {
  const data = await parseJson<{ forms: FormSummary[] }>(
    await fetch("/api/forms"),
  );
  return data.forms;
}

export async function createForm(prompt: string): Promise<FormDetail> {
  const data = await parseJson<{ form: FormDetail }>(
    await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }),
  );
  return data.form;
}

export async function deleteForm(id: string): Promise<void> {
  await parseJson(await fetch(`/api/forms/${id}`, { method: "DELETE" }));
}

export async function getForm(id: string): Promise<FormDetail> {
  const data = await parseJson<{ form: FormDetail }>(
    await fetch(`/api/forms/${id}`),
  );
  return data.form;
}

export async function refineForm(
  id: string,
  instruction: string,
): Promise<FormDetail> {
  const data = await parseJson<{ form: FormDetail }>(
    await fetch(`/api/forms/${id}/refine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction }),
    }),
  );
  return data.form;
}

export async function updateForm(
  id: string,
  patch: {
    status?: "draft" | "published";
    theme?: FormTheme;
    expiresAt?: string | null;
    title?: string;
    description?: string;
    fields?: FormField[];
  },
): Promise<FormDetail> {
  const data = await parseJson<{ form: FormDetail }>(
    await fetch(`/api/forms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  );
  return data.form;
}

export async function testSubmit(
  id: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await parseJson(await fetch(`/api/forms/${id}/test-submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
}

export async function listSubmissions(id: string): Promise<Submission[]> {
  const data = await parseJson<{ submissions: Submission[] }>(
    await fetch(`/api/forms/${id}/submissions`),
  );
  return data.submissions;
}

export async function deleteSubmission(
  formId: string,
  submissionId: string,
): Promise<void> {
  await parseJson(
    await fetch(`/api/forms/${formId}/submissions/${submissionId}`, {
      method: "DELETE",
    }),
  );
}

export async function getPublicForm(slug: string): Promise<{
  slug: string;
  theme: FormTheme;
  expiresAt: string | null;
  expired: boolean;
  title: string;
  description: string;
  fields: FormSchema["fields"];
}> {
  return parseJson(await fetch(`/api/public/forms/${slug}`));
}

export async function publicSubmit(
  slug: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await parseJson(
    await fetch(`/api/public/forms/${slug}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}
