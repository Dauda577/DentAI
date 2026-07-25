import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import Button from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <FileQuestion className="h-10 w-10 text-muted-foreground" />
      <h1 className="font-display text-xl font-semibold text-foreground">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link to={ROUTES.DASHBOARD}>
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  )
}
