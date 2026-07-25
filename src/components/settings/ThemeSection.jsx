import { Moon } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function ThemeSection() {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-sm font-medium text-foreground">Theme</h3>
      </Card.Header>
      <Card.Body className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15">
            <Moon className="h-4.5 w-4.5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Dark</p>
            <p className="text-xs text-muted-foreground">DentAI currently ships with one clinical dark theme.</p>
          </div>
        </div>
        <Badge tone="accent">Active</Badge>
      </Card.Body>
    </Card>
  )
}
