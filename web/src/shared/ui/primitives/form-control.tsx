import { useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type FieldShellProps = {
  controlId: string;
  label: string;
  description?: string;
  error?: string;
  children: (describedBy: string | undefined) => ReactNode;
};

function FieldShell({ controlId, label, description, error, children }: FieldShellProps) {
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={controlId}>
        {label}
      </label>
      {description ? (
        <p className="ui-field__description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {children(describedBy)}
      {error ? (
        <p className="ui-field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "aria-describedby"> & {
  label: string;
  description?: string;
  error?: string;
};

export function Input({ label, description, error, id, className, ...props }: InputProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;

  return (
    <FieldShell controlId={controlId} description={description} error={error} label={label}>
      {(describedBy) => (
        <input
          {...props}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={["ui-control", className].filter(Boolean).join(" ")}
          id={controlId}
        />
      )}
    </FieldShell>
  );
}

export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "aria-describedby"> & {
  label: string;
  description?: string;
  error?: string;
};

export function Textarea({ label, description, error, id, className, ...props }: TextareaProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;

  return (
    <FieldShell controlId={controlId} description={description} error={error} label={label}>
      {(describedBy) => (
        <textarea
          {...props}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={["ui-control", className].filter(Boolean).join(" ")}
          id={controlId}
        />
      )}
    </FieldShell>
  );
}

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "aria-describedby"> & {
  label: string;
  description?: string;
  error?: string;
};

export function Select({ label, description, error, id, className, children, ...props }: SelectProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;

  return (
    <FieldShell controlId={controlId} description={description} error={error} label={label}>
      {(describedBy) => (
        <select
          {...props}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={["ui-control", className].filter(Boolean).join(" ")}
          id={controlId}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}

export type FormError = {
  field: string;
  label: string;
  message: string;
};

export type FormErrorSummaryProps = {
  errors: FormError[];
  onFocus: (field: string) => void;
  title?: string;
};

export function FormErrorSummary({
  errors,
  onFocus,
  title = "Please fix the following errors",
}: FormErrorSummaryProps) {
  const titleId = useId();
  if (errors.length === 0) return null;

  return (
    <section aria-labelledby={titleId} className="ui-form-summary" role="alert">
      <h2 id={titleId}>{title}</h2>
      <ul>
        {errors.map((error) => (
          <li key={error.field}>
            <button className="ui-summary-link" onClick={() => onFocus(error.field)} type="button">
              {error.label}: {error.message}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
