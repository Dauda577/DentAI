import { CheckCircle2, XCircle } from 'lucide-react'
import Card from '@/components/ui/Card'

function Row({ label, ok }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
      <span className="text-sm text-foreground">{label}</span>
    </div>
  )
}

export default function InputSummary({ inputSummary }) {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-sm font-medium text-foreground">Input summary</h3>
      </Card.Header>
      <Card.Body className="flex flex-col gap-3">
        <Row
          label={inputSummary?.cbctUploaded ? `CBCT uploaded (${inputSummary.cbctFileName})` : 'CBCT uploaded'}
          ok={inputSummary?.cbctUploaded}
        />
        <Row label="Clinical notes received" ok={inputSummary?.clinicalNotesReceived} />
      </Card.Body>
    </Card>
  )
}
