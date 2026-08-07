import apiClient, { USE_MOCKS } from './apiClient'
import { mockDelay } from './mockHelpers'
import { DIAGNOSIS_STAGE } from '@/constants/status'

// --- Mock session store -----------------------------------------------
// Keyed by sessionId, so Processing can poll and watch a session progress
// through stages purely client-side until a real backend exists.
const STAGE_ORDER = [
  DIAGNOSIS_STAGE.UPLOADING,
  DIAGNOSIS_STAGE.PREPARING,
  DIAGNOSIS_STAGE.PROCESSING,
  DIAGNOSIS_STAGE.GENERATING,
  DIAGNOSIS_STAGE.FINALIZING,
]
const STAGE_DURATION_MS = 1400
const mockSessions = new Map()

// These four match the real model's actual output classes (confirmed from
// treatment_kb.csv) and their real per-class decision thresholds (from
// thresholds.npy), rather than placeholder disease names. Threshold order
// is an alphabetical assumption on the class names — unconfirmed against
// the real inference service.
function buildMockResult(session) {
  return {
    sessionId: session.id,
    patient: session.patientInfo,
    date: new Date(session.createdAt).toISOString(),
    inputSummary: {
      cbctUploaded: Boolean(session.cbctFileName),
      cbctFileName: session.cbctFileName,
      clinicalNotesReceived: true,
    },
    clinicalNotes: session.clinicalNotes,
    diseases: [
      { name: 'Caries', confidence: 0.86, status: 'Detected' },
      { name: 'Damaged / Missing Tooth', confidence: 0.71, status: 'Detected' },
      { name: 'Pulpitis', confidence: 0.58, status: 'Possible' },
      { name: 'Impacted Tooth', confidence: 0.19, status: 'Unlikely' },
    ],
  }
}

export const diagnosisApi = {
  async submit({ patientInfo, clinicalNotes, cbctFile }) {
    if (USE_MOCKS) {
      const id = `sess_${Date.now()}`
      mockSessions.set(id, {
        id,
        patientInfo,
        clinicalNotes,
        cbctFileName: cbctFile?.name ?? null,
        createdAt: Date.now(),
      })
      return mockDelay({ sessionId: id }, 400)
    }
    const formData = new FormData()
    formData.append('patientInfo', JSON.stringify(patientInfo))
    formData.append('clinicalNotes', JSON.stringify(clinicalNotes))
    if (cbctFile) formData.append('cbctFile', cbctFile)
    const { data } = await apiClient.post('/diagnosis/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async getStatus(sessionId) {
    if (USE_MOCKS) {
      const session = mockSessions.get(sessionId)
      if (!session) {
        const err = new Error('Session not found')
        err.code = 'NOT_FOUND'
        throw err
      }
      const elapsed = Date.now() - session.createdAt
      const stageIndex = Math.min(
        STAGE_ORDER.length,
        Math.floor(elapsed / STAGE_DURATION_MS)
      )
      const isComplete = stageIndex >= STAGE_ORDER.length
      const stage = isComplete ? DIAGNOSIS_STAGE.COMPLETE : STAGE_ORDER[stageIndex]
      const totalDuration = STAGE_ORDER.length * STAGE_DURATION_MS
      const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100))
      return mockDelay({ stage, progress }, 150)
    }
    const { data } = await apiClient.get(`/diagnosis/${sessionId}/status`)
    return data
  },

  async getResult(sessionId) {
    if (USE_MOCKS) {
      const session = mockSessions.get(sessionId)
      if (!session) {
        const err = new Error('Session not found')
        err.code = 'NOT_FOUND'
        throw err
      }
      return mockDelay(buildMockResult(session), 300)
    }
    const { data } = await apiClient.get(`/diagnosis/${sessionId}/result`)
    return data
  },
}
