import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LegalNav } from "../SiteFooter";
import { getPublicForm, publicSubmit } from "../api";
import type { FormSchema } from "../../shared/form-schema";
import { normalizeFormTheme, type FormTheme } from "../../shared/themes";
import { FormRenderer } from "../FormRenderer";

export function PublicFormPage() {
  const { slug = "" } = useParams();
  const [schema, setSchema] = useState<Pick<
    FormSchema,
    "title" | "description" | "fields"
  > | null>(null);
  const [theme, setTheme] = useState<FormTheme>("paper");
  const [expired, setExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicForm(slug)
      .then((data) => {
        setTheme(normalizeFormTheme(data.theme));
        setExpired(data.expired);
        setExpiresAt(data.expiresAt);
        setSchema({
          title: data.title,
          description: data.description,
          fields: data.fields,
        });
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Form not found"),
      )
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="public-form" data-form-theme={theme}>
      <div className="public-form-card">
        {loading ? <div className="public-muted">Loading form…</div> : null}
        {error ? <div className="public-error">{error}</div> : null}
        {schema ? (
          <>
            {expired ? (
              <div className="public-error" style={{ marginBottom: "1rem" }}>
                This form closed
                {expiresAt
                  ? ` on ${new Date(expiresAt).toLocaleString()}`
                  : ""}
                .
              </div>
            ) : null}
            <FormRenderer
              schema={schema}
              disabled={expired}
              onSubmit={async (payload) => {
                await publicSubmit(slug, payload);
              }}
            />
          </>
        ) : null}
      </div>
      <footer className="public-legal">
        <LegalNav />
      </footer>
    </div>
  );
}
