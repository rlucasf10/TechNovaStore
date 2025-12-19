/**
 * Tarjeta de Bienvenida
 * 
 * Muestra un saludo personalizado, fecha de registro y nivel de usuario
 * Requisitos: 11.1, 11.2
 */

'use client'

import { Calendar } from 'lucide-react'
import { AvatarWithFallback } from '@/shared/components/ui/AvatarWithFallback'
import { type User } from '@/customer'

interface WelcomeCardProps {
  user: User
}

export function WelcomeCard({ user }: WelcomeCardProps) {
  // Calcular tiempo como miembro
  const memberSince = new Date(user.createdAt)
  const now = new Date()
  const monthsDiff = (now.getFullYear() - memberSince.getFullYear()) * 12 + 
                     (now.getMonth() - memberSince.getMonth())
  
  const membershipDuration = monthsDiff < 1 
    ? 'Nuevo miembro' 
    : monthsDiff < 12 
      ? `${monthsDiff} ${monthsDiff === 1 ? 'mes' : 'meses'}` 
      : `${Math.floor(monthsDiff / 12)} ${Math.floor(monthsDiff / 12) === 1 ? 'año' : 'años'}`

  // Determinar nivel de usuario (puede ser extendido con lógica de fidelidad)
  const getUserLevel = () => {
    if (user.role === 'admin') return { name: 'Administrador', color: 'purple', icon: '👑' }
    if (monthsDiff >= 12) return { name: 'Miembro Gold', color: 'yellow', icon: '⭐' }
    if (monthsDiff >= 6) return { name: 'Miembro Silver', color: 'gray', icon: '🥈' }
    return { name: 'Miembro', color: 'blue', icon: '🎯' }
  }

  const userLevel = getUserLevel()

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 rounded-xl p-6 border border-blue-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ¡Hola, {user.firstName}! 👋
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenido de nuevo a tu dashboard
          </p>
        </div>

        {/* Avatar con fallback a iniciales si no hay imagen o falla */}
        <AvatarWithFallback
          src={user.avatar}
          alt={`${user.firstName} ${user.lastName || ''}`}
          firstName={user.firstName}
          lastName={user.lastName}
          size="xl"
        />
      </div>

      {/* Información de membresía */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Fecha de registro */}
        <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100 dark:border-slate-600">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Miembro desde</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {memberSince.toLocaleDateString('es-ES', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{membershipDuration}</p>
          </div>
        </div>

        {/* Nivel de usuario */}
        <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100 dark:border-slate-600">
          <div className={`w-10 h-10 bg-${userLevel.color}-100 dark:bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 text-xl`}>
            {userLevel.icon}
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Nivel</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {userLevel.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user.role === 'admin' ? 'Acceso completo' : 'Cliente'}
            </p>
          </div>
        </div>
      </div>

      {/* Mensaje motivacional */}
      <div className="mt-4 p-3 bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm rounded-lg border border-blue-100 dark:border-slate-600">
        <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
          💡 <span className="font-medium">Tip del día:</span> Explora nuestras ofertas especiales en la sección de productos destacados
        </p>
      </div>
    </div>
  )
}
