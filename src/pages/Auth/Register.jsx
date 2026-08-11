import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MailCheck } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { AuthService } from '@/services/AuthService'
import { ROUTES } from '@/constants/routes'

const RESEND_COOLDOWN_SECONDS = 30

const registerSchema = z
  .object({
    name: z.string().min(1, 'Full name is required'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    // Supabase's default minimum is 6 — 8 here is our own stricter floor,
    // but check your project's Auth settings if signups start failing.
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function Register() {
  const { register: registerUser, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [formError, setFormError] = useState('')
  const [confirmationEmail, setConfirmationEmail] = useState(null)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (values) => {
    setFormError('')
    try {
      const { needsEmailConfirmation } = await registerUser(values)
      if (needsEmailConfirmation) {
        // Supabase created the account but won't issue a session until the
        // user clicks the confirmation link — there's no dashboard to send
        // them to yet.
        setConfirmationEmail(values.email)
        setResendCooldown(RESEND_COOLDOWN_SECONDS)
        return
      }
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch (err) {
      setFormError(err.message || 'Unable to create account. Please try again.')
    }
  }

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleResend = async () => {
    setIsResending(true)
    try {
      await AuthService.resendConfirmation(confirmationEmail)
      toast.success('Confirmation email resent.')
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      toast.error(err.message || 'Unable to resend the email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  if (confirmationEmail) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15">
          <MailCheck className="h-5.5 w-5.5 text-accent" />
        </div>
        <h1 className="mt-4 font-display text-xl font-semibold text-foreground">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We've sent a confirmation link to <span className="font-medium text-foreground">{confirmationEmail}</span>.
          Click it to activate your account, then sign in.
        </p>

        <Button
          variant="secondary"
          size="sm"
          className="mt-5"
          onClick={handleResend}
          isLoading={isResending}
          disabled={resendCooldown > 0}
        >
          {resendCooldown > 0 ? `Resend email (${resendCooldown}s)` : 'Resend email'}
        </Button>

        <Link to={ROUTES.LOGIN} className="mt-4 text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-foreground">Create account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Set up your DentAI clinical workspace.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <Input label="Full name" placeholder="Dr. Jane Doe" error={errors.name?.message} {...register('name')} />
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
        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={loginWithGoogle}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
      >
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Google
      </button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
