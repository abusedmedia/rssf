import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth";
import { Shell } from "../Shell";

export function LandingPage() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const error = params.get("error");

  if (!loading && user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <Shell>
      <section className="hero">
        <div>
          <div className="badge" style={{ marginBottom: "1rem" }}>
            Open source · Cloudflare · Free tier friendly
          </div>
          <h1>Prompt what you want to collect. Get a form.</h1>
          <p className="lede">
            RSSF uses Workers AI to turn a short description into a structured
            form, saves answers in D1 (SQLite), and lets anyone with the link
            submit. Sign in with Google to build and manage forms.
          </p>
          <div className="row" style={{ marginTop: "1.5rem" }}>
            <a className="btn" href="/auth/google">
              Continue with Google
            </a>
            <Link className="btn secondary" to="/app">
              Open app
            </Link>
          </div>
          {error ? (
            <div className="error" style={{ marginTop: "1rem" }}>
              Sign-in failed: {error}
            </div>
          ) : null}
        </div>
        <div className="card stack">
          <strong>How it works</strong>
          <ol className="muted" style={{ margin: 0, paddingLeft: "1.2rem" }}>
            <li>Describe what you want to collect</li>
            <li>Refine the generated form with another prompt</li>
            <li>Test it, publish a public link, review results</li>
            <li>Optionally enable CSV export</li>
          </ol>
        </div>
      </section>
    </Shell>
  );
}
