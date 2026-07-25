import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { loginSchema } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values) => {
    setFormError('')
    try {
      await login(values)
      const redirectTo = location.state?.from?.pathname || ROUTES.DASHBOARD
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setFormError(err.message || 'Unable to sign in. Please try again.')
    }
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-foreground">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Access your DentAI clinical workspace.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@clinic.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <div className="flex items-center justify-end">
          <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link to={ROUTES.REGISTER} className="text-primary hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
