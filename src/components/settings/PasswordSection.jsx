import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function PasswordSection({ onSave, isSaving }) {
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const submit = async (values) => {
    setFormError('')
    try {
      await onSave(values)
      reset()
    } catch (err) {
      setFormError(err.message || 'Unable to update password.')
    }
  }

  return (
    <Card>
      <Card.Header>
        <h3 className="text-sm font-medium text-foreground">Password</h3>
      </Card.Header>
      <Card.Body>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <Input
            label="Current password"
            type="password"
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="New password"
              type="password"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <Input
              label="Confirm new password"
              type="password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSaving}>
              Update password
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}
