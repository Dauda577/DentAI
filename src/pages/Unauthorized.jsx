import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import Button from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <ShieldAlert className="h-10 w-10 text-warning" />
      <h1 className="font-display text-xl font-semibold text-foreground">Access restricted</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        You don't have permission to view this page. Contact your administrator if you think this is a mistake.
      </p>
      <Link to={ROUTES.LOGIN}>
        <Button variant="secondary">Back to sign in</Button>
      </Link>
    </div>
  )
}
