import Card from '@/components/ui/Card'
import { formatDate } from '@/utils/dateFormatter'

export default function PatientSummaryCard({ patient, date }) {
  return (
    <Card>
      <Card.Body className="grid grid-cols-2 gap-4 sm:grid-cols-6">
        <div>
          <p className="text-xs text-muted-foreground">Patient ID</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{patient?.patientId || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Patient</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{patient?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Age</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{patient?.age ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Sex</p>
          <p className="mt-0.5 text-sm font-medium capitalize text-foreground">{patient?.sex ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Weight</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {patient?.weight ? `${patient.weight} kg` : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Date</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{formatDate(date)}</p>
        </div>
      </Card.Body>
    </Card>
  )
}
