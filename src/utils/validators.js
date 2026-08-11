import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const patientInfoSchema = z.object({
  patientId: z.string().optional().default(''),
  name: z.string().min(1, 'Patient name is required'),
  age: z
    .number({ invalid_type_error: 'Age is required' })
    .int('Age must be a whole number')
    .positive('Age must be greater than 0')
    .max(130, 'Enter a valid age'),
  sex: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Select a sex' }),
  }),
})

export const clinicalNotesSchema = z.object({
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  subsequent: z.string().optional().default(''),
  pastMedicalHistory: z.string().optional().default(''),
  presentMedicalHistory: z.string().optional().default(''),
  oralExamination: z.string().optional().default(''),
})
