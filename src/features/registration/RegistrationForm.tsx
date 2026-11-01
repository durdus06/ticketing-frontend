import { useRef, useState, type ChangeEvent, type SubmitEvent } from 'react'
import { FormField } from './FormField.tsx'
import { registerCustomer, toRegistrationFailure } from './registrationApi.ts'
import type {
  FieldErrors,
  RegisteredUser,
  RegistrationField,
  RegistrationFormValues,
} from './types.ts'
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  latestAllowedBirthDate,
  validateRegistration,
} from './validation.ts'

const EMPTY_VALUES: RegistrationFormValues = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  email: '',
  password: '',
}

const FIELD_ORDER: RegistrationField[] = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'email',
  'password',
]

export function RegistrationForm() {
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [registered, setRegistered] = useState<RegisteredUser>()
  const formRef = useRef<HTMLFormElement>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.target.name as RegistrationField
    setValues((current) => ({ ...current, [field]: event.target.value }))
    // Clear a field's error as soon as the user edits it.
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function focusFirstInvalid(fieldErrors: FieldErrors) {
    const first = FIELD_ORDER.find((field) => fieldErrors[field])
    const element = first ? formRef.current?.elements.namedItem(first) : null
    if (element instanceof HTMLElement) element.focus()
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    // Guards against a double click or Enter pressed twice before the first request finishes.
    if (submitting) return

    const clientErrors = validateRegistration(values)
    setFormError(undefined)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      focusFirstInvalid(clientErrors)
      return
    }

    setSubmitting(true)
    try {
      setRegistered(await registerCustomer(values))
      setValues(EMPTY_VALUES) // do not keep the password in memory longer than needed
    } catch (error) {
      const failure = toRegistrationFailure(error)
      setErrors(failure.fieldErrors)
      setFormError(failure.formError)
      focusFirstInvalid(failure.fieldErrors)
    } finally {
      setSubmitting(false)
    }
  }

  if (registered) {
    return (
      <section className="card" aria-live="polite">
        <h1>Welcome, {registered.firstName}!</h1>
        <p>
          Your account for <strong>{registered.email}</strong> has been created.
        </p>
      </section>
    )
  }

  return (
    <form ref={formRef} className="card" onSubmit={handleSubmit} noValidate>
      <h1>Create your account</h1>

      {formError && (
        <p role="alert" className="form-error">
          {formError}
        </p>
      )}

      <div className="field-row">
        <FormField
          label="First name"
          name="firstName"
          autoComplete="given-name"
          maxLength={NAME_MAX_LENGTH}
          value={values.firstName}
          onChange={handleChange}
          error={errors.firstName}
        />
        <FormField
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          maxLength={NAME_MAX_LENGTH}
          value={values.lastName}
          onChange={handleChange}
          error={errors.lastName}
        />
      </div>

      <FormField
        label="Date of birth"
        name="dateOfBirth"
        type="date"
        autoComplete="bday"
        max={latestAllowedBirthDate()}
        value={values.dateOfBirth}
        onChange={handleChange}
        error={errors.dateOfBirth}
        hint="You must be at least 18 years old."
      />

      <FormField
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        maxLength={EMAIL_MAX_LENGTH}
        value={values.email}
        onChange={handleChange}
        error={errors.email}
      />

      <FormField
        label="Password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        value={values.password}
        onChange={handleChange}
        error={errors.password}
        hint={`At least ${PASSWORD_MIN_LENGTH} characters. A passphrase works well.`}
        action={
          <button
            type="button"
            className="link-button"
            aria-pressed={showPassword}
            onClick={() => setShowPassword((shown) => !shown)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        }
      />

      <button type="submit" className="primary" disabled={submitting} aria-busy={submitting}>
        {submitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
