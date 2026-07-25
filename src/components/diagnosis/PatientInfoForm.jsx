import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

export default function PatientInfoForm({ register, errors }) {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-sm font-medium text-foreground">SECTION A: PATIENT DEMOGRAPHICS</h3>
      </Card.Header>
      <Card.Body className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Patient ID"
          placeholder="e.g. PT-0042"
          error={errors.patientId?.message}
          {...register('patientId')}
        />
        <Input label="Patient name" placeholder="Full name" error={errors.name?.message} {...register('name')} />
        <Input
          label="Age"
          type="number"
          placeholder="e.g. 34"
          error={errors.age?.message}
          {...register('age', { valueAsNumber: true })}
        />
        <Select
          label="Sex"
          placeholder="Select sex"
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]}
          error={errors.sex?.message}
          {...register('sex')}
        />
      </Card.Body>
    </Card>
  )
}
