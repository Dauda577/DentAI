import { Eye, Download } from 'lucide-react'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/utils/dateFormatter'

const STATUS_TONE = { generated: 'success', draft: 'warning', archived: 'neutral' }

export default function ReportTable({ reports, loading, pagination, onView, onDownload }) {
  const columns = [
    { key: 'patientName', header: 'Patient' },
    {
      key: 'patientReference',
      header: 'Patient ID',
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">{row.patientReference || '—'}</span>
      ),
    },
    { key: 'type', header: 'Type' },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={STATUS_TONE[row.status] ?? 'neutral'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView?.(row)
            }}
            aria-label="View report"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-card-hover hover:text-foreground"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDownload?.(row)
            }}
            aria-label="Download report"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-card-hover hover:text-foreground"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={reports}
      loading={loading}
      pagination={pagination}
      emptyMessage="No reports match your search."
    />
  )
}
