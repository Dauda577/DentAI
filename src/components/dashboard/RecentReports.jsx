import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import { useApi } from '@/hooks/useApi'
import { ReportService } from '@/services/ReportService'
import { formatDate } from '@/utils/dateFormatter'
import { ROUTES } from '@/constants/routes'

export default function RecentReports() {
  const navigate = useNavigate()
  const fetchReports = useCallback(() => ReportService.list({ page: 1, pageSize: 4 }), [])
  const { data, loading } = useApi(fetchReports)

  return (
    <Card>
      <Card.Header className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text">Recent reports</h3>
        <button onClick={() => navigate(ROUTES.REPORTS)} className="text-xs text-accent hover:underline">
          View all
        </button>
      </Card.Header>
      <Card.Body className="flex flex-col gap-3">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}

        {!loading && (data?.items ?? []).length === 0 && (
          <p className="text-sm text-text-secondary">No reports yet.</p>
        )}

        {!loading &&
          (data?.items ?? []).map((report) => (
            <div key={report.id} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15">
                <FileText className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">{report.type}</p>
                <p className="text-xs text-text-secondary">
                  {report.patientName} · {formatDate(report.date)}
                </p>
              </div>
            </div>
          ))}
      </Card.Body>
    </Card>
  )
}
