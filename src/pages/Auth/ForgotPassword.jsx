import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { AuthService } from '@/services/AuthService'
import { ROUTES } from '@/constants/routes'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
})

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }) => {
    setFormError('')
    try {
      await AuthService.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.')
    }
  }

  if (sent) {
    return (
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for that address, we've sent instructions to reset your password.
        </p>
        <Link to={ROUTES.LOGIN} className="mt-6 inline-block text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-foreground">Reset password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@clinic.com"
          error={errors.email?.message}
          {...register('email')}
        />
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to={ROUTES.LOGIN} className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
