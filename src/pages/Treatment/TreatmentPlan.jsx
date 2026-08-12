import { useCallback, useEffect, useState } from 'react'
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
import { ReportService } from '@/services/ReportService'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'

function buildReportSummary(phases, notes) {
  const sections = []

  for (const phase of phases) {
    if (!phase?.title) continue
    const lines = [
      `${phase.title} — ${phase.duration}`,
      `Status: ${phase.status}`,
      phase.objectives ? `Objectives: ${phase.objectives}` : '',
      phase.description ? `Description: ${phase.description}` : '',
      phase.recommendations?.length
        ? `Recommendations: ${phase.recommendations.map((r) => `• ${r}`).join(' ')}`
        : '',
      phase.expectedOutcomes ? `Expected outcomes: ${phase.expectedOutcomes}` : '',
    ]
    sections.push(lines.filter(Boolean).join('\n'))
  }

  if (notes?.trim()) {
    sections.push(`Clinician notes:\n${notes.trim()}`)
  }

  return sections.join('\n\n')
}

export default function TreatmentPlan() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const fetchPlan = useCallback(() => TreatmentService.generate(sessionId), [sessionId])
  const { data: plan, loading, error, refetch } = useApi(fetchPlan)

  useEffect(() => {
    if (plan?.notes != null) setNotes(plan.notes)
  }, [plan])

  const handleSave = async () => {
    setSaving(true)
    try {
      await TreatmentService.saveNotes(sessionId, notes)
      toast.success('Treatment plan saved to patient record.')
    } catch (err) {
      toast.error(err?.message || 'Unable to save the treatment plan.')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateReport = async () => {
    setGenerating(true)
    try {
      const summary = buildReportSummary(plan?.phases ?? [], notes)
      await ReportService.create(sessionId, { type: 'Treatment Plan', summary })
      toast.success('Report generated and added to Reports.')
      navigate(ROUTES.REPORTS)
    } catch (err) {
      toast.error(err?.message || 'Unable to generate the report.')
      setGenerating(false)
    }
  }

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
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this treatment plan…"
              rows={4}
            />
          </Card.Body>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(ROUTES.DIAGNOSIS_RESULT(sessionId))}>
            Back
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            Print
          </Button>
          <Button variant="secondary" loading={generating} onClick={handleGenerateReport}>
            Generate Report
          </Button>
          <Button loading={saving} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}