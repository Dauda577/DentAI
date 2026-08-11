import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import ErrorState from '@/components/common/ErrorState'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  clinicName: z.string().optional().default(''),
})

export default function ProfileSection({ profile, onSave, isSaving, loading, error, onRetry }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (profile) reset(profile)
  }, [profile, reset])

  if (loading) {
    return (
      <Card>
        <Card.Header>
          <h3 className="text-sm font-medium text-foreground">Profile</h3>
        </Card.Header>
        <Card.Body className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="flex justify-end">
            <Skeleton className="h-9 w-32" />
          </div>
        </Card.Body>
      </Card>
    )
  }

  if (error || !profile) {
    return (
      <ErrorState
        title="Unable to load profile"
        message={error?.message || 'Please check your connection and try again.'}
        onRetry={onRetry}
      />
    )
  }

  return (
    <Card>
      <Card.Header>
        <h3 className="text-sm font-medium text-foreground">Profile</h3>
      </Card.Header>
      <Card.Body>
        <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full name" error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          </div>
          <Input label="Clinic name" {...register('clinicName')} />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSaving}>
              Save changes
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}
