/**
 * Hook para gestión de direcciones de usuario
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { addressService } from '../services/address.service'
import { AddressFormData } from '../types/address.types'
import { useUser } from './useUser'

export function useAddresses() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const userId = user?.id ? String(user.id) : ''

  // Query para obtener todas las direcciones
  const {
    data: addresses = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['addresses', userId],
    queryFn: () => addressService.getAddresses(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  // Mutation para crear dirección
  const createMutation = useMutation({
    mutationFn: (data: AddressFormData) => addressService.createAddress(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', userId] })
    },
  })

  // Mutation para actualizar dirección
  const updateMutation = useMutation({
    mutationFn: ({ addressId, data }: { addressId: string; data: Partial<AddressFormData> }) =>
      addressService.updateAddress(userId, addressId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', userId] })
    },
  })

  // Mutation para eliminar dirección
  const deleteMutation = useMutation({
    mutationFn: (addressId: string) => addressService.deleteAddress(userId, addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', userId] })
    },
  })

  // Mutation para marcar como predeterminada
  const setDefaultMutation = useMutation({
    mutationFn: (addressId: string) => addressService.setDefaultAddress(userId, addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', userId] })
    },
  })

  // Obtener dirección predeterminada
  const defaultAddress = addresses.find(addr => addr.isDefault) || null

  return {
    addresses,
    defaultAddress,
    isLoading,
    error,
    refetch,
    createAddress: createMutation.mutateAsync,
    updateAddress: updateMutation.mutateAsync,
    deleteAddress: deleteMutation.mutateAsync,
    setDefaultAddress: setDefaultMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettingDefault: setDefaultMutation.isPending,
  }
}
