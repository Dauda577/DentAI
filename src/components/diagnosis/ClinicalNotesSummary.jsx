import Card from '@/components/ui/Card'

const FIELDS = [
  { key: 'chiefComplaint', label: 'Chief Complaint' },
  { key: 'subsequent', label: 'Subsequent' },
  { key: 'pastMedicalHistory', label: 'Past Medical History' },
  { key: 'presentMedicalHistory', label: 'Present Medical History' },
  { key: 'oralExamination', label: 'Oral Examination' },
]

export default function ClinicalNotesSummary({ notes }) {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-sm font-medium text-foreground">Clinical notes</h3>
      </Card.Header>
      <Card.Body className="flex flex-col gap-4">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-sm text-foreground">{notes?.[key] || '—'}</p>
          </div>
        ))}
      </Card.Body>
    </Card>
  )
}
