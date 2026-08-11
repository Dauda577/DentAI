import { settingsApi } from '@/api/settingsApi'

function normalizeError(error) {
  if (error.code === 'INVALID_PASSWORD') {
    return { message: 'Current password is incorrect.', code: error.code }
  }
  return {
    message: error.message || 'Something went wrong. Please try again.',
    code: error.code ?? error.status ?? 'UNKNOWN',
  }
}

export const SettingsService = {
  async getProfile() {
    try {
      return await settingsApi.getProfile()
    } catch (error) {
      throw normalizeError(error)
    }
  },
  async updateProfile(payload) {
    try {
      return await settingsApi.updateProfile(payload)
    } catch (error) {
      throw normalizeError(error)
    }
  },
  async updatePassword(payload) {
    try {
      return await settingsApi.updatePassword(payload)
    } catch (error) {
      throw normalizeError(error)
    }
  },
  async getNotificationPreferences() {
    try {
      return await settingsApi.getNotificationPreferences()
    } catch (error) {
      throw normalizeError(error)
    }
  },
  async updateNotificationPreferences(payload) {
    try {
      return await settingsApi.updateNotificationPreferences(payload)
    } catch (error) {
      throw normalizeError(error)
    }
  },
  async getSystemInfo() {
    try {
      return await settingsApi.getSystemInfo()
    } catch (error) {
      throw normalizeError(error)
    }
  },
}
