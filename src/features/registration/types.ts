export interface RegistrationFormValues {
  firstName: string
  lastName: string
  dateOfBirth: string // yyyy-MM-dd, as produced by <input type="date">
  email: string
  password: string
}

export type RegistrationField = keyof RegistrationFormValues

export type FieldErrors = Partial<Record<RegistrationField, string>>

export interface RegisteredUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'CUSTOMER' | 'ORGANIZER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}
