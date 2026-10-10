import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listForms, type FormSummary } from "../api";
import { Shell } from "../Shell";

export function FormsPage() {
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listForms()
      .then(setForms)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load forms"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Your forms</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>
            Create, refine, publish, and export.
          </p>
        </div>
        <Link className="btn" to="/app/new">
          New form
        </Link>
      </div>

      <div className="card">
        {loading ? <div className="muted">Loading…</div> : null}
        {error ? <div className="error">{error}</div> : null}
        {!loading && !error && forms.length === 0 ? (
          <div className="empty">
            <p>No forms yet.</p>
            <Link className="btn" to="/app/new">
              Describe what you want to collect
            </Link>
          </div>
        ) : null}
        <div className="form-list">
          {forms.map((form) => (
            <div className="form-item" key={form.id}>
              <div>
                <h3>{form.title}</h3>
                <div className="row">
                  <span
                    className={`badge ${form.status === "published" ? "published" : ""}`}
                  >
                    {form.status}
                  </span>
                  <span className="muted">
                    {form.submissionCount} submission
                    {form.submissionCount === 1 ? "" : "s"}
                  </span>
                  <span className="muted mono">{form.slug}</span>
                </div>
              </div>
              <div className="row">
                <Link className="btn secondary" to={`/app/forms/${form.id}`}>
                  Edit
                </Link>
                <Link className="btn ghost" to={`/app/forms/${form.id}/results`}>
                  Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
