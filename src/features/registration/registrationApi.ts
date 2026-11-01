import { ApiError, postJson } from '../../api/http.ts'
import type { FieldErrors, RegisteredUser, RegistrationFormValues } from './types.ts'

export function registerCustomer(
  values: RegistrationFormValues,
  signal?: AbortSignal,
): Promise<RegisteredUser> {
  return postJson<RegisteredUser>(
    '/api/auth/register',
    {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      dateOfBirth: values.dateOfBirth,
      email: values.email.trim(),
      password: values.password,
    },
    signal,
  )
}

export interface RegistrationFailure {
  fieldErrors: FieldErrors
  /** Message for problems that belong to no single field. */
  formError?: string
}

const GENERIC_ERROR = 'Something went wrong. Please try again.'

/** Translates a failed request into messages the form can show. Codes are the backend contract. */
export function toRegistrationFailure(error: unknown): RegistrationFailure {
  if (!(error instanceof ApiError)) {
    return {
      fieldErrors: {},
      formError: 'Could not reach the server. Check your connection and try again.',
    }
  }

  switch (error.code) {
    case 'EMAIL_ALREADY_REGISTERED':
      return { fieldErrors: { email: 'This email address is already registered' } }
    case 'UNDERAGE_USER':
      return { fieldErrors: { dateOfBirth: 'You must be at least 18 years old' } }
    case 'WEAK_PASSWORD':
      return { fieldErrors: { password: error.message } }
    case 'VALIDATION_FAILED':
      return { fieldErrors: error.fieldErrors as FieldErrors }
  }
  if (error.status === 429) {
    return { fieldErrors: {}, formError: 'Too many attempts. Please wait a moment and try again.' }
  }
  return { fieldErrors: {}, formError: GENERIC_ERROR }
}
