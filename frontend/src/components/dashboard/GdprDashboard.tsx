'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface ConsentData {
  necessary_cookies: boolean
  analytics_cookies: boolean
  marketing_cookies: boolean
  data_processing: boolean
  email_marketing: boolean
  third_party_sharing: boolean
}

interface ConsentStatus {
  has_consent: boolean
  consent_data: ConsentData | null
  last_updated: string | null
}

interface GdprDashboardProps {
  className?: string
}

export function GdprDashboard({ className }: GdprDashboardProps) {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')

  useEffect(() => {
    fetchConsentStatus()
  }, [])

  const fetchConsentStatus = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) return

      const response = await fetch('/api/gdpr/consent', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setConsentStatus(data.data)
      }
    } catch (error) {
      console.error('Error fetching consent status:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateConsent = async (consentData: ConsentData) => {
    setUpdating(true)
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) return

      const response = await fetch('/api/gdpr/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ consent_data: consentData }),
      })

      if (response.ok) {
        await fetchConsentStatus()
        alert('Preferencias de privacidad actualizadas correctamente')
      } else {
        alert('Error al actualizar las preferencias')
      }
    } catch (error) {
      console.error('Error updating consent:', error)
      alert('Error al actualizar las preferencias')
    } finally {
      setUpdating(false)
    }
  }

  const exportPersonalData = async () => {
    setExporting(true)
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) return

      const response = await fetch('/api/gdpr/export', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `personal-data-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert('Datos personales exportados correctamente')
      } else {
        alert('Error al exportar los datos')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Error al exportar los datos')
    } finally {
      setExporting(false)
    }
  }

  const requestAccountDeletion = async () => {
    setDeleting(true)
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) return

      const response = await fetch('/api/gdpr/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirm_deletion: true,
          reason: deleteReason,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Solicitud de eliminación enviada. Tu cuenta será eliminada el ${new Date(data.scheduled_deletion_date).toLocaleDateString('es-ES')}`)
        setShowDeleteConfirm(false)
      } else {
        alert('Error al solicitar la eliminación de la cuenta')
      }
    } catch (error) {
      console.error('Error requesting account deletion:', error)
      alert('Error al solicitar la eliminación de la cuenta')
    } finally {
      setDeleting(false)
    }
  }

  const handleConsentChange = (key: keyof ConsentData, value: boolean) => {
    if (!consentStatus?.consent_data) return

    const updatedConsent = {
      ...consentStatus.consent_data,
      [key]: value,
    }

    updateConsent(updatedConsent)
  }

  if (loading) {
    return (
      <div className={cn('bg-white rounded-lg shadow p-6', className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-lg shadow', className)}>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Configuración de Privacidad y GDPR
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Gestiona tus preferencias de privacidad y datos personales
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Consent Preferences */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Preferencias de Cookies y Consentimiento
          </h3>
          
          {consentStatus?.has_consent ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Última actualización: {consentStatus.last_updated ? 
                  new Date(consentStatus.last_updated).toLocaleDateString('es-ES') : 
                  'No disponible'
                }
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {consentStatus.consent_data && Object.entries({
                  necessary_cookies: 'Cookies Necesarias',
                  analytics_cookies: 'Cookies de Análisis',
                  marketing_cookies: 'Cookies de Marketing',
                  data_processing: 'Procesamiento de Datos',
                  email_marketing: 'Marketing por Email',
                  third_party_sharing: 'Compartir con Terceros',
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                    <input
                      type="checkbox"
                      checked={consentStatus.consent_data![key as keyof ConsentData]}
                      onChange={(e) => handleConsentChange(key as keyof ConsentData, e.target.checked)}
                      disabled={key === 'necessary_cookies' || updating}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No se han registrado preferencias de consentimiento.</p>
              <p className="text-sm mt-2">Las preferencias se guardarán automáticamente cuando interactúes con el banner de cookies.</p>
            </div>
          )}
        </div>

        {/* Data Export */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Exportar Datos Personales
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Descarga una copia de todos tus datos personales almacenados en nuestro sistema.
            Esto incluye tu perfil, historial de consentimientos y solicitudes de eliminación.
          </p>
          <Button
            onClick={exportPersonalData}
            loading={exporting}
            variant="secondary"
          >
            {exporting ? 'Exportando...' : 'Exportar Mis Datos'}
          </Button>
        </div>

        {/* Account Deletion */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Eliminar Cuenta
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Solicita la eliminación permanente de tu cuenta y todos tus datos personales.
            Esta acción no se puede deshacer después del período de gracia de 30 días.
          </p>
          
          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="secondary"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Solicitar Eliminación de Cuenta
            </Button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-800 mb-3">
                Confirmar Eliminación de Cuenta
              </h4>
              <p className="text-sm text-red-700 mb-4">
                Esta acción eliminará permanentemente tu cuenta después de 30 días.
                Durante este período, puedes cancelar la solicitud.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-red-800 mb-2">
                  Motivo de eliminación (opcional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-md text-sm"
                  rows={3}
                  placeholder="Comparte el motivo de tu decisión..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={requestAccountDeletion}
                  loading={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  {deleting ? 'Procesando...' : 'Confirmar Eliminación'}
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="secondary"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Legal Information */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Información Legal
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              • Cumplimos con el Reglamento General de Protección de Datos (GDPR) de la UE
            </p>
            <p>
              • Cumplimos con la Ley Orgánica de Protección de Datos (LOPD) de España
            </p>
            <p>
              • Tienes derecho al acceso, rectificación, supresión y portabilidad de tus datos
            </p>
            <p>
              • Para consultas sobre privacidad, contacta: privacy@technovastore.com
            </p>
          </div>
          
          <div className="mt-4 flex gap-4">
            <a
              href="/privacy-policy"
              className="text-sm text-primary-600 hover:underline"
            >
              Política de Privacidad
            </a>
            <a
              href="/terms"
              className="text-sm text-primary-600 hover:underline"
            >
              Términos de Servicio
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}