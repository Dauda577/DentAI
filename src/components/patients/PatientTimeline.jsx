import Timeline from '@/components/common/Timeline'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/utils/dateFormatter'

export default function PatientTimeline({ visits = [] }) {
  if (visits.length === 0) {
    return <p className="text-sm text-muted-foreground">No visits recorded yet.</p>
  }

  const items = visits.map((visit) => ({
    title: visit.reason,
    subtitle: formatDate(visit.date),
    status: visit.status === 'completed' ? 'complete' : 'pending',
    content: visit.notes ? (
      <p className="text-sm text-muted-foreground">{visit.notes}</p>
    ) : (
      <Badge tone="neutral">{visit.status}</Badge>
    ),
  }))

  return <Timeline items={items} />
}
