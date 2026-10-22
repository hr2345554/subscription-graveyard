
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className = '', id, ...props }, ref) {
    const inputId = id ?? props.name;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}

        <input
          {...props}
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          className={`w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-border text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-all ${
            error ? 'border-danger' : ''
          } ${className}`}
        />

        {error && (
          <p
            id={inputId ? `${inputId}-error` : undefined}
            className="text-xs text-danger mt-1"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, error, options, className = '', id, ...props },
    ref
  ) {
    const selectId = id ?? props.name;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}

        <select
          {...props}
          id={selectId}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error && selectId ? `${selectId}-error` : undefined
          }
          className={`w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-all ${
            error ? 'border-danger' : ''
          } ${className}`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p
            id={selectId ? `${selectId}-error` : undefined}
            className="text-xs text-danger mt-1"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
  };

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(function Textarea(
  { label, error, className = '', id, ...props },
  ref
) {
  const textareaId = id ?? props.name;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}

      <textarea
        {...props}
        id={textareaId}
        ref={ref}
        rows={3}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error && textareaId ? `${textareaId}-error` : undefined
        }
        className={`w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-border text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-all resize-none ${
          error ? 'border-danger' : ''
        } ${className}`}
      />

      {error && (
        <p
          id={textareaId ? `${textareaId}-error` : undefined}
          className="text-xs text-danger mt-1"
        >
          {error}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
