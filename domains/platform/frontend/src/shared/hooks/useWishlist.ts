/**
 * Hook personalizado para gestionar la lista de deseos
 * Integra React Query con Zustand store y el backend
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { wishlistService } from '@/shared/services'
import { useWishlistStore } from '@/shared/store'
import { useAuthStore } from '@/customer'
import { useToast } from './useToast'
import { Product } from '@/types'

export function useWishlist() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isAuthenticated } = useAuthStore()
  const { items, addItem, removeItem, setItems, isInWishlist, setLoading } = useWishlistStore()

  // Query para obtener la wishlist del backend
  const { isLoading, error, refetch } = useQuery({
    queryKey: ['user', 'wishlist'],
    queryFn: async () => {
      setLoading(true)
      try {
        const response = await wishlistService.getWishlist()
        // Actualizar el store local con los datos del backend
        const products = response.data.map((item: any) => item.product)
        setItems(products)
        return response.data
      } finally {
        setLoading(false)
      }
    },
    enabled: isAuthenticated, // Solo ejecutar si el usuario está autenticado
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
  })

  // Mutation para agregar a wishlist
  const addToWishlistMutation = useMutation({
    mutationFn: async (product: Product) => {
      if (!isAuthenticated) {
        throw new Error('Debes iniciar sesión para agregar a la lista de deseos')
      }
      
      const productId = product.id || (product as any)._id
      if (!productId) {
        throw new Error('ID de producto no válido')
      }

      return await wishlistService.addItem(productId)
    },
    onMutate: async (product) => {
      // Optimistic update: agregar al store local inmediatamente
      addItem(product)
    },
    onSuccess: () => {
      // Invalidar y refetch la wishlist
      queryClient.invalidateQueries({ queryKey: ['user', 'wishlist'] })
      
      toast.success(
        'Producto agregado a tu lista de deseos',
        '¡Guardado!'
      )
    },
    onError: (error: any, product) => {
      // Revertir el optimistic update
      const productId = product.id || (product as any)._id
      if (productId) {
        removeItem(productId)
      }
      
      const errorMessage = error.message || 'No se pudo agregar a la lista de deseos'
      toast.error(errorMessage, 'Error')
    },
  })

  // Mutation para eliminar de wishlist
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!isAuthenticated) {
        throw new Error('Debes iniciar sesión')
      }
      
      return await wishlistService.removeItem(productId)
    },
    onMutate: async (productId) => {
      // Optimistic update: eliminar del store local inmediatamente
      removeItem(productId)
    },
    onSuccess: () => {
      // Invalidar y refetch la wishlist
      queryClient.invalidateQueries({ queryKey: ['user', 'wishlist'] })
      
      toast.success(
        'Producto eliminado de tu lista de deseos',
        'Eliminado'
      )
    },
    onError: (error: any) => {
      // Revertir el optimistic update
      // Necesitaríamos el producto completo para revertir, por ahora solo refetch
      queryClient.invalidateQueries({ queryKey: ['user', 'wishlist'] })
      
      const errorMessage = error.message || 'No se pudo eliminar de la lista de deseos'
      toast.error(errorMessage, 'Error')
    },
  })

  // Función para toggle (agregar o eliminar)
  const toggleWishlist = async (product: Product) => {
    const productId = product.id || (product as any)._id
    
    if (!productId) {
      toast.error('ID de producto no válido', 'Error')
      return
    }

    if (isInWishlist(productId)) {
      await removeFromWishlistMutation.mutateAsync(productId)
    } else {
      await addToWishlistMutation.mutateAsync(product)
    }
  }

  return {
    // Estado
    items,
    isLoading: isLoading || useWishlistStore.getState().isLoading,
    error,
    
    // Funciones
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    toggleWishlist,
    isInWishlist,
    refetch,
    
    // Estados de mutación
    isAdding: addToWishlistMutation.isPending,
    isRemoving: removeFromWishlistMutation.isPending,
  }
}
