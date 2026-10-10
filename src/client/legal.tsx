import { useEffect, type ReactNode } from "react";
import { Shell } from "./Shell";

export const LEGAL_UPDATED = "10 October 2026";

export function LegalDocument({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} — RSSF`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <Shell>
      <article className="legal">
        <h1>{title}</h1>
        <p className="legal-meta">Last updated {LEGAL_UPDATED}</p>
        {children}
      </article>
    </Shell>
  );
}
