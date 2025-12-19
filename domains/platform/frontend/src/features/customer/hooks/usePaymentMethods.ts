/**
 * Hook para gestión de métodos de pago del usuario
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentMethodService } from '../services/payment-method.service'
import { PaymentMethodFormData } from '../types/payment-method.types'
import { useUser } from './useUser'

export function usePaymentMethods() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const userId = user?.id ? String(user.id) : ''

  // Query para obtener todos los métodos de pago
  const {
    data: paymentMethods = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['paymentMethods', userId],
    queryFn: () => paymentMethodService.getPaymentMethods(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  // Mutation para crear método de pago
  const createMutation = useMutation({
    mutationFn: (data: PaymentMethodFormData) =>
      paymentMethodService.createPaymentMethod(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods', userId] })
    },
  })

  // Mutation para actualizar método de pago
  const updateMutation = useMutation({
    mutationFn: ({
      methodId,
      data,
    }: {
      methodId: string
      data: Partial<PaymentMethodFormData>
    }) => paymentMethodService.updatePaymentMethod(userId, methodId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods', userId] })
    },
  })

  // Mutation para eliminar método de pago
  const deleteMutation = useMutation({
    mutationFn: (methodId: string) =>
      paymentMethodService.deletePaymentMethod(userId, methodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods', userId] })
    },
  })

  // Mutation para marcar como predeterminado
  const setDefaultMutation = useMutation({
    mutationFn: (methodId: string) =>
      paymentMethodService.setDefaultPaymentMethod(userId, methodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods', userId] })
    },
  })

  // Obtener método de pago predeterminado
  const defaultPaymentMethod =
    paymentMethods.find((method) => method.isDefault) || null

  return {
    paymentMethods,
    defaultPaymentMethod,
    isLoading,
    error,
    refetch,
    createPaymentMethod: createMutation.mutateAsync,
    updatePaymentMethod: updateMutation.mutateAsync,
    deletePaymentMethod: deleteMutation.mutateAsync,
    setDefaultPaymentMethod: setDefaultMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettingDefault: setDefaultMutation.isPending,
  }
}
