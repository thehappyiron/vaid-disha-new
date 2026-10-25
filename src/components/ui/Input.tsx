import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

/* ── Field wrapper ────────────────────────────────────────── */

interface FieldProps {
  id: string;
  label: ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ id, label, hint, error, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-0">
      <label htmlFor={id} className="field-label">
        {label}
        {required && (
          <span className="text-[var(--color-danger-600)] ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {children}

      {hint && !error && (
        <span id={`${id}-hint`} className="field-hint">
          {hint}
        </span>
      )}
      {error && (
        <span
          id={`${id}-error`}
          role="alert"
          aria-live="polite"
          className="field-error flex items-center gap-1.5 mt-1"
        >
          {/* Lucide icon + text — never color alone */}
          <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
          {error}
        </span>
      )}
    </div>
  );
}

/* ── Text Input ───────────────────────────────────────────── */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: ReactNode;
  hint?: string;
  error?: string;
}

export function Input({ id, label, hint, error, required, className = '', ...rest }: InputProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        aria-describedby={
          [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
            .filter(Boolean)
            .join(' ') || undefined
        }
        aria-invalid={!!error}
        required={required}
        {...rest}
      />
    </Field>
  );
}

/* ── Select ───────────────────────────────────────────────── */

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  hint?: string;
  error?: string;
}

export function Select({
  id,
  label,
  options,
  placeholder,
  hint,
  error,
  required,
  className = '',
  ...rest
}: SelectProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <div className="select-wrapper">
        <select
          id={id}
          className={`input select ${error ? 'input-error' : ''} ${className}`}
          aria-describedby={
            [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
              .filter(Boolean)
              .join(' ') || undefined
          }
          aria-invalid={!!error}
          required={required}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </Field>
  );
}
