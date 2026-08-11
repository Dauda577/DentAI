import { Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/utils/dateFormatter'
import { ROUTES } from '@/constants/routes'

const STATUS_TONE = { Completed: 'success', Processing: 'info', Failed: 'error' }

export default function RecentDiagnosesTable({ diagnoses, loading, pagination }) {
  const navigate = useNavigate()

  const columns = [
    { key: 'patientName', header: 'Patient' },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={STATUS_TONE[row.status] ?? 'neutral'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        row.patientId ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(ROUTES.PATIENT_PROFILE(row.patientId))
            }}
            aria-label="View patient"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={diagnoses}
      loading={loading}
      pagination={pagination}
      emptyMessage="No diagnoses yet."
    />
  )
}
