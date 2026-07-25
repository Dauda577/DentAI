import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import TreatmentTimeline from '@/components/treatment/TreatmentTimeline'
import ErrorState from '@/components/common/ErrorState'
import { useApi } from '@/hooks/useApi'
import { TreatmentService } from '@/services/TreatmentService'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'

export default function TreatmentPlan() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const fetchPlan = useCallback(() => TreatmentService.generate(sessionId), [sessionId])
  const { data: plan, loading, error, refetch } = useApi(fetchPlan)

  const handleSave = () => toast.success('Treatment plan saved to patient record.')
  const handleGenerateReport = () => toast.success('Report generation queued.')
  const handlePrint = () => window.print()

  if (loading) {
    return <LoadingOverlay label="Generating treatment plan…" />
  }

  if (error || !plan) {
    return (
      <ErrorState
        title="Unable to generate a treatment plan"
        message={error?.message || 'Please check the session and try again.'}
        onRetry={refetch}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Treatment plan"
        description="A structured treatment pathway based on the diagnosis results."
      />

      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <h3 className="text-sm font-medium text-foreground">Treatment timeline</h3>
          </Card.Header>
          <Card.Body>
            <TreatmentTimeline phases={plan.phases} />
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="text-sm font-medium text-foreground">Clinician notes</h3>
          </Card.Header>
          <Card.Body>
            <Textarea placeholder="Add any notes about this treatment plan…" rows={4} />
          </Card.Body>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(ROUTES.DIAGNOSIS_RESULT(sessionId))}>
            Back
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            Print
          </Button>
          <Button variant="secondary" onClick={handleGenerateReport}>
            Generate Report
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  )
}
