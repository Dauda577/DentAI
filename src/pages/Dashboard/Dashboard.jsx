import { useCallback, useState } from 'react'
import { Users, Stethoscope, FileText, Activity } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Card from '@/components/ui/Card'
import StatCard from '@/components/dashboard/StatCard'
import RecentDiagnosesTable from '@/components/dashboard/RecentDiagnosesTable'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentReports from '@/components/dashboard/RecentReports'
import SystemStatus from '@/components/dashboard/SystemStatus'
import ErrorState from '@/components/common/ErrorState'
import { useApi } from '@/hooks/useApi'
import { DashboardService } from '@/services/DashboardService'

export default function Dashboard() {
  const [page, setPage] = useState(1)

  const fetchStats = useCallback(() => DashboardService.getStats(), [])
  const { data: stats, loading: statsLoading } = useApi(fetchStats)

  const fetchRecentDiagnoses = useCallback(
    () => DashboardService.getRecentDiagnoses({ page, pageSize: 5 }),
    [page]
  )
  const { data: recentDiagnoses, loading: diagnosesLoading, error: diagnosesError, refetch: refetchDiagnoses } =
    useApi(fetchRecentDiagnoses)

  return (
    <div>
      <PageHeader title="Dashboard" description="A quick overview of clinical activity." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Patients" value={stats?.totalPatients} icon={Users} loading={statsLoading} />
        <StatCard
          label="Diagnoses Completed"
          value={stats?.diagnosesCompleted}
          icon={Stethoscope}
          loading={statsLoading}
        />
        <StatCard
          label="Reports Generated"
          value={stats?.reportsGenerated}
          icon={FileText}
          loading={statsLoading}
        />
        <StatCard label="System Status" value="Operational" icon={Activity} loading={statsLoading} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Card.Header>
            <h3 className="text-sm font-medium text-foreground">Recent diagnoses</h3>
          </Card.Header>
          <Card.Body className="px-0 py-0">
            {diagnosesError ? (
              <div className="px-3 py-3">
                <ErrorState
                  title="Unable to load recent diagnoses"
                  message={diagnosesError.message}
                  onRetry={refetchDiagnoses}
                />
              </div>
            ) : (
              <div className="px-2">
                <RecentDiagnosesTable
                  diagnoses={recentDiagnoses?.items ?? []}
                  loading={diagnosesLoading}
                  pagination={
                    recentDiagnoses
                      ? { page: recentDiagnoses.page, pageCount: recentDiagnoses.pageCount, onPageChange: setPage }
                      : undefined
                  }
                />
              </div>
            )}
          </Card.Body>
        </Card>

        <div className="flex flex-col gap-6">
          <QuickActions />
          <RecentReports />
          <SystemStatus status={stats?.systemStatus} />
        </div>
      </div>
    </div>
  )
}
