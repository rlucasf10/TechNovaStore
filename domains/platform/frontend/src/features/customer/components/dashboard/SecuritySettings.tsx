'use client'

import { useState } from 'react'
import { Lock, Smartphone, Monitor, Chrome, AlertTriangle, Check, X, Loader2, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Schema de validación para cambio de contraseña
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
  confirmPassword: z.string().min(1, 'Confirma tu nueva contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

interface Session {
  id: string
  device: string
  browser: string
  location: string
  lastActive: Date
  isCurrent: boolean
}

interface SecuritySettingsProps {
  has2FA?: boolean
  sessions?: Session[]
  onChangePassword?: (data: ChangePasswordFormData) => Promise<void>
  onEnable2FA?: () => Promise<void>
  onDisable2FA?: () => Promise<void>
  onTerminateSession?: (sessionId: string) => Promise<void>
}

export function SecuritySettings({
  has2FA = false,
  sessions = [],
  onChangePassword,
  onEnable2FA,
  onDisable2FA,
  onTerminateSession,
}: SecuritySettingsProps) {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [is2FALoading, setIs2FALoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const newPassword = watch('newPassword')

  // Calcular fortaleza de contraseña
  const getPasswordStrength = (password: string): { level: number; label: string; color: string } => {
    if (!password) return { level: 0, label: '', color: '' }
    
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    if (strength <= 2) return { level: 1, label: 'Débil', color: 'bg-red-500' }
    if (strength <= 4) return { level: 2, label: 'Media', color: 'bg-yellow-500' }
    return { level: 3, label: 'Fuerte', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(newPassword || '')

  const onSubmitPassword = async (data: ChangePasswordFormData) => {
    setIsChangingPassword(true)
    try {
      if (onChangePassword) {
        await onChangePassword(data)
      }
      reset()
      setShowChangePassword(false)
      alert('Contraseña actualizada exitosamente')
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Error al cambiar la contraseña')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handle2FAToggle = async () => {
    setIs2FALoading(true)
    try {
      if (has2FA) {
        if (onDisable2FA) await onDisable2FA()
        alert('Autenticación de dos factores desactivada')
      } else {
        if (onEnable2FA) await onEnable2FA()
        alert('Autenticación de dos factores activada')
      }
    } catch (error) {
      console.error('Error toggling 2FA:', error)
      alert('Error al cambiar la configuración de 2FA')
    } finally {
      setIs2FALoading(false)
    }
  }

  const handleTerminateSession = async (sessionId: string) => {
    if (!confirm('¿Estás seguro de que quieres cerrar esta sesión?')) return
    
    try {
      if (onTerminateSession) {
        await onTerminateSession(sessionId)
      }
      alert('Sesión cerrada exitosamente')
    } catch (error) {
      console.error('Error terminating session:', error)
      alert('Error al cerrar la sesión')
    }
  }

  // Sesiones de ejemplo si no se proporcionan
  const displaySessions: Session[] = sessions.length > 0 ? sessions : [
    {
      id: '1',
      device: 'Windows',
      browser: 'Chrome',
      location: 'Madrid, España',
      lastActive: new Date(),
      isCurrent: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Cambio de Contraseña */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contraseña</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cambia tu contraseña regularmente</p>
              </div>
            </div>
            {!showChangePassword && (
              <button
                onClick={() => setShowChangePassword(true)}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                Cambiar Contraseña
              </button>
            )}
          </div>
        </div>

        {showChangePassword ? (
          <form onSubmit={handleSubmit(onSubmitPassword)} className="p-6">
            <div className="space-y-4">
              {/* Contraseña Actual */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña Actual <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...register('currentPassword')}
                    className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 ${
                      errors.currentPassword ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currentPassword.message}</p>
                )}
              </div>

              {/* Nueva Contraseña */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    {...register('newPassword')}
                    className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.newPassword.message}</p>
                )}

                {/* Indicador de fortaleza */}
                {newPassword && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Fortaleza:</span>
                      <span className={`text-sm font-medium ${
                        passwordStrength.level === 1 ? 'text-red-600 dark:text-red-400' :
                        passwordStrength.level === 2 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-green-600 dark:text-green-400'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.level / 3) * 100}%` }}
                      />
                    </div>

                    {/* Requisitos */}
                    <div className="mt-3 space-y-1">
                      <div className={`flex items-center gap-2 text-xs ${newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {newPassword.length >= 8 ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Mínimo 8 caracteres
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${/[A-Z]/.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {/[A-Z]/.test(newPassword) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Una mayúscula
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${/[a-z]/.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {/[a-z]/.test(newPassword) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Una minúscula
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${/[0-9]/.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {/[0-9]/.test(newPassword) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Un número
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {/[^A-Za-z0-9]/.test(newPassword) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Un carácter especial
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cambiando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Cambiar Contraseña
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    reset()
                    setShowChangePassword(false)
                  }}
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Última actualización: Hace 3 meses
            </p>
          </div>
        )}
      </div>

      {/* Autenticación de Dos Factores */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Autenticación de Dos Factores (2FA)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Agrega una capa extra de seguridad</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm font-medium ${has2FA ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {has2FA ? 'Activado' : 'Desactivado'}
                </span>
                {has2FA && (
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                    Protegido
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {has2FA
                  ? 'Tu cuenta está protegida con autenticación de dos factores'
                  : 'Protege tu cuenta con un código adicional al iniciar sesión'}
              </p>
              {!has2FA && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Recomendamos activar 2FA para mayor seguridad
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handle2FAToggle}
              disabled={is2FALoading}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                has2FA
                  ? 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30'
                  : 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30'
              }`}
            >
              {is2FALoading ? 'Procesando...' : has2FA ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        </div>
      </div>

      {/* Sesiones Activas */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/30 dark:to-teal-900/30 px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <Monitor className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sesiones Activas</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gestiona dónde has iniciado sesión</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {displaySessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    session.isCurrent ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-200 dark:bg-slate-600'
                  }`}>
                    {session.browser === 'Chrome' ? (
                      <Chrome className={`w-6 h-6 ${session.isCurrent ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
                    ) : (
                      <Monitor className={`w-6 h-6 ${session.isCurrent ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {session.device} • {session.browser}
                      </p>
                      {session.isCurrent && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                          Sesión actual
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{session.location}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {session.isCurrent ? 'Ahora' : `Última actividad: ${session.lastActive.toLocaleString()}`}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => handleTerminateSession(session.id)}
                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
