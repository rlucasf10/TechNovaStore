/**
 * Componente para gestión de métodos de pago del usuario
 * Permite agregar, editar, eliminar y marcar tarjetas como predeterminadas
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePaymentMethods } from '../../hooks/usePaymentMethods'
import {
  PaymentMethod,
  PaymentMethodLabel,
} from '../../types/payment-method.types'
import {
  paymentMethodSchema,
  PaymentMethodFormData,
} from '../../lib/auth-schemas'
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  User,
  Calendar,
  Lock,
  Star,
  Building2,
} from 'lucide-react'

type PaymentMode = 'list' | 'create' | 'edit'

export function PaymentMethodManagement() {
  const {
    paymentMethods,
    isLoading,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    isCreating,
    isUpdating,
    isDeleting,
  } = usePaymentMethods()

  const [mode, setMode] = useState<PaymentMode>('list')
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: 'credit_card',
      label: 'Personal',
      billingCountry: 'España',
      isDefault: false,
    },
  })

  const selectedType = watch('type')
  const cardNumber = watch('cardNumber')

  // Detectar marca de tarjeta para mostrar icono
  const getCardBrandIcon = (number: string) => {
    const cleanNumber = (number || '').replace(/\s/g, '')
    if (/^4/.test(cleanNumber)) return '💳 Visa'
    if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber))
      return '💳 Mastercard'
    if (/^3[47]/.test(cleanNumber)) return '💳 Amex'
    if (/^6011/.test(cleanNumber) || /^65/.test(cleanNumber))
      return '💳 Discover'
    return '💳'
  }

  // Formatear número de tarjeta mientras se escribe
  const formatCardNumber = (value: string) => {
    const cleanValue = value.replace(/\s/g, '').replace(/\D/g, '')
    const groups = cleanValue.match(/.{1,4}/g)
    return groups ? groups.join(' ') : cleanValue
  }

  // Manejar creación de método de pago
  const handleCreate = () => {
    reset({
      type: 'credit_card',
      label: 'Personal',
      cardNumber: '',
      cardholderName: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      billingStreet: '',
      billingCity: '',
      billingState: '',
      billingPostalCode: '',
      billingCountry: 'España',
      isDefault: paymentMethods.length === 0,
    })
    setMode('create')
  }

  // Manejar edición de método de pago
  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    reset({
      type: method.type,
      label: method.label,
      cardNumber: method.cardNumber, // Enmascarado
      cardholderName: method.cardholderName,
      expiryMonth: method.expiryMonth,
      expiryYear: method.expiryYear,
      cvv: '', // No se guarda por seguridad
      billingStreet: method.billingAddress?.street || '',
      billingCity: method.billingAddress?.city || '',
      billingState: method.billingAddress?.state || '',
      billingPostalCode: method.billingAddress?.postalCode || '',
      billingCountry: method.billingAddress?.country || 'España',
      isDefault: method.isDefault,
    })
    setMode('edit')
  }

  // Cancelar formulario
  const handleCancel = () => {
    setMode('list')
    setEditingMethod(null)
    reset()
  }

  // Enviar formulario
  const onSubmit = async (data: PaymentMethodFormData) => {
    try {
      if (mode === 'create') {
        await createPaymentMethod(data)
      } else if (mode === 'edit' && editingMethod) {
        await updatePaymentMethod({ methodId: editingMethod.id, data })
      }
      handleCancel()
    } catch (error) {
      console.error('Error al guardar método de pago:', error)
      alert('Error al guardar el método de pago. Por favor, intenta de nuevo.')
    }
  }

  // Confirmar eliminación
  const handleDeleteConfirm = async (methodId: string) => {
    if (
      window.confirm('¿Estás seguro de que deseas eliminar este método de pago?')
    ) {
      try {
        await deletePaymentMethod(methodId)
      } catch (error) {
        console.error('Error al eliminar método de pago:', error)
        alert(
          'Error al eliminar el método de pago. Por favor, intenta de nuevo.'
        )
      }
    }
  }

  // Marcar como predeterminado
  const handleSetDefault = async (methodId: string) => {
    try {
      await setDefaultPaymentMethod(methodId)
    } catch (error) {
      console.error('Error al marcar como predeterminado:', error)
      alert('Error al actualizar el método de pago. Por favor, intenta de nuevo.')
    }
  }

  // Obtener color de marca de tarjeta
  const getCardBrandColor = (brand: string) => {
    switch (brand) {
      case 'visa':
        return 'from-blue-600 to-blue-800'
      case 'mastercard':
        return 'from-red-500 to-orange-500'
      case 'amex':
        return 'from-blue-400 to-blue-600'
      case 'discover':
        return 'from-orange-400 to-orange-600'
      default:
        return 'from-gray-600 to-gray-800'
    }
  }

  // Obtener nombre de marca de tarjeta
  const getCardBrandName = (brand: string) => {
    switch (brand) {
      case 'visa':
        return 'Visa'
      case 'mastercard':
        return 'Mastercard'
      case 'amex':
        return 'American Express'
      case 'discover':
        return 'Discover'
      default:
        return 'Tarjeta'
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
            <h3 className="text-xl font-bold text-gray-900">
              {mode === 'create'
                ? 'Agregar Método de Pago'
                : 'Editar Método de Pago'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {mode === 'create'
                ? 'Agrega una nueva tarjeta de crédito o débito'
                : 'Actualiza los datos de tu tarjeta'}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Cancelar"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Tipo de tarjeta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de tarjeta
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('type', 'credit_card')}
                className={`
                  flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
                  ${
                    selectedType === 'credit_card'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }
                `}
              >
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Crédito</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('type', 'debit_card')}
                className={`
                  flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
                  ${
                    selectedType === 'debit_card'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }
                `}
              >
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Débito</span>
              </button>
            </div>
            <input type="hidden" {...register('type')} />
          </div>

          {/* Etiqueta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Etiqueta
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Personal', 'Trabajo', 'Otro'] as PaymentMethodLabel[]).map(
                (label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setValue('label', label)}
                    className={`
                    px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium
                    ${
                      watch('label') === label
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }
                  `}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
            <input type="hidden" {...register('label')} />
          </div>

          {/* Número de tarjeta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de tarjeta <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('cardNumber')}
                type="text"
                maxLength={19}
                disabled={mode === 'edit'}
                onChange={(e) => {
                  const formatted = formatCardNumber(e.target.value)
                  setValue('cardNumber', formatted)
                }}
                className={`
                  w-full pl-10 pr-20 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'}
                  ${mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''}
                `}
                placeholder="1234 5678 9012 3456"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {getCardBrandIcon(cardNumber)}
              </span>
            </div>
            {errors.cardNumber && (
              <p className="text-sm text-red-600 mt-1">
                {errors.cardNumber.message}
              </p>
            )}
            {mode === 'edit' && (
              <p className="text-xs text-gray-500 mt-1">
                Por seguridad, no puedes modificar el número de tarjeta
              </p>
            )}
          </div>

          {/* Nombre del titular */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del titular <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('cardholderName')}
                type="text"
                className={`
                  w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase
                  ${errors.cardholderName ? 'border-red-500' : 'border-gray-300'}
                `}
                placeholder="JUAN PÉREZ"
              />
            </div>
            {errors.cardholderName && (
              <p className="text-sm text-red-600 mt-1">
                {errors.cardholderName.message}
              </p>
            )}
          </div>

          {/* Fecha de expiración y CVV */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mes <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('expiryMonth')}
                  type="text"
                  maxLength={2}
                  className={`
                    w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.expiryMonth ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="MM"
                />
              </div>
              {errors.expiryMonth && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.expiryMonth.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año <span className="text-red-500">*</span>
              </label>
              <input
                {...register('expiryYear')}
                type="text"
                maxLength={2}
                className={`
                  w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${errors.expiryYear ? 'border-red-500' : 'border-gray-300'}
                `}
                placeholder="AA"
              />
              {errors.expiryYear && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.expiryYear.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('cvv')}
                  type="password"
                  maxLength={4}
                  className={`
                    w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.cvv ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="***"
                />
              </div>
              {errors.cvv && (
                <p className="text-sm text-red-600 mt-1">{errors.cvv.message}</p>
              )}
            </div>
          </div>

          {/* Dirección de facturación (opcional) */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Dirección de facturación (opcional)
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  {...register('billingStreet')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Calle Mayor 123"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    {...register('billingCity')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Madrid"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia
                  </label>
                  <input
                    {...register('billingState')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Madrid"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Postal
                  </label>
                  <input
                    {...register('billingPostalCode')}
                    type="text"
                    maxLength={5}
                    className={`
                      w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      ${errors.billingPostalCode ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="28001"
                  />
                  {errors.billingPostalCode && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.billingPostalCode.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    {...register('billingCountry')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="España"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Marcar como predeterminado */}
          {paymentMethods.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <input
                {...register('isDefault')}
                type="checkbox"
                id="isDefault"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="isDefault"
                className="text-sm text-gray-700 cursor-pointer"
              >
                Establecer como método de pago predeterminado
              </label>
            </div>
          )}

          {/* Aviso de seguridad */}
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Tus datos están seguros
              </p>
              <p className="text-xs text-green-700 mt-1">
                Utilizamos encriptación SSL y cumplimos con los estándares PCI
                DSS para proteger tu información de pago.
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
              {mode === 'create' ? 'Agregar Tarjeta' : 'Actualizar Tarjeta'}
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
          <h3 className="text-xl font-bold text-gray-900">Métodos de Pago</h3>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona tus tarjetas de crédito y débito
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Agregar Tarjeta
        </button>
      </div>

      {/* Lista de métodos de pago */}
      {paymentMethods.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            No tienes métodos de pago guardados
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Agrega una tarjeta para compras más rápidas
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Agregar Primera Tarjeta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`
                relative overflow-hidden rounded-xl transition-all hover:shadow-lg
                ${method.isDefault ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              {/* Tarjeta visual */}
              <div
                className={`
                bg-gradient-to-br ${getCardBrandColor(method.cardBrand)} 
                p-6 text-white relative
              `}
              >
                {/* Badge de predeterminada */}
                {method.isDefault && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                      <Star className="w-3 h-3 fill-current" />
                      Predeterminada
                    </span>
                  </div>
                )}

                {/* Tipo y etiqueta */}
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-sm font-medium opacity-90">
                    {method.type === 'credit_card' ? 'Crédito' : 'Débito'} •{' '}
                    {method.label}
                  </span>
                </div>

                {/* Número de tarjeta */}
                <div className="mb-6">
                  <p className="text-xl font-mono tracking-wider">
                    {method.cardNumber}
                  </p>
                </div>

                {/* Nombre y expiración */}
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-70 mb-1">Titular</p>
                    <p className="font-medium uppercase">
                      {method.cardholderName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-70 mb-1">Expira</p>
                    <p className="font-medium">
                      {method.expiryMonth}/{method.expiryYear}
                    </p>
                  </div>
                </div>

                {/* Logo de marca */}
                <div className="absolute bottom-4 right-4 text-2xl font-bold opacity-30">
                  {getCardBrandName(method.cardBrand)}
                </div>
              </div>

              {/* Acciones */}
              <div className="bg-white p-4 flex gap-2">
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                  >
                    <Check className="w-4 h-4" />
                    Predeterminada
                  </button>
                )}
                <button
                  onClick={() => handleEdit(method)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteConfirm(method.id)}
                  disabled={isDeleting}
                  className="flex items-center justify-center px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Información de seguridad */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Lock className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-gray-700">
            Seguridad de tus datos
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Solo guardamos los últimos 4 dígitos de tu tarjeta. Los datos
            sensibles se procesan de forma segura y nunca se almacenan en
            nuestros servidores.
          </p>
        </div>
      </div>
    </div>
  )
}
