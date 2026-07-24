import Card from '@/components/ui/Card'
import Textarea from '@/components/ui/Textarea'

export default function ClinicalNotesForm({ register, errors }) {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-sm font-medium text-text">SECTION B: CLINICAL NOTES</h3>
      </Card.Header>
      <Card.Body className="flex flex-col gap-4">
        <Textarea
          label="Chief Complaint"
          placeholder="What brings the patient in today?"
          error={errors.chiefComplaint?.message}
          {...register('chiefComplaint')}
        />
        <Textarea
          label="Subsequent"
          placeholder="Subsequent history / course since onset"
          {...register('subsequent')}
        />
        <Textarea
          label="Past Medical History"
          placeholder="Prior conditions, surgeries, medications, allergies"
          {...register('pastMedicalHistory')}
        />
        <Textarea
          label="Present Medical History"
          placeholder="Current conditions, medications, ongoing treatment"
          {...register('presentMedicalHistory')}
        />
        <Textarea
          label="Oral Examination"
          placeholder="Clinical findings from the oral exam"
          {...register('oralExamination')}
        />
      </Card.Body>
    </Card>
  )
}
