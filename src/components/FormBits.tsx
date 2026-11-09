import type { ReactNode } from 'react'

/** Single choice as native radios drawn like the design's pressed buttons. */
export function ChoiceGroup<T extends string>({
  name, legend, options, value, onChange, legendClass = 'text-[13px]', error, errorId,
}: {
  name: string
  legend: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  legendClass?: string
  error?: string
  errorId?: string
}) {
  return (
    <fieldset className="m-0 border-0 p-0" aria-describedby={error ? errorId : undefined}>
      <legend className={`mb-2 font-semibold ${legendClass}`}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="choice">
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  )
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="m-0 mt-1 text-[13px] font-medium text-urgent">
      {children}
    </p>
  )
}

export type A11yProps = {
  id: string
  'aria-invalid': true | undefined
  'aria-describedby': string | undefined
  'aria-required': true | undefined
  required: boolean | undefined
}

/** Label, control, helper and error, wired with aria-describedby and aria-invalid. */
export function Field({
  id, label, required, helper, error, labelClass = 'font-semibold', className = '', children,
}: {
  id: string
  label: ReactNode
  required?: boolean
  helper?: ReactNode
  error?: string
  labelClass?: string
  className?: string
  children: (a11y: A11yProps) => ReactNode
}) {
  const helpId = helper ? `${id}-help` : undefined
  const errId = error ? `${id}-error` : undefined
  const describedBy = [errId, helpId].filter(Boolean).join(' ') || undefined
  return (
    <div className={`flex min-w-0 flex-col gap-[6px] ${className}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-urgent">
            {' '}
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required ? true : undefined,
        required: required || undefined,
      })}
      {error && <FieldError id={errId}>{error}</FieldError>}
      {helper && (
        <span id={helpId} className="text-[13px] text-muted">
          {helper}
        </span>
      )}
    </div>
  )
}
