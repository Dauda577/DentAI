import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import Card from '@/components/ui/Card'

const STATUS_CONFIG = {
  operational: { label: 'All systems operational', icon: CheckCircle2, className: 'text-success' },
  degraded: { label: 'Degraded performance', icon: AlertTriangle, className: 'text-warning' },
  down: { label: 'System outage', icon: XCircle, className: 'text-destructive' },
}

export default function SystemStatus({ status = 'operational' }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.operational
  const Icon = config.icon

  return (
    <Card>
      <Card.Header>
        <h3 className="text-sm font-medium text-foreground">System status</h3>
      </Card.Header>
      <Card.Body className="flex items-center gap-2.5">
        <Icon className={`h-4.5 w-4.5 ${config.className}`} />
        <span className="text-sm text-foreground">{config.label}</span>
      </Card.Body>
    </Card>
  )
}
