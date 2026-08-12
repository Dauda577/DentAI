import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import Card from '@/components/ui/Card'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import ErrorState from '@/components/common/ErrorState'
import ProcessingStages from '@/components/diagnosis/ProcessingStages'
import { DiagnosisService } from '@/services/DiagnosisService'
import { diagnosisApi } from '@/api/diagnosisApi'
import { usePolling } from '@/hooks/usePolling'
import { useToast } from '@/hooks/useToast'
import { DIAGNOSIS_STAGE } from '@/constants/status'
import { ROUTES } from '@/constants/routes'

export default function Processing() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [isRetrying, setIsRetrying] = useState(false)

  const fetchStatus = useCallback(() => DiagnosisService.getStatus(sessionId), [sessionId])
  const isTerminal = useCallback(
    (result) =>
      result?.stage === DIAGNOSIS_STAGE.COMPLETE || result?.stage === DIAGNOSIS_STAGE.FAILED,
    []
  )

  const { data, error } = usePolling(fetchStatus, {
    intervalMs: 1500,
    stopWhen: isTerminal,
    enabled: !isRetrying,
  })

  useEffect(() => {
    if (data?.stage === DIAGNOSIS_STAGE.COMPLETE) {
      navigate(ROUTES.DIAGNOSIS_RESULT(sessionId), { replace: true })
    }
  }, [data, navigate, sessionId])

  useEffect(() => {
    if (error) {
      toast.error(error.message || 'Unable to check diagnosis status.')
      navigate(ROUTES.NEW_DIAGNOSIS, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await diagnosisApi.runRealInference(sessionId)
    } catch (err) {
      toast.error(err.message || 'Inference failed. Please try again.')
    } finally {
      setIsRetrying(false)
    }
  }

  if (isRetrying) {
    return <LoadingOverlay label="Retrying diagnosis…" />
  }

  if (data?.stage === DIAGNOSIS_STAGE.FAILED) {
    return (
      <div>
        <PageHeader
          title="Diagnosis failed"
          description="The inference service could not complete this diagnosis."
        />
        <ErrorState
          title="Unable to complete diagnosis"
          message="The model could not process this case. You can retry — the patient and clinical notes are still saved."
          onRetry={handleRetry}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Processing diagnosis"
        description="Usually under a minute — stay on this page while the model runs."
      />
      <Card>
        <Card.Body>
          <ProcessingStages currentStage={data?.stage} progress={data?.progress ?? 0} />
        </Card.Body>
      </Card>
    </div>
  )
}
