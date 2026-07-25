import { useNavigate } from 'react-router-dom'
import { Stethoscope, UserPlus, FileText } from 'lucide-react'
import Card from '@/components/ui/Card'
import { ROUTES } from '@/constants/routes'

const ACTIONS = [
  { label: 'New Diagnosis', icon: Stethoscope, to: ROUTES.NEW_DIAGNOSIS },
  { label: 'Add Patient', icon: UserPlus, to: ROUTES.PATIENTS },
  { label: 'View Reports', icon: FileText, to: ROUTES.REPORTS },
]

export default function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card>
      <Card.Header>
        <h3 className="text-sm font-medium text-foreground">Quick actions</h3>
      </Card.Header>
      <Card.Body className="flex flex-col gap-2">
        {ACTIONS.map(({ label, icon: Icon, to }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left text-sm
              font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-accent/5"
          >
            <Icon className="h-4.5 w-4.5 text-accent" />
            {label}
          </button>
        ))}
      </Card.Body>
    </Card>
  )
}
