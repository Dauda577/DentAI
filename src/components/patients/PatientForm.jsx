import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

const patientFormSchema = z.object({
  name: z.string().min(1, 'Patient name is required'),
  patientReference: z.string().trim().max(50, 'Patient ID must be 50 characters or fewer').optional().default(''),
  age: z.number({ invalid_type_error: 'Age is required' }).int().positive().max(130),
  sex: z.enum(['male', 'female', 'other'], { errorMap: () => ({ message: 'Select a sex' }) }),
  phone: z.string().optional().default(''),
})

export default function PatientForm({ isOpen, onClose, onSubmit, initialValues, isSubmitting }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(patientFormSchema) })

  useEffect(() => {
    if (isOpen)
      reset(
        initialValues ?? { name: '', patientReference: '', age: undefined, sex: undefined, phone: '' }
      )
  }, [isOpen, initialValues, reset])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialValues ? 'Edit patient' : 'New patient'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
            {initialValues ? 'Save changes' : 'Create patient'}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Full name" placeholder="Patient name" error={errors.name?.message} {...register('name')} />
        <Input
          label="Patient ID"
          placeholder="e.g. PT-1042"
          error={errors.patientReference?.message}
          {...register('patientReference')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Age"
            type="number"
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
        </div>
        <Input label="Phone" placeholder="+233 …" {...register('phone')} />
      </form>
    </Modal>
  )
}
