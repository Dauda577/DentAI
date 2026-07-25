import { Pencil, Trash2 } from 'lucide-react'
import Table from '@/components/ui/Table'
import Avatar from '@/components/ui/Avatar'
import { formatDate } from '@/utils/dateFormatter'

export default function PatientTable({
  patients,
  loading,
  sort,
  onSortChange,
  pagination,
  onRowClick,
  onEdit,
  onDelete,
}) {
  const columns = [
    {
      key: 'name',
      header: 'Patient',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <span className="font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    { key: 'age', header: 'Age', sortable: true },
    { key: 'sex', header: 'Sex', render: (row) => <span className="capitalize">{row.sex}</span> },
    { key: 'phone', header: 'Phone' },
    { key: 'lastVisit', header: 'Last visit', sortable: true, render: (row) => formatDate(row.lastVisit) },
    { key: 'diagnosesCount', header: 'Diagnoses', sortable: true },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(row)
            }}
            aria-label="Edit patient"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-card-hover hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(row)
            }}
            aria-label="Delete patient"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-card-hover hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={patients}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      pagination={pagination}
      onRowClick={onRowClick}
      emptyMessage="No patients match your search."
    />
  )
}
