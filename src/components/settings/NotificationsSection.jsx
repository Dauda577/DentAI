import Card from '@/components/ui/Card'
import Switch from '@/components/ui/Switch'

export default function NotificationsSection({ preferences, onChange }) {
  if (!preferences) return null

  return (
    <Card>
      <Card.Header>
        <h3 className="text-sm font-medium text-foreground">Notifications</h3>
      </Card.Header>
      <Card.Body className="flex flex-col divide-y divide-border">
        <div className="pb-3">
          <Switch
            id="emailAlerts"
            label="Email alerts"
            description="Get notified by email when a diagnosis finishes processing."
            checked={preferences.emailAlerts}
            onChange={(checked) => onChange({ ...preferences, emailAlerts: checked })}
          />
        </div>
        <div className="py-3">
          <Switch
            id="smsAlerts"
            label="SMS alerts"
            description="Get a text message for urgent results."
            checked={preferences.smsAlerts}
            onChange={(checked) => onChange({ ...preferences, smsAlerts: checked })}
          />
        </div>
        <div className="pt-3">
          <Switch
            id="weeklySummary"
            label="Weekly summary"
            description="A weekly digest of clinical activity."
            checked={preferences.weeklySummary}
            onChange={(checked) => onChange({ ...preferences, weeklySummary: checked })}
          />
        </div>
      </Card.Body>
    </Card>
  )
}
