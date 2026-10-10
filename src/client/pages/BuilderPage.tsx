import { Fragment, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FIELD_TYPES,
  type FieldType,
  type FormField,
} from "../../shared/form-schema";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "../../shared/expiry";
import {
  FORM_THEME_LABELS,
  FORM_THEMES,
  type FormTheme,
} from "../../shared/themes";
import {
  deleteForm,
  getForm,
  refineForm,
  testSubmit,
  updateForm,
  type FormDetail,
} from "../api";
import { FormRenderer } from "../FormRenderer";
import { Shell } from "../Shell";

const TYPE_LABELS: Record<FieldType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  email: "Email",
  number: "Number",
  date: "Date",
  select: "Select",
  single_choice: "Single choice",
  multi_choice: "Multi choice",
  yes_no: "Yes / No",
};

function needsOptions(type: FieldType): boolean {
  return (
    type === "select" || type === "single_choice" || type === "multi_choice"
  );
}

function withType(field: FormField, type: FieldType): FormField {
  if (!needsOptions(type)) {
    return { ...field, type, options: [] };
  }
  let options = field.options.filter((o) => o.trim().length > 0);
  if (options.length < 2) {
    options =
      options.length === 1
        ? [options[0], "Option B"]
        : ["Option A", "Option B"];
  }
  return { ...field, type, options };
}

const FIELD_KEY_RE = /^[a-z][a-z0-9_]*$/;

function uniqueFieldKey(fields: FormField[]): string {
  const used = new Set(fields.map((f) => f.key));
  let n = 1;
  while (used.has(`field_${n}`)) n += 1;
  return `field_${n}`;
}

function createBlankField(fields: FormField[]): FormField {
  return {
    key: uniqueFieldKey(fields),
    type: "short_text",
    label: "New field",
    required: false,
    help: "",
    options: [],
  };
}

