import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { LandingPage } from "./pages/LandingPage";
import { FormsPage } from "./pages/FormsPage";
import { NewFormPage } from "./pages/NewFormPage";
import { BuilderPage } from "./pages/BuilderPage";
import { ResultsPage } from "./pages/ResultsPage";
import { PublicFormPage } from "./pages/PublicFormPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { Shell } from "./Shell";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Shell>
        <div className="card muted">Loading…</div>
      </Shell>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/f/:slug" element={<PublicFormPage />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <FormsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/app/new"
        element={
          <RequireAuth>
            <NewFormPage />
          </RequireAuth>
        }
      />
      <Route
        path="/app/forms/:id"
        element={
          <RequireAuth>
            <BuilderPage />
          </RequireAuth>
        }
      />
      <Route
        path="/app/forms/:id/results"
        element={
          <RequireAuth>
            <ResultsPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
