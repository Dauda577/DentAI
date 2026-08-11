import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import PatientTimeline from '@/components/patients/PatientTimeline'
import ErrorState from '@/components/common/ErrorState'
import { useApi } from '@/hooks/useApi'
import { PatientService } from '@/services/PatientService'
import { formatDate } from '@/utils/dateFormatter'
import { ROUTES } from '@/constants/routes'

// Mock visit history — will come from PatientService once the backend
// exposes a visits endpoint; kept local here so the timeline has something
// real to render against.
const MOCK_VISITS = [
  { reason: 'Routine checkup', date: '2026-06-18', status: 'completed', notes: 'No new findings.' },
  { reason: 'CBCT diagnosis session', date: '2026-04-02', status: 'completed', notes: 'Caries detected, restorative plan started.' },
  { reason: 'Follow-up scheduled', date: '2026-08-01', status: 'upcoming' },
]

export default function PatientProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  if (!id || id === 'null' || id === 'undefined') {
    return (
      <ErrorState
        title="Invalid patient"
        message="This patient reference is missing or invalid. Please go back and try again."
      />
    )
  }

  const fetchPatient = useCallback(() => PatientService.get(id), [id])
  const { data: patient, loading, error, refetch } = useApi(fetchPatient)

  if (loading) return <LoadingOverlay label="Loading patient…" />

  if (error || !patient) {
    return (
      <ErrorState
        title="Unable to load this patient"
        message={error?.message || 'Please check the patient and try again.'}
        onRetry={refetch}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Patient profile"
        actions={
          <Button icon={Stethoscope} size="sm" onClick={() => navigate(ROUTES.NEW_DIAGNOSIS)}>
            New diagnosis
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <Card.Body className="flex flex-col items-center gap-3 text-center">
            <Avatar name={patient.name} size="lg" />
            <div>
              <h2 className="font-display text-base font-medium text-foreground">{patient.name}</h2>
              <p className="text-sm text-muted-foreground capitalize">
                {patient.age} years · {patient.sex}
              </p>
            </div>
            <div className="mt-2 w-full space-y-2 border-t border-border pt-4 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="text-foreground">{patient.phone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last visit</span>
                <span className="text-foreground">{formatDate(patient.lastVisit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diagnoses</span>
                <span className="text-foreground">{patient.diagnosesCount}</span>
              </div>
            </div>
          </Card.Body>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <Card.Header>
              <h3 className="text-sm font-medium text-foreground">Timeline of visits</h3>
            </Card.Header>
            <Card.Body>
              <PatientTimeline visits={MOCK_VISITS} />
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-sm font-medium text-foreground">Clinical notes</h3>
            </Card.Header>
            <Card.Body>
              <p className="text-sm text-muted-foreground">
                Clinical notes from past visits will render here once linked to diagnosis sessions.
              </p>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-sm font-medium text-foreground">Reports & downloads</h3>
            </Card.Header>
            <Card.Body>
              <p className="text-sm text-muted-foreground">
                Reports generated for this patient will be listed here, filtered from the Reports service.
              </p>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  )
}
