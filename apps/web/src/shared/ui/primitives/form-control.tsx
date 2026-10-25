import { useI18n, message as localizedMessage } from "../../i18n";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useId, useState } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const controlClasses =
  "w-full rounded-control border border-solid border-border bg-surface p-3 font-sans text-body font-normal text-charcoal focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-info focus-visible:outline-offset-2 aria-invalid:border-danger";

type FieldShellProps = {
  controlId: string;
  label: string;
  description?: string;
  error?: string;
  children: (describedBy: string | undefined) => ReactNode;
};

function FieldShell({ controlId, label, description, error, children }: FieldShellProps) {
  const { text } = useI18n();
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid gap-2 font-sans">
      <label className="text-charcoal font-[650]" htmlFor={controlId}>
        {text(label)}
      </label>
      {description ? (
        <p className="m-0 text-small text-muted" id={descriptionId}>
          {text(description)}
        </p>
      ) : null}
      {text(children(describedBy))}
      {error ? (
        <p className="m-0 text-small text-danger-dark" id={errorId}>
          {text(error)}
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
  const { text } = useI18n();
  const generatedId = useId();
  const controlId = id ?? generatedId;

  return (
    <FieldShell
      controlId={controlId}
      description={text(description)}
      error={text(error)}
      label={text(label)}
    >
      {(describedBy) => (
        <input
          {...props}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={[controlClasses, "min-h-control-md", className].filter(Boolean).join(" ")}
          id={controlId}
        />
      )}
    </FieldShell>
  );
}

export type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "aria-describedby" | "type"
> & {
  label: string;
  description?: string;
  error?: string;
};

export function PasswordInput({
  label,
  description,
  error,
  id,
  className,
  ...props
}: PasswordInputProps) {
  const { t, text } = useI18n();
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FieldShell
      controlId={controlId}
      description={text(description)}
      error={text(error)}
      label={text(label)}
    >
      {(describedBy) => (
        <div className="relative">
          <input
            {...props}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className={[
              controlClasses,
              "min-h-control-md pr-[calc(var(--space-3)+2.75rem)]",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            id={controlId}
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-controls={controlId}
            aria-label={text(showPassword ? t("ui.hidePassword") : t("ui.showPassword"))}
            className="absolute right-0 top-0 flex h-full w-11 cursor-pointer items-center justify-center rounded-control border-0 bg-transparent p-0 text-muted hover:text-charcoal focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-info focus-visible:-outline-offset-3"
            onClick={() => setShowPassword((value) => !value)}
            type="button"
          >
            {showPassword ? (
              <EyeSlash aria-hidden="true" size={20} />
            ) : (
              <Eye aria-hidden="true" size={20} />
            )}
          </button>
        </div>
      )}
    </FieldShell>
  );
}

export type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "aria-describedby"
> & {
  label: string;
  description?: string;
  error?: string;
};

export function Textarea({ label, description, error, id, className, ...props }: TextareaProps) {
  const { text } = useI18n();
  const generatedId = useId();
  const controlId = id ?? generatedId;

  return (
    <FieldShell
      controlId={controlId}
      description={text(description)}
      error={text(error)}
      label={text(label)}
    >
      {(describedBy) => (
        <textarea
          {...props}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={[
            controlClasses,
            "min-h-[calc(var(--control-height-md)*2)] resize-y",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
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

export function Select({
  label,
  description,
  error,
  id,
  className,
  children,
  ...props
}: SelectProps) {
  const { text } = useI18n();
  const generatedId = useId();
  const controlId = id ?? generatedId;

  return (
    <FieldShell
      controlId={controlId}
      description={text(description)}
      error={text(error)}
      label={text(label)}
    >
      {(describedBy) => (
        <select
          {...props}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={[controlClasses, "min-h-control-md", className].filter(Boolean).join(" ")}
          id={controlId}
        >
          {text(children)}
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
  title = localizedMessage("ui.fixErrors"),
}: FormErrorSummaryProps) {
  const { text } = useI18n();
  const titleId = useId();
  if (errors.length === 0) return null;

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-control border border-solid border-danger bg-danger-soft p-4 text-charcoal"
      role="alert"
    >
      <h2 className="mt-0 mr-0 mb-2 ml-0 text-body" id={titleId}>
        {text(title)}
      </h2>
      <ul className="m-0 pl-6">
        {errors.map((error) => (
          <li key={error.field}>
            <button
              className="cursor-pointer border-0 bg-transparent p-1 text-danger-dark underline focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-info focus-visible:outline-offset-2"
              onClick={() => onFocus(error.field)}
              type="button"
            >
              {text(error.label)}: {text(error.message)}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
