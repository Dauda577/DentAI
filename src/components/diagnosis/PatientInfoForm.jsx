import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

export default function PatientInfoForm({ register, errors }) {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-sm font-medium text-foreground">SECTION A: PATIENT DEMOGRAPHICS</h3>
      </Card.Header>
      <Card.Body className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Patient ID"
            placeholder="e.g. PT-0042"
            error={errors.patientId?.message}
            {...register('patientId')}
          />
          <Input
            label="Patient name"
            placeholder="Full name"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <Input
            label="Weight (kg)"
            type="number"
            placeholder="e.g. 74"
            error={errors.weight?.message}
            {...register('weight', { valueAsNumber: true })}
          />
        </div>
      </Card.Body>
    </Card>
  )
}
