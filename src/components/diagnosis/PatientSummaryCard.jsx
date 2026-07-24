import Card from '@/components/ui/Card'
import { formatDate } from '@/utils/dateFormatter'

export default function PatientSummaryCard({ patient, date }) {
  return (
    <Card>
      <Card.Body className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div>
          <p className="text-xs text-text-secondary">Patient ID</p>
          <p className="mt-0.5 text-sm font-medium text-text">{patient?.patientId || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">Patient</p>
          <p className="mt-0.5 text-sm font-medium text-text">{patient?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">Age</p>
          <p className="mt-0.5 text-sm font-medium text-text">{patient?.age ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">Sex</p>
          <p className="mt-0.5 text-sm font-medium capitalize text-text">{patient?.sex ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">Date</p>
          <p className="mt-0.5 text-sm font-medium text-text">{formatDate(date)}</p>
        </div>
      </Card.Body>
    </Card>
  )
}
