import { patientApi } from '@/api/patientApi'

function normalizeError(error) {
  return {
    message:
      error.code === 'NOT_FOUND'
        ? 'This patient could not be found.'
        : error.message || 'Something went wrong. Please try again.',
    code: error.code ?? error.status ?? 'UNKNOWN',
  }
}

export const PatientService = {
  async list(params) {
    try {
      return await patientApi.list(params)
    } catch (error) {
      throw normalizeError(error)
    }
  },
  async get(id) {
    try {
      return await patientApi.get(id)
    } catch (error) {
      throw normalizeError(error)
    }
  },
  async create(payload) {
    try {
      return await patientApi.create(payload)
    } catch (error) {
      throw normalizeError(error)
    }
  },
  async update(id, payload) {
    try {
      return await patientApi.update(id, payload)
    } catch (error) {
      throw normalizeError(error)
    }
  },
  async remove(id) {
    try {
      return await patientApi.remove(id)
    } catch (error) {
      throw normalizeError(error)
    }
  },
}
