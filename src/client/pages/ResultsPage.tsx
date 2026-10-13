import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      setSelectedId((current) => (current === submissionId ? null : current));
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
  const selected = submissions.find((s) => s.id === selectedId) ?? null;

  function toggleSelected(submissionId: string) {
    setSelectedId((current) => (current === submissionId ? null : submissionId));
  }

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
            <table className="results-table">
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
                  <tr
                    key={s.id}
                    className={selectedId === s.id ? "is-selected" : undefined}
                    tabIndex={0}
                    aria-selected={selectedId === s.id}
                    onClick={(event) => {
                      if (isRowAction(event.target)) return;
                      toggleSelected(s.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      if (isRowAction(event.target)) return;
                      event.preventDefault();
                      toggleSelected(s.id);
                    }}
                  >
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
                        onClick={(event) => {
                          event.stopPropagation();
                          void onDelete(s.id);
                        }}
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
      {selected ? (
        <RecordPreview
          form={form}
          submission={selected}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </Shell>
  );
}

function RecordPreview({
  form,
  submission,
  onClose,
}: {
  form: FormDetail;
  submission: Submission;
  onClose: () => void;
}) {
  const titleId = useId();
  const drawerRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const items = previewItems(form, submission);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement;
    drawerRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [submission.id]);

  return createPortal(
    <div className="record-layer">
      <div className="record-backdrop" onClick={onClose} />
      <aside
        ref={drawerRef}
        className="record-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="record-drawer-head">
          <h2 id={titleId}>Response</h2>
          <button className="btn secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <dl className="record-preview">
          {items.map((item) => (
            <div key={item.id}>
              <dt>{item.label}</dt>
              <dd className={item.value ? undefined : "muted"}>{item.value || "—"}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>,
    document.body,
  );
}

function previewItems(form: FormDetail, submission: Submission) {
  return [
    {
      id: "when",
      label: "When",
      value: new Date(submission.createdAt).toLocaleString(),
    },
    {
      id: "type",
      label: "Type",
      value: submission.isTest ? "test" : "live",
    },
    ...form.schema.fields.map((field) => ({
      id: field.key,
      label: field.label,
      value: formatValue(submission.payload[field.key]),
    })),
  ];
}

function isRowAction(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("button, a"));
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
