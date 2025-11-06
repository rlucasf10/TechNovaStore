/**
 * Hooks de React Query para el Carrito de Compras
 * 
 * Proporciona hooks para:
 * - useCart: Obtener el carrito actual
 * - useAddToCart: Agregar items al carrito
 * - useUpdateCartItem: Actualizar cantidad de items
 * - useRemoveCartItem: Eliminar items del carrito
 * - useClearCart: Limpiar todo el carrito
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartService, Cart, AddToCartRequest, UpdateCartItemRequest } from '@/services/cart.service';
import { useToast } from './useToast';

/**
 * Query keys para el carrito
 */
export const cartKeys = {
  all: ['cart'] as const,
  detail: () => [...cartKeys.all, 'detail'] as const,
};

/**
 * Hook para obtener el carrito actual
 */
export function useCart() {
  return useQuery({
    queryKey: cartKeys.detail(),
    queryFn: () => cartService.getCart(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos (antes cacheTime)
  });
}

/**
 * Hook para agregar items al carrito
 */
export function useAddToCart() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (request: AddToCartRequest) => cartService.addItem(request),
    onMutate: async (request) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() });

      // Snapshot del estado anterior
      const previousCart = queryClient.getQueryData<Cart>(cartKeys.detail());

      // Optimistic update
      if (previousCart) {
        const existingItemIndex = previousCart.items.findIndex(
          item => item.productId === request.productId
        );

        let updatedCart: Cart;
        if (existingItemIndex >= 0) {
          // Actualizar cantidad del item existente
          const updatedItems = [...previousCart.items];
          const existingItem = updatedItems[existingItemIndex];
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + request.quantity,
          };

          updatedCart = {
            ...previousCart,
            items: updatedItems,
            itemCount: previousCart.itemCount + request.quantity,
            updatedAt: new Date(),
          };
        } else {
          // Agregar nuevo item (optimistic, sin datos completos del producto)
          updatedCart = {
            ...previousCart,
            itemCount: previousCart.itemCount + request.quantity,
            updatedAt: new Date(),
          };
        }

        queryClient.setQueryData(cartKeys.detail(), updatedCart);
      }

      return { previousCart };
    },
    onError: (error, _request, context) => {
      // Revertir optimistic update en caso de error
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.detail(), context.previousCart);
      }

      toast.error(
        error instanceof Error ? error.message : 'Intenta de nuevo',
        'Error al agregar al carrito'
      );
    },
    onSuccess: (data) => {
      // Actualizar cache con datos del servidor
      queryClient.setQueryData(cartKeys.detail(), data);

      toast.success(
        `${data.itemCount} ${data.itemCount === 1 ? 'producto' : 'productos'} en tu carrito`,
        'Producto agregado al carrito'
      );
    },
  });
}

/**
 * Hook para actualizar la cantidad de un item
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (request: UpdateCartItemRequest) => cartService.updateQuantity(request),
    onMutate: async (request) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() });

      // Snapshot del estado anterior
      const previousCart = queryClient.getQueryData<Cart>(cartKeys.detail());

      // Optimistic update
      if (previousCart) {
        const updatedItems = previousCart.items.map(item =>
          item.productId === request.productId
            ? { ...item, quantity: request.quantity }
            : item
        ).filter(item => item.quantity > 0); // Eliminar items con cantidad 0

        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

        const updatedCart: Cart = {
          ...previousCart,
          items: updatedItems,
          itemCount,
          updatedAt: new Date(),
        };

        queryClient.setQueryData(cartKeys.detail(), updatedCart);
      }

      return { previousCart };
    },
    onError: (error, _request, context) => {
      // Revertir optimistic update en caso de error
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.detail(), context.previousCart);
      }

      toast.error(
        error instanceof Error ? error.message : 'Intenta de nuevo',
        'Error al actualizar el carrito'
      );
    },
    onSuccess: (data) => {
      // Actualizar cache con datos del servidor
      queryClient.setQueryData(cartKeys.detail(), data);
    },
  });
}

/**
 * Hook para eliminar un item del carrito
 */
export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (productId: string) => cartService.removeItem(productId),
    onMutate: async (productId) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() });

      // Snapshot del estado anterior
      const previousCart = queryClient.getQueryData<Cart>(cartKeys.detail());

      // Optimistic update
      if (previousCart) {
        const removedItem = previousCart.items.find(item => item.productId === productId);
        const updatedItems = previousCart.items.filter(item => item.productId !== productId);
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

        const updatedCart: Cart = {
          ...previousCart,
          items: updatedItems,
          itemCount,
          updatedAt: new Date(),
        };

        queryClient.setQueryData(cartKeys.detail(), updatedCart);

        return { previousCart, removedItem };
      }

      return { previousCart };
    },
    onError: (error, _productId, context) => {
      // Revertir optimistic update en caso de error
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.detail(), context.previousCart);
      }

      toast.error(
        error instanceof Error ? error.message : 'Intenta de nuevo',
        'Error al eliminar del carrito'
      );
    },
    onSuccess: (data, _productId, context) => {
      // Actualizar cache con datos del servidor
      queryClient.setQueryData(cartKeys.detail(), data);

      if (context?.removedItem) {
        toast.success(
          `${context.removedItem.name} fue eliminado del carrito`,
          'Producto eliminado'
        );
      }
    },
  });
}

/**
 * Hook para limpiar todo el carrito
 */
export function useClearCart() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: () => cartService.clearCart(),
    onMutate: async () => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() });

      // Snapshot del estado anterior
      const previousCart = queryClient.getQueryData<Cart>(cartKeys.detail());

      // Optimistic update - carrito vacío
      if (previousCart) {
        const emptyCart: Cart = {
          ...previousCart,
          items: [],
          subtotal: 0,
          shipping: 0,
          taxes: 0,
          discount: 0,
          total: 0,
          itemCount: 0,
          updatedAt: new Date(),
        };

        queryClient.setQueryData(cartKeys.detail(), emptyCart);
      }

      return { previousCart };
    },
    onError: (error, _variables, context) => {
      // Revertir optimistic update en caso de error
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.detail(), context.previousCart);
      }

      toast.error(
        error instanceof Error ? error.message : 'Intenta de nuevo',
        'Error al limpiar el carrito'
      );
    },
    onSuccess: (data) => {
      // Actualizar cache con datos del servidor
      queryClient.setQueryData(cartKeys.detail(), data);

      toast.success(
        'Todos los productos fueron eliminados',
        'Carrito limpiado'
      );
    },
  });
}

/**
 * Hook auxiliar para obtener la cantidad de un producto en el carrito
 */
export function useCartItemQuantity(productId: string): number {
  const { data: cart } = useCart();
  
  if (!cart) {
    return 0;
  }

  const item = cart.items.find(item => item.productId === productId);
  return item ? item.quantity : 0;
}

/**
 * Hook auxiliar para verificar si un producto está en el carrito
 */
export function useIsInCart(productId: string): boolean {
  const quantity = useCartItemQuantity(productId);
  return quantity > 0;
}
