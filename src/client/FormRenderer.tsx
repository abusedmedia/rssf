import { useState, type FormEvent } from "react";
import type { FormField, FormSchema } from "../shared/form-schema";

type Props = {
  schema: Pick<FormSchema, "title" | "description" | "fields">;
  submitLabel?: string;
  disabled?: boolean;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
};

function initialValue(field: FormField): unknown {
  if (field.type === "multi_choice") return [] as string[];
  if (field.type === "yes_no") return false;
  return "";
}

export function FormRenderer({
  schema,
  submitLabel = "Submit",
  disabled = false,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(schema.fields.map((f) => [f.key, initialValue(f)])),
  );
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setError(null);
    setBusy(true);
    try {
      await onSubmit(values);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="success">
        Thanks — your response was recorded.
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <fieldset disabled={disabled} className="form-fields">
      <div>
        <h2 style={{ margin: "0 0 0.35rem" }}>{schema.title}</h2>
        {schema.description ? (
          <p className="muted" style={{ margin: 0 }}>
            {schema.description}
          </p>
        ) : null}
      </div>

      {schema.fields.map((field) => (
        <div className="field" key={field.key}>
          <label htmlFor={field.key}>
            {field.label}
            {field.required ? " *" : ""}
          </label>
          {field.help ? <div className="help">{field.help}</div> : null}
          <FieldInput
            field={field}
            value={values[field.key]}
            onChange={(value) =>
              setValues((prev) => ({ ...prev, [field.key]: value }))
            }
          />
        </div>
      ))}

      {error ? <div className="error">{error}</div> : null}

      <div className="row">
        <button className="btn" type="submit" disabled={busy || disabled}>
          {busy ? "Sending…" : submitLabel}
        </button>
      </div>
      </fieldset>
    </form>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (field.type) {
    case "long_text":
      return (
        <textarea
          id={field.key}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
    case "email":
      return (
        <input
          id={field.key}
          type="email"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
    case "number":
      return (
        <input
          id={field.key}
          type="number"
          value={value === "" || value === undefined ? "" : String(value)}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          required={field.required}
        />
      );
    case "date":
      return (
        <input
          id={field.key}
          type="date"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
    case "yes_no":
      return (
        <label className="switch">
          <input
            id={field.key}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          {value ? "Yes" : "No"}
        </label>
      );
    case "select":
      return (
        <select
          id={field.key}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        >
          <option value="" disabled={field.required}>
            Choose…
          </option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case "single_choice":
      return (
        <div className="choice-list">
          {field.options.map((opt) => (
            <label key={opt}>
              <input
                type="radio"
                name={field.key}
                checked={value === opt}
                onChange={() => onChange(opt)}
                required={field.required}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    case "multi_choice": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="choice-list">
          {field.options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <label key={opt}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    if (checked) {
                      onChange(selected.filter((v) => v !== opt));
                    } else {
                      onChange([...selected, opt]);
                    }
                  }}
                />
                {opt}
              </label>
            );
          })}
        </div>
      );
    }
    default:
      return (
        <input
          id={field.key}
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
  }
}
