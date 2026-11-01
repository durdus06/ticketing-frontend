import type { FieldErrors, RegistrationFormValues } from './types.ts'

// These rules mirror the backend (FR-1) to give instant feedback. The server stays the authority:
// it re-checks everything, so a mismatch here can never weaken security.
export const MINIMUM_AGE = 18
export const NAME_MAX_LENGTH = 100
export const EMAIL_MAX_LENGTH = 254
export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_BYTES = 72

// Deliberately loose: the only reliable email check is the server sending a message.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const utf8 = new TextEncoder()

/** Today in UTC as yyyy-MM-dd, matching the server, which calculates age against the UTC date. */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Latest date of birth that still makes the person at least MINIMUM_AGE today (UTC). */
export function latestAllowedBirthDate(): string {
  const [year, month, day] = todayUtc().split('-').map(Number)
  // Date.UTC rolls 29 Feb of a non-leap year to 1 Mar, which is the same rule as LocalDate.plusYears
  // in reverse closely enough for a hint; the server decides.
  return new Date(Date.UTC(year - MINIMUM_AGE, month - 1, day)).toISOString().slice(0, 10)
}

export function validateRegistration(values: RegistrationFormValues): FieldErrors {
  const errors: FieldErrors = {}

  for (const field of ['firstName', 'lastName'] as const) {
    const value = values[field].trim()
    if (!value) errors[field] = 'This field is required'
    else if (value.length > NAME_MAX_LENGTH)
      errors[field] = `Must be at most ${NAME_MAX_LENGTH} characters`
  }

  if (!values.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required'
  } else if (values.dateOfBirth > latestAllowedBirthDate()) {
    errors.dateOfBirth = `You must be at least ${MINIMUM_AGE} years old`
  }

  const email = values.email.trim()
  if (!email) errors.email = 'Email is required'
  else if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email))
    errors.email = 'Enter a valid email address'

  // The password is never trimmed: leading or trailing spaces are part of it.
  if ([...values.password].length < PASSWORD_MIN_LENGTH) {
    errors.password = `Must be at least ${PASSWORD_MIN_LENGTH} characters`
  } else if (utf8.encode(values.password).length > PASSWORD_MAX_BYTES) {
    errors.password = `Must be at most ${PASSWORD_MAX_BYTES} bytes (some characters use more than one)`
  }

  return errors
}
