import apiClient, { USE_MOCKS_DIAGNOSIS } from './apiClient'
import { mockDelay } from './mockHelpers'

export const treatmentApi = {
  async generate(sessionId) {
    if (USE_MOCKS_DIAGNOSIS) {
      return mockDelay({
        sessionId,
        phases: [
          {
            id: 'phase_1',
            title: 'Initial Restorative Care',
            duration: '1–2 weeks',
            status: 'Recommended',
            objectives: 'Address active decay before it progresses to the pulp.',
            description:
              'Composite restorations on the identified carious lesions, starting with the highest-confidence findings.',
            recommendations: ['Composite fillings on affected teeth', 'Fluoride varnish application'],
            expectedOutcomes: 'Halted decay progression and restored tooth structure.',
          },
          {
            id: 'phase_2',
            title: 'Endodontic Evaluation',
            duration: '2–3 weeks',
            status: 'Conditional',
            objectives: 'Confirm and treat the periapical lesion if symptomatic.',
            description:
              'Root canal therapy is indicated if the periapical lesion is confirmed symptomatic on clinical exam.',
            recommendations: ['Vitality testing', 'Root canal therapy if confirmed'],
            expectedOutcomes: 'Resolution of periapical infection and pain relief.',
          },
          {
            id: 'phase_3',
            title: 'Periodontal Monitoring',
            duration: 'Ongoing',
            status: 'Monitor',
            objectives: 'Track the possible periodontal bone loss over time.',
            description:
              'Scaling and root planing, with a follow-up CBCT in 6 months to assess progression.',
            recommendations: ['Scaling and root planing', 'Re-imaging in 6 months'],
            expectedOutcomes: 'Stabilized periodontal support and early detection of further loss.',
          },
        ],
      }, 500)
    }
    const { data } = await apiClient.post(`/treatment/${sessionId}/generate`)
    return data
  },
}
