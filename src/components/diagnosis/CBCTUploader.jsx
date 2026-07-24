import Card from '@/components/ui/Card'
import FileUploader from '@/components/common/FileUploader'
import { validateCbctFile } from '@/utils/fileHelpers'
import { CBCT_ACCEPTED_EXTENSIONS, CBCT_MAX_SIZE_MB } from '@/constants/upload'

export default function CBCTUploader({ onFileChange }) {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-sm font-medium text-text">SECTION C: CBCT UPLOAD</h3>
      </Card.Header>
      <Card.Body>
        <FileUploader
          accept={CBCT_ACCEPTED_EXTENSIONS}
          maxSizeLabel={`${CBCT_MAX_SIZE_MB}MB`}
          validate={validateCbctFile}
          onFilesChange={onFileChange}
        />
      </Card.Body>
    </Card>
  )
}
