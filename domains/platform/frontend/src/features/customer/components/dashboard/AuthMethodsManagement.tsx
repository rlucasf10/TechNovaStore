'use client'

import { useState } from 'react'
import { Key, Check, X, AlertTriangle, Loader2, Info, Shield } from 'lucide-react'
import { authService } from '@/customer'

// Iconos de proveedores
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

const GitHubIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)

interface AuthMethod {
  type: 'password' | 'google' | 'github'
  providerId?: string
  linkedAt: Date
  lastUsed?: Date
}

interface AuthMethodsManagementProps {
  authMethods?: AuthMethod[]
  onLinkMethod?: (provider: 'google' | 'github') => Promise<void>
  onUnlinkMethod?: (type: string) => Promise<void>
  onSetPassword?: () => void
  onChangePassword?: () => void
}

export function AuthMethodsManagement({
  authMethods = [],
  onLinkMethod,
  onUnlinkMethod,
  onSetPassword,
  onChangePassword,
}: AuthMethodsManagementProps) {
  const [methods, setMethods] = useState<AuthMethod[]>(authMethods)
  const [loading, setLoading] = useState(false)
  const [unlinkingMethod, setUnlinkingMethod] = useState<string | null>(null)
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState<string | null>(null)

  // Verificar qué métodos están vinculados
  const hasPassword = methods.some((m) => m.type === 'password')
  const hasGoogle = methods.some((m) => m.type === 'google')
  const hasGitHub = methods.some((m) => m.type === 'github')

  const getMethodInfo = (type: string) => {
    switch (type) {
      case 'password':
        return {
          icon: <Key className="w-5 h-5" />,
          name: 'Contraseña',
          description: 'Inicia sesión con email y contraseña',
          color: 'blue',
        }
      case 'google':
        return {
          icon: <GoogleIcon />,
          name: 'Google',
          description: 'Inicia sesión con tu cuenta de Google',
          color: 'red',
        }
      case 'github':
        return {
          icon: <GitHubIcon />,
          name: 'GitHub',
          description: 'Inicia sesión con tu cuenta de GitHub',
          color: 'gray',
        }
      default:
        return {
          icon: <Key className="w-5 h-5" />,
          name: type,
          description: '',
          color: 'gray',
        }
    }
  }

  const handleLinkMethod = async (provider: 'google' | 'github') => {
    setLoading(true)
    try {
      if (onLinkMethod) {
        await onLinkMethod(provider)
      } else {
        // Iniciar flujo OAuth
        await authService.oauthLogin(provider, '/dashboard/usuario?tab=profile')
      }
    } catch (error) {
      console.error('Error linking method:', error)
      alert('Error al vincular el método de autenticación')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlinkMethod = async (type: string) => {
    // Verificar que no sea el único método
    if (methods.length === 1) {
      alert('No puedes desvincular tu único método de autenticación')
      return
    }

    setUnlinkingMethod(type)
    try {
      if (onUnlinkMethod) {
        await onUnlinkMethod(type)
      }
      // Actualizar lista de métodos
      setMethods(methods.filter((m) => m.type !== type))
      setShowUnlinkConfirm(null)
      alert(`${getMethodInfo(type).name} desvinculado exitosamente`)
    } catch (error) {
      console.error('Error unlinking method:', error)
      alert('Error al desvincular el método')
    } finally {
      setUnlinkingMethod(null)
    }
  }

  // Todos los métodos disponibles
  const availableMethods = [
    {
      type: 'password',
      isLinked: hasPassword,
      canUnlink: methods.length > 1,
    },
    {
      type: 'google',
      isLinked: hasGoogle,
      canUnlink: methods.length > 1,
    },
    {
      type: 'github',
      isLinked: hasGitHub,
      canUnlink: methods.length > 1,
    },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Métodos de Inicio de Sesión</h3>
            <p className="text-sm text-gray-600">Gestiona cómo accedes a tu cuenta</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-medium mb-1">
              Recomendación de Seguridad
            </p>
            <p className="text-sm text-blue-800">
              Tener múltiples métodos de autenticación aumenta la seguridad de tu cuenta y te permite
              acceder incluso si olvidas tu contraseña.
            </p>
          </div>
        </div>

        {/* Methods List */}
        <div className="space-y-4">
          {availableMethods.map((method) => {
            const info = getMethodInfo(method.type)
            const linkedMethod = methods.find((m) => m.type === method.type)

            return (
              <div
                key={method.type}
                className={`p-4 rounded-lg border-2 transition-all ${
                  method.isLinked
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        method.isLinked
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {info.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{info.name}</h4>
                        {method.isLinked && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            <Check className="w-3 h-3" />
                            Vinculado
                          </span>
                        )}
                        {!method.isLinked && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full font-medium">
                            <X className="w-3 h-3" />
                            No vinculado
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{info.description}</p>

                      {/* Linked Info */}
                      {method.isLinked && linkedMethod && (
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>
                            Vinculado el{' '}
                            {new Date(linkedMethod.linkedAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          {linkedMethod.lastUsed && (
                            <p>
                              Último uso:{' '}
                              {new Date(linkedMethod.lastUsed).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {method.isLinked ? (
                      <>
                        {/* Botón específico para contraseña */}
                        {method.type === 'password' && (
                          <button
                            onClick={onChangePassword}
                            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            Cambiar Contraseña
                          </button>
                        )}

                        {/* Botón de desvincular */}
                        {showUnlinkConfirm === method.type ? (
                          <div className="flex flex-col gap-2">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-xs text-red-800 mb-2">
                                ¿Estás seguro de que quieres desvincular este método?
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUnlinkMethod(method.type)}
                                  disabled={unlinkingMethod === method.type}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {unlinkingMethod === method.type ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    'Confirmar'
                                  )}
                                </button>
                                <button
                                  onClick={() => setShowUnlinkConfirm(null)}
                                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (!method.canUnlink) {
                                alert('No puedes desvincular tu único método de autenticación')
                                return
                              }
                              setShowUnlinkConfirm(method.type)
                            }}
                            disabled={!method.canUnlink}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Desvincular
                          </button>
                        )}

                        {!method.canUnlink && (
                          <div className="flex items-center gap-1 text-xs text-yellow-600 mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Único método</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Botón de vincular */}
                        {method.type === 'password' ? (
                          <button
                            onClick={onSetPassword}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {loading ? 'Procesando...' : 'Establecer Contraseña'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLinkMethod(method.type as 'google' | 'github')}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {loading ? 'Procesando...' : `Vincular ${info.name}`}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Security Tip */}
        {methods.length === 1 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-900 font-medium mb-1">
                Mejora la seguridad de tu cuenta
              </p>
              <p className="text-sm text-yellow-800">
                Solo tienes un método de autenticación. Te recomendamos agregar al menos uno más
                para mayor seguridad y flexibilidad.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
