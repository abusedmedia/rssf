import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  deleteSubmission,
  getForm,
  listSubmissions,
  type FormDetail,
  type Submission,
} from "../api";
import { Shell } from "../Shell";

export function ResultsPage() {
  const { id = "" } = useParams();
  const [form, setForm] = useState<FormDetail | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getForm(id), listSubmissions(id)])
      .then(([f, s]) => {
        setForm(f);
        setSubmissions(s);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load results"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  async function onDelete(submissionId: string) {
    if (!form || deletingId) return;
    const confirmed = window.confirm("Delete this response? This cannot be undone.");
    if (!confirmed) return;

    setDeletingId(submissionId);
    setError(null);
    try {
      await deleteSubmission(form.id, submissionId);
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete response");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="card muted">Loading…</div>
      </Shell>
    );
  }

  if (!form) {
    return (
      <Shell>
        <div className="card error">{error || "Form not found"}</div>
      </Shell>
    );
  }

  const keys = form.schema.fields.map((f) => f.key);

  return (
    <Shell>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
        <div className="row">
          <Link className="btn secondary" to={`/app/forms/${form.id}`}>
            ← Builder
          </Link>
          <Link className="btn secondary" to="/app">
            Forms
          </Link>
        </div>
        <a className="btn" href={`/api/forms/${form.id}/export.csv`}>
          Download CSV
        </a>
      </div>

      <div className="card stack">
        <div>
          <h1 style={{ margin: 0 }}>{form.schema.title}</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>
            {submissions.length} response{submissions.length === 1 ? "" : "s"}
          </p>
        </div>

        {error ? <div className="error">{error}</div> : null}

        {submissions.length === 0 ? (
          <div className="empty">No submissions yet. Test the form or share the public link.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Type</th>
                  {form.schema.fields.map((f) => (
                    <th key={f.key}>{f.label}</th>
                  ))}
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td className="mono">{new Date(s.createdAt).toLocaleString()}</td>
                    <td>
                      {s.isTest ? (
                        <span className="badge test">test</span>
                      ) : (
                        <span className="badge">live</span>
                      )}
                    </td>
                    {keys.map((key) => (
                      <td key={key}>{formatValue(s.payload[key])}</td>
                    ))}
                    <td>
                      <button
                        className="btn danger"
                        type="button"
                        disabled={deletingId === s.id}
                        onClick={() => void onDelete(s.id)}
                      >
                        {deletingId === s.id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
