import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createForm } from "../api";
import { Shell } from "../Shell";

const SAMPLE_PROMPTS = [
  "RSVP for a weekend workshop: name, email, dietary needs, and whether they need a parking pass",
  "Job application: full name, email, role they are applying for, years of experience, and a short cover note",
  "Event feedback: overall rating, what they liked, what to improve, and if they would come again",
];

export function NewFormPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const form = await createForm(prompt);
      navigate(`/app/forms/${form.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="row" style={{ marginBottom: "1rem" }}>
        <Link className="btn secondary" to="/app">
          ← Back
        </Link>
      </div>
      <div className="card stack">
        <div>
          <h1 style={{ margin: "0 0 0.35rem" }}>What do you want to collect?</h1>
          <p className="muted" style={{ margin: 0 }}>
            Describe the data in plain language. Workers AI will draft a form
            you can refine.
          </p>
        </div>
        <form className="stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="prompt">Prompt</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. RSVP for a weekend workshop: name, email, dietary needs, and whether they need a parking pass"
              required
              maxLength={2000}
            />
          </div>
          <div className="sample-prompts">
            {SAMPLE_PROMPTS.map((sample, index) => (
              <button
                key={sample}
                type="button"
                className="sample-link"
                disabled={busy}
                onClick={() => setPrompt(sample)}
              >
                sample {index + 1}
              </button>
            ))}
          </div>
          {error ? <div className="error">{error}</div> : null}
          <button className="btn" type="submit" disabled={busy || !prompt.trim()}>
            {busy ? <span className="spinner" aria-hidden="true" /> : null}
            {busy ? "Generating form…" : "Generate form"}
          </button>
        </form>
      </div>
    </Shell>
  );
}
