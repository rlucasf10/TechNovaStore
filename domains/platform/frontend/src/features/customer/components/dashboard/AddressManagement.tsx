/**
 * Componente para gestión de direcciones de usuario
 * Permite agregar, editar, eliminar y marcar direcciones como predeterminadas
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAddresses } from '../../hooks/useAddresses'
import { AddressFormData, UserAddress, AddressLabel } from '../../types/address.types'
import { addressSchema } from '../../lib/auth-schemas'
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Home,
  Briefcase,
  MapPinned,
  Phone,
  User,
  Building2,
  Star
} from 'lucide-react'

type AddressMode = 'list' | 'create' | 'edit'

export function AddressManagement() {
  const {
    addresses,
    isLoading,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    isCreating,
    isUpdating,
    isDeleting,
  } = useAddresses()

  const [mode, setMode] = useState<AddressMode>('list')
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'Casa',
      country: 'España',
      isDefault: false
    }
  })

  const selectedLabel = watch('label')

  // Manejar creación de dirección
  const handleCreate = () => {
    reset({
      label: 'Casa',
      firstName: '',
      lastName: '',
      phone: '',
      street: '',
      streetNumber: '',
      apartment: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'España',
      isDefault: addresses.length === 0 // Primera dirección es predeterminada
    })
    setMode('create')
  }

  // Manejar edición de dirección
  const handleEdit = (address: UserAddress) => {
    setEditingAddress(address)
    reset({
      label: address.label,
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone,
      street: address.street,
      streetNumber: address.streetNumber,
      apartment: address.apartment || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault
    })
    setMode('edit')
  }

  // Cancelar formulario
  const handleCancel = () => {
    setMode('list')
    setEditingAddress(null)
    reset()
  }

  // Enviar formulario
  const onSubmit = async (data: AddressFormData) => {
    try {
      if (mode === 'create') {
        await createAddress(data)
      } else if (mode === 'edit' && editingAddress) {
        await updateAddress({ addressId: editingAddress.id, data })
      }
      handleCancel()
    } catch (error) {
      console.error('Error al guardar dirección:', error)
      alert('Error al guardar la dirección. Por favor, intenta de nuevo.')
    }
  }

  // Confirmar eliminación
  const handleDeleteConfirm = async (addressId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta dirección?')) {
      try {
        await deleteAddress(addressId)
      } catch (error) {
        console.error('Error al eliminar dirección:', error)
        alert('Error al eliminar la dirección. Por favor, intenta de nuevo.')
      }
    }
  }

  // Marcar como predeterminada
  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId)
    } catch (error) {
      console.error('Error al marcar como predeterminada:', error)
      alert('Error al actualizar la dirección. Por favor, intenta de nuevo.')
    }
  }

  // Obtener icono según el label
  const getLabelIcon = (label: string) => {
    switch (label) {
      case 'Casa':
        return <Home className="w-5 h-5" />
      case 'Trabajo':
        return <Briefcase className="w-5 h-5" />
      default:
        return <MapPinned className="w-5 h-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Vista de formulario (crear o editar)
  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {mode === 'create' ? 'Agregar Nueva Dirección' : 'Editar Dirección'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {mode === 'create' 
                ? 'Completa los datos de tu nueva dirección de envío'
                : 'Actualiza los datos de tu dirección'
              }
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Cancelar"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Tipo de dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de dirección
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Casa', 'Trabajo', 'Otro'] as AddressLabel[]).map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setValue('label', label)}
                  className={`
                    flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
                    ${selectedLabel === label
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  {getLabelIcon(label)}
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
            <input type="hidden" {...register('label')} />
          </div>

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('firstName')}
                  type="text"
                  className={`
                    w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                    ${errors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}
                  `}
                  placeholder="Juan"
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Apellido <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('lastName')}
                  type="text"
                  className={`
                    w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                    ${errors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}
                  `}
                  placeholder="Pérez"
                />
              </div>
              {errors.lastName && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('phone')}
                type="tel"
                className={`
                  w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                  ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}
                `}
                placeholder="+34 600 123 456"
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Calle y Número */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Calle <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('street')}
                  type="text"
                  className={`
                    w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                    ${errors.street ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}
                  `}
                  placeholder="Calle Mayor"
                />
              </div>
              {errors.street && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.street.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número <span className="text-red-500">*</span>
              </label>
              <input
                {...register('streetNumber')}
                type="text"
                className={`
                  w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                  ${errors.streetNumber ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}
                `}
                placeholder="123"
              />
              {errors.streetNumber && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.streetNumber.message}</p>
              )}
            </div>
          </div>

          {/* Apartamento/Piso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Apartamento, piso, etc. (opcional)
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('apartment')}
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                placeholder="Piso 3, Puerta B"
              />
            </div>
          </div>

          {/* Ciudad, Provincia y Código Postal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                {...register('city')}
                type="text"
                className={`
                  w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                  ${errors.city ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}
                `}
                placeholder="Madrid"
              />
              {errors.city && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Provincia <span className="text-red-500">*</span>
              </label>
              <input
                {...register('state')}
                type="text"
                className={`
                  w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                  ${errors.state ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}
                `}
                placeholder="Madrid"
              />
              {errors.state && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.state.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código Postal <span className="text-red-500">*</span>
              </label>
              <input
                {...register('postalCode')}
                type="text"
                className={`
                  w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                  ${errors.postalCode ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}
                `}
                placeholder="28001"
                maxLength={5}
              />
              {errors.postalCode && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.postalCode.message}</p>
              )}
            </div>
          </div>

          {/* País */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              País <span className="text-red-500">*</span>
            </label>
            <input
              {...register('country')}
              type="text"
              className={`
                w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                ${errors.country ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}
              `}
              placeholder="España"
            />
            {errors.country && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.country.message}</p>
            )}
          </div>

          {/* Marcar como predeterminada */}
          {addresses.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <input
                {...register('isDefault')}
                type="checkbox"
                id="isDefault"
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                Establecer como dirección predeterminada
              </label>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {(isCreating || isUpdating) && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {mode === 'create' ? 'Guardar Dirección' : 'Actualizar Dirección'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Vista de lista
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mis Direcciones</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tus direcciones de envío
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Agregar Dirección
        </button>
      </div>

      {/* Lista de direcciones */}
      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No tienes direcciones guardadas</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Agrega una dirección para agilizar tus compras</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Agregar Primera Dirección
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`
                relative bg-white dark:bg-slate-800 rounded-xl border-2 p-6 transition-all hover:shadow-md
                ${address.isDefault
                  ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                }
              `}
            >
              {/* Badge de predeterminada */}
              {address.isDefault && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                    <Star className="w-3 h-3 fill-current" />
                    Predeterminada
                  </span>
                </div>
              )}

              {/* Tipo de dirección */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${address.isDefault ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}
                `}>
                  {getLabelIcon(address.label)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{address.label}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {address.firstName} {address.lastName}
                  </p>
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-2 mb-4 text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium">
                  {address.street} {address.streetNumber}
                  {address.apartment && `, ${address.apartment}`}
                </p>
                <p>
                  {address.postalCode} {address.city}, {address.state}
                </p>
                <p>{address.country}</p>
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  {address.phone}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors font-medium"
                  >
                    <Check className="w-4 h-4" />
                    Predeterminada
                  </button>
                )}
                <button
                  onClick={() => handleEdit(address)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteConfirm(address.id)}
                  disabled={isDeleting}
                  className="flex items-center justify-center px-3 py-2 text-sm border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-medium disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
