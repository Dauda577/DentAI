import { Outlet } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'
import vectorIllustration from '@/assets/vector_illustration.png'

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <img
        src={vectorIllustration}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15">
            <Stethoscope className="h-5.5 w-5.5 text-accent" />
          </div>
          <span className="font-display text-lg font-semibold text-foreground">
            Dent<span className="text-primary/70">AI</span>
          </span>
        </div>
        <div className="rounded-card border border-border bg-card p-6 shadow-lg">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
