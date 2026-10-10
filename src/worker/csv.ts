import type { FormSchema } from "../shared/form-schema";

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s: string;
  if (typeof value === "boolean") s = value ? "yes" : "no";
  else if (Array.isArray(value)) s = value.join("; ");
  else s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function submissionsToCsv(
  schema: FormSchema,
  rows: Array<{
    id: string;
    payload_json: string;
    is_test: number;
    created_at: string;
  }>,
): string {
  const headers = [
    "submission_id",
    "created_at",
    "is_test",
    ...schema.fields.map((f) => f.key),
  ];
  const lines = [headers.map(escapeCsv).join(",")];

  for (const row of rows) {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(row.payload_json) as Record<string, unknown>;
    } catch {
      payload = {};
    }
    const cells = [
      row.id,
      row.created_at,
      row.is_test ? "true" : "false",
      ...schema.fields.map((f) => payload[f.key]),
    ];
    lines.push(cells.map(escapeCsv).join(","));
  }

  return lines.join("\n") + "\n";
}