export function BuilderPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormDetail | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  function applyForm(next: FormDetail) {
    setForm(next);
    setTitle(next.schema.title);
    setDescription(next.schema.description ?? "");
  }

  useEffect(() => {
    getForm(id)
      .then(applyForm)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load form"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  async function onRefine(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const next = await refineForm(form.id, instruction);
      applyForm(next);
      setInstruction("");
      setMessage("Form updated from your instruction.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refine failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveTitleDescription() {
    if (!form || savingMeta) return;
    const nextTitle = title.trim();
    if (!nextTitle) {
      setTitle(form.schema.title);
      setError("Title cannot be empty");
      return;
    }
    if (
      nextTitle === form.schema.title &&
      description === (form.schema.description ?? "")
    ) {
      return;
    }
    setSavingMeta(true);
    setError(null);
    try {
      const updated = await updateForm(form.id, {
        title: nextTitle,
        description,
      });
      applyForm(updated);
      setMessage("Title and description saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
      setTitle(form.schema.title);
      setDescription(form.schema.description ?? "");
    } finally {
      setSavingMeta(false);
    }
  }

  async function saveFields(
    fields: FormField[],
    successMessage?: string,
  ): Promise<boolean> {
    if (!form || savingFields) return false;
    if (fields.length < 1) {
      setError("A form needs at least one field");
      return false;
    }
    setSavingFields(true);
    setError(null);
    try {
      const updated = await updateForm(form.id, { fields });
      applyForm(updated);
      if (successMessage) setMessage(successMessage);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update fields");
      return false;
    } finally {
      setSavingFields(false);
    }
  }

  function updateField(key: string, patch: Partial<FormField>) {
    if (!form) return;
    const fields = form.schema.fields.map((field) => {
      if (field.key !== key) return field;
      let next = { ...field, ...patch };
      if (patch.type) next = withType(next, patch.type);
      if (patch.label !== undefined) next.label = patch.label;
      if (patch.help !== undefined) next.help = patch.help;
      return next;
    });
    void saveFields(fields);
  }

  async function renameField(
    currentKey: string,
    nextKeyRaw: string,
  ): Promise<boolean> {
    if (!form) return false;
    const nextKey = nextKeyRaw.trim();
    if (nextKey === currentKey) return true;
    if (!FIELD_KEY_RE.test(nextKey) || nextKey.length > 64) {
      setError(
        "Field name must be snake_case starting with a letter (a-z, 0-9, _)",
      );
      return false;
    }
    if (form.schema.fields.some((f) => f.key === nextKey)) {
      setError("Field name must be unique");
      return false;
    }
    const fields = form.schema.fields.map((field) =>
      field.key === currentKey ? { ...field, key: nextKey } : field,
    );
    return saveFields(fields, "Field name saved.");
  }

  function deleteField(key: string) {
    if (!form) return;
    if (form.schema.fields.length <= 1) {
      setError("A form needs at least one field");
      return;
    }
    void saveFields(
      form.schema.fields.filter((f) => f.key !== key),
      "Field deleted.",
    );
  }

  function insertFieldAt(index: number) {
    if (!form) return;
    if (form.schema.fields.length >= 30) {
      setError("Maximum 30 fields");
      return;
    }
    const fields = [...form.schema.fields];
    fields.splice(index, 0, createBlankField(fields));
    void saveFields(fields, "Field added.");
  }

  async function togglePublished(next: boolean) {
    if (!form) return;
    setError(null);
    try {
      const updated = await updateForm(form.id, {
        status: next ? "published" : "draft",
      });
      applyForm(updated);
      setMessage(
        next
          ? "Form published with a new public link."
          : "Form set back to draft.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function setTheme(theme: FormTheme) {
    if (!form || form.theme === theme) return;
    setError(null);
    try {
      const updated = await updateForm(form.id, { theme });
      applyForm(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function saveExpires(value: string) {
    if (!form) return;
    setError(null);
    try {
      const expiresAt = fromDatetimeLocalValue(value);
      if (expiresAt === form.expiresAt) return;
      const updated = await updateForm(form.id, { expiresAt });
      applyForm(updated);
      setMessage(expiresAt ? "Expiration saved." : "Expiration cleared.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function onDeleteForm() {
    if (!form || deleting) return;
    const confirmed = window.confirm(
      `Delete “${form.schema.title}”? Its submissions are removed too. This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      await deleteForm(form.id);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete form");
      setDeleting(false);
    }
  }

  async function copyLink() {
    if (!form) return;
    const url = `${window.location.origin}/f/${form.slug}`;
    await navigator.clipboard.writeText(url);
    setMessage("Public link copied.");
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

  const publicUrl = `${window.location.origin}/f/${form.slug}`;

  return (
    <Shell>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
        <Link className="btn secondary" to="/app">
          ← Forms
        </Link>
        <div className="row">
          <Link className="btn ghost" to={`/app/forms/${form.id}/results`}>
            Results
          </Link>
          <button
            className="btn danger"
            type="button"
            disabled={deleting}
            onClick={() => void onDeleteForm()}
          >
            {deleting ? "Deleting…" : "Delete form"}
          </button>
        </div>
      </div>

      <div className="stack">
        {error ? <div className="error">{error}</div> : null}
        {message ? <div className="success">{message}</div> : null}

        <div className="card stack">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div className="header-edit stack" style={{ flex: 1, minWidth: 0 }}>
              <label className="sr-only" htmlFor="form-title">
                Title
              </label>
              <input
                id="form-title"
                className="title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => void saveTitleDescription()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                maxLength={200}
                disabled={savingMeta}
              />
              <label className="sr-only" htmlFor="form-description">
                Description
              </label>
              <textarea
                id="form-description"
                className="description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => void saveTitleDescription()}
                maxLength={2000}
                rows={2}
                placeholder="Add a short description…"
                disabled={savingMeta}
              />
            </div>
            <span
              className={`badge ${form.status === "published" ? "published" : ""}`}
            >
              {form.status}
            </span>
          </div>

          <div className="row">
            <label className="switch">
              <input
                type="checkbox"
                checked={form.status === "published"}
                onChange={(e) => togglePublished(e.target.checked)}
              />
              Published
            </label>
            {form.status === "published" ? (
              <button className="btn secondary" type="button" onClick={copyLink}>
                Copy public link
              </button>
            ) : null}
          </div>

          {form.status === "published" ? (
            <div className="muted mono">{publicUrl}</div>
          ) : (
            <div className="muted">
              Publish the form to share a public submission link.
            </div>
          )}

          <div className="field" style={{ maxWidth: 280 }}>
            <label htmlFor="form-expires">Expires</label>
            <input
              id="form-expires"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(form.expiresAt)}
              key={form.expiresAt ?? "none"}
              onChange={(e) => void saveExpires(e.target.value)}
            />
            <div className="help">Optional. After this time the public form is disabled.</div>
          </div>

          <div className="stack" style={{ gap: "0.5rem" }}>
            <div className="muted">Public theme</div>
            <div className="theme-picker" role="radiogroup" aria-label="Public theme">
              {FORM_THEMES.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  role="radio"
                  aria-checked={form.theme === theme}
                  className={`theme-option theme-option-${theme}${form.theme === theme ? " is-selected" : ""}`}
                  onClick={() => void setTheme(theme)}
                >
                  <span className="theme-swatch" aria-hidden="true" />
                  {FORM_THEME_LABELS[theme]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card stack">
            <h2 style={{ margin: 0 }}>Refine with a prompt</h2>
            <p className="muted" style={{ margin: 0 }}>
              Ask for changes like “make email required” or “add a t-shirt size
              choice”.
            </p>
            <form className="stack" onSubmit={onRefine}>
              <div className="field">
                <label htmlFor="instruction">Instruction</label>
                <textarea
                  id="instruction"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  maxLength={2000}
                  required
                />
              </div>
              <button
                className="btn"
                type="submit"
                disabled={busy || !instruction.trim()}
              >
                {busy ? "Refining…" : "Refine form"}
              </button>
            </form>

            <div className="stack">
              <h3 style={{ margin: 0 }}>Fields</h3>
              <div className="field-list">
                <AddFieldButton
                  disabled={savingFields || form.schema.fields.length >= 30}
                  onClick={() => insertFieldAt(0)}
                />
                {form.schema.fields.map((field, index) => (
                  <Fragment key={field.key}>
                    <FieldEditor
                      field={field}
                      disabled={savingFields}
                      canDelete={form.schema.fields.length > 1}
                      onSaveKey={(key) => renameField(field.key, key)}
                      onSaveLabel={(label) => {
                        if (label.trim() === field.label) return;
                        if (!label.trim()) {
                          setError("Field title cannot be empty");
                          return;
                        }
                        updateField(field.key, { label: label.trim() });
                      }}
                      onSaveHelp={(help) => {
                        if (help === (field.help ?? "")) return;
                        updateField(field.key, { help });
                      }}
                      onRequired={(required) =>
                        updateField(field.key, { required })
                      }
                      onType={(type) => updateField(field.key, { type })}
                      onDelete={() => deleteField(field.key)}
                    />
                    <AddFieldButton
                      disabled={savingFields || form.schema.fields.length >= 30}
                      onClick={() => insertFieldAt(index + 1)}
                    />
                  </Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="card stack">
            <h2 style={{ margin: 0 }}>Test the form</h2>
            <p className="muted" style={{ margin: 0 }}>
              Submissions here are marked as test rows in results.
            </p>
            <div
              className="public-form is-preview"
              data-form-theme={form.theme}
            >
              <FormRenderer
                key={`${form.theme}:${JSON.stringify(form.schema)}`}
                schema={form.schema}
                submitLabel="Save test response"
                onSubmit={async (payload) => {
                  await testSubmit(form.id, payload);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function AddFieldButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="add-field-row">
      <button
        type="button"
        className="add-field-btn"
        disabled={disabled}
        onClick={onClick}
        aria-label="Add field here"
        title="Add field here"
      >
        +
      </button>
    </div>
  );
}

function FieldEditor({
  field,
  disabled,
  canDelete,
  onSaveKey,
  onSaveLabel,
  onSaveHelp,
  onRequired,
  onType,
  onDelete,
}: {
  field: FormField;
  disabled: boolean;
  canDelete: boolean;
  onSaveKey: (key: string) => Promise<boolean>;
  onSaveLabel: (label: string) => void;
  onSaveHelp: (help: string) => void;
  onRequired: (required: boolean) => void;
  onType: (type: FieldType) => void;
  onDelete: () => void;
}) {
  const [keyValue, setKeyValue] = useState(field.key);
  const [label, setLabel] = useState(field.label);
  const [help, setHelp] = useState(field.help ?? "");

  useEffect(() => {
    setKeyValue(field.key);
    setLabel(field.label);
    setHelp(field.help ?? "");
  }, [field.key, field.label, field.help]);

  return (
    <div className="field-editor">
      <div className="field-editor-top">
        <div className="field" style={{ flex: 1, minWidth: 0 }}>
          <label htmlFor={`${field.key}-name`}>Field name</label>
          <input
            id={`${field.key}-name`}
            className="mono"
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
            onBlur={() => {
              void (async () => {
                const next = keyValue.trim();
                if (next === field.key) {
                  setKeyValue(field.key);
                  return;
                }
                const ok = await onSaveKey(next);
                if (!ok) setKeyValue(field.key);
              })();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            maxLength={64}
            spellCheck={false}
            disabled={disabled}
          />
        </div>
        <button
          className="btn danger"
          type="button"
          disabled={disabled || !canDelete}
          onClick={onDelete}
          title={canDelete ? "Delete field" : "Keep at least one field"}
        >
          Delete
        </button>
      </div>

      <div className="field">
        <label htmlFor={`${field.key}-label`}>Title</label>
        <input
          id={`${field.key}-label`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => onSaveLabel(label)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          maxLength={200}
          disabled={disabled}
        />
      </div>

      <div className="field">
        <label htmlFor={`${field.key}-help`}>Caption</label>
        <input
          id={`${field.key}-help`}
          value={help}
          onChange={(e) => setHelp(e.target.value)}
          onBlur={() => onSaveHelp(help)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          maxLength={500}
          placeholder="Optional help text"
          disabled={disabled}
        />
      </div>

      <div className="field-editor-controls">
        <div className="field">
          <label htmlFor={`${field.key}-type`}>Type</label>
          <select
            id={`${field.key}-type`}
            value={field.type}
            disabled={disabled}
            onChange={(e) => onType(e.target.value as FieldType)}
          >
            {FIELD_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <label className="switch field-required">
          <input
            type="checkbox"
            checked={field.required}
            disabled={disabled}
            onChange={(e) => onRequired(e.target.checked)}
          />
          Required
        </label>
      </div>

      {field.options.length ? (
        <div className="muted">Options: {field.options.join(", ")}</div>
      ) : null}
    </div>
  );
}
