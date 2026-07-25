import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'

export default function StatCard({ label, value, icon: Icon, loading }) {
  return (
    <Card>
      <Card.Body className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-6 w-16" />
          ) : (
            <p className="mt-0.5 font-display text-xl font-semibold text-foreground">{value}</p>
          )}
        </div>
      </Card.Body>
    </Card>
  )
}
