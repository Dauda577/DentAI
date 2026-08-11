import { dashboardApi } from '@/api/dashboardApi'

function normalizeError(error) {
  return {
    message: error.message || 'Something went wrong loading the dashboard.',
    code: error.code ?? error.status ?? 'UNKNOWN',
  }
}

export const DashboardService = {
  async getStats() {
    try {
      return await dashboardApi.getStats()
    } catch (error) {
      throw normalizeError(error)
    }
  },
  async getRecentDiagnoses(params) {
    try {
      return await dashboardApi.getRecentDiagnoses(params)
    } catch (error) {
      throw normalizeError(error)
    }
  },
}
