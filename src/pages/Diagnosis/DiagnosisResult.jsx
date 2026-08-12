import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import PatientSummaryCard from '@/components/diagnosis/PatientSummaryCard'
import InputSummary from '@/components/diagnosis/InputSummary'
import ClinicalNotesSummary from '@/components/diagnosis/ClinicalNotesSummary'
import ResultsTable from '@/components/diagnosis/ResultsTable'
import CBCTPreviewPanel from '@/components/diagnosis/CBCTPreviewPanel'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import ErrorState from '@/components/common/ErrorState'
import { useApi } from '@/hooks/useApi'
import { DiagnosisService } from '@/services/DiagnosisService'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'

export default function DiagnosisResult() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  const fetchResult = useCallback(() => DiagnosisService.getResult(sessionId), [sessionId])
  const { data: result, loading, error, refetch } = useApi(fetchResult)

  const handleGenerateTreatment = async () => {
    setIsGenerating(true)
    navigate(ROUTES.TREATMENT_PLAN(sessionId))
  }

  const handleSave = () => {
    toast.success('Diagnosis result saved to patient record.')
  }

  if (loading) {
    return <LoadingOverlay label="Loading diagnosis result…" />
  }

  if (error || !result) {
    return (
      <ErrorState
        title="Unable to load this diagnosis result"
        message={error?.message || 'Please check the session and try again.'}
        onRetry={refetch}
      />
    )
  }

  return (
    <div>
      <PageHeader title="Diagnosis result" description="Review the findings before generating a treatment plan." />

      <div className="flex flex-col gap-6">
        <PatientSummaryCard patient={result.patient} date={result.date} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <InputSummary inputSummary={result.inputSummary} />
          <CBCTPreviewPanel fileName={result.inputSummary?.cbctFileName} />
        </div>

        <Card>
          <Card.Header>
            <h3 className="text-sm font-medium text-foreground">Disease results</h3>
          </Card.Header>
          <Card.Body className="px-0 py-0">
            <div className="px-5 py-2">
              <ResultsTable diseases={result.diseases} />
            </div>
          </Card.Body>
        </Card>

        <ClinicalNotesSummary notes={result.clinicalNotes} />

        {result.treatmentSummary && (
          <Card>
            <Card.Header>
              <h3 className="text-sm font-medium text-foreground">Treatment summary</h3>
            </Card.Header>
            <Card.Body>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {result.treatmentSummary}
              </p>
            </Card.Body>
          </Card>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(ROUTES.DASHBOARD)}>
            Back
          </Button>
          <Button variant="secondary" onClick={handleSave}>
            Save
          </Button>
          <Button onClick={handleGenerateTreatment} isLoading={isGenerating}>
            Generate Treatment Plan
          </Button>
        </div>
      </div>
    </div>
  )
}
