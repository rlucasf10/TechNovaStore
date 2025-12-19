'use client'

import React, { useState } from 'react'
import { User, Upload, Check, X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AvatarWithFallback } from '@/shared/components/ui/AvatarWithFallback'

// Schema de validación para información personal
const profileSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  phone: z.string().optional().refine(
    (val) => !val || /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(val),
    'Formato de teléfono inválido'
  ),
  birthDate: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileInformationProps {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
    avatar?: string
    birthDate?: Date
  }
  onUpdate?: (data: ProfileFormData) => Promise<void>
}

export function ProfileInformation({ user, onUpdate }: ProfileInformationProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      birthDate: user.birthDate ? user.birthDate.toISOString().split('T')[0] : '',
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño (máx 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen debe ser menor a 2MB')
        return
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten imágenes')
        return
      }

      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true)
    try {
      // TODO: Implementar upload de avatar si hay archivo
      if (avatarFile) {
        // const formData = new FormData()
        // formData.append('avatar', avatarFile)
        // await uploadAvatar(formData)
        console.log('Avatar file ready to upload:', avatarFile.name)
      }

      // Llamar al callback de actualización
      if (onUpdate) {
        await onUpdate(data)
      }

      setIsEditing(false)
      // Mostrar notificación de éxito
      alert('Perfil actualizado exitosamente')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error al actualizar el perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    reset()
    setAvatarPreview(user.avatar || null)
    setAvatarFile(null)
    setIsEditing(false)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-700 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Información Personal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gestiona tu información de perfil</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-start gap-6 pb-6 border-b border-gray-200 dark:border-slate-700">
            <div className="relative">
              {/* Avatar con fallback a iniciales si no hay imagen o falla */}
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg"
                  onError={(e) => {
                    // Si la imagen falla, ocultar y mostrar el fallback
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              {/* Fallback con AvatarWithFallback (siempre presente pero oculto si hay preview válido) */}
              <div className={avatarPreview ? 'hidden' : ''}>
                <AvatarWithFallback
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  size="2xl"
                  className="border-4 border-white dark:border-slate-700"
                />
              </div>
              {isEditing && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                >
                  <Upload className="w-4 h-4 text-white" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Foto de perfil</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                JPG, PNG o GIF (máx. 2MB). Recomendado: 400x400px
              </p>
              {isEditing && (
                <div className="flex gap-2">
                  <label
                    htmlFor="avatar-upload"
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Cambiar foto
                  </label>
                  {avatarPreview && avatarPreview !== user.avatar && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarPreview(user.avatar || null)
                        setAvatarFile(null)
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                {...register('firstName')}
                disabled={!isEditing}
                className={`w-full px-4 py-2.5 border rounded-lg transition-colors text-gray-900 dark:text-gray-100 ${
                  isEditing
                    ? 'border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700'
                    : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400'
                } ${errors.firstName ? 'border-red-500' : ''}`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
              )}
            </div>

            {/* Apellido */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Apellido <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                {...register('lastName')}
                disabled={!isEditing}
                className={`w-full px-4 py-2.5 border rounded-lg transition-colors text-gray-900 dark:text-gray-100 ${
                  isEditing
                    ? 'border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700'
                    : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400'
                } ${errors.lastName ? 'border-red-500' : ''}`}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>
              )}
            </div>

            {/* Email (no editable) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">El email no se puede cambiar</p>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                disabled={!isEditing}
                placeholder="+34 600 000 000"
                className={`w-full px-4 py-2.5 border rounded-lg transition-colors text-gray-900 dark:text-gray-100 ${
                  isEditing
                    ? 'border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700'
                    : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400'
                } ${errors.phone ? 'border-red-500' : ''}`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone.message}</p>
              )}
            </div>

            {/* Fecha de nacimiento */}
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de nacimiento
              </label>
              <input
                id="birthDate"
                type="date"
                {...register('birthDate')}
                disabled={!isEditing}
                className={`w-full px-4 py-2.5 border rounded-lg transition-colors text-gray-900 dark:text-gray-100 ${
                  isEditing
                    ? 'border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700'
                    : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400'
                }`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
              <button
                type="submit"
                disabled={isSaving || !isDirty}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
