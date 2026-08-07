import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import PatientInfoForm from '@/components/diagnosis/PatientInfoForm'
import ClinicalNotesForm from '@/components/diagnosis/ClinicalNotesForm'
import CBCTUploader from '@/components/diagnosis/CBCTUploader'
import Button from '@/components/ui/Button'
import { patientInfoSchema, clinicalNotesSchema } from '@/utils/validators'
import { DiagnosisService } from '@/services/DiagnosisService'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'

const schema = patientInfoSchema.merge(clinicalNotesSchema)

export default function NewDiagnosis() {
  const navigate = useNavigate()
  const toast = useToast()
  const [cbctFile, setCbctFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (values) => {
    setIsSubmitting(true)
    try {
      const { patientId, name, age, sex, weight, ...clinicalNotes } = values
      const { sessionId } = await DiagnosisService.submit({
        patientInfo: { patientId, name, age, sex, weight },
        clinicalNotes,
        cbctFile,
      })
      navigate(ROUTES.DIAGNOSIS_PROCESSING(sessionId))
    } catch (err) {
      toast.error(err.message || 'Unable to submit for analysis.')
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="New diagnosis"
        description="Enter patient information, clinical notes, and upload a CBCT scan for analysis."
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <PatientInfoForm register={register} errors={errors} />
            <ClinicalNotesForm register={register} errors={errors} />
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <CBCTUploader onFileChange={setCbctFile} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" size="lg" isLoading={isSubmitting} disabled={isSubmitting}>
            Analyze Patient
          </Button>
        </div>
      </form>
    </div>
  )
}
