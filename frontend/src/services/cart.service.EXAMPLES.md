# Ejemplos de Uso del Cart Service

Este documento contiene ejemplos prácticos de cómo usar el servicio de carrito en diferentes escenarios.

## Ejemplo 1: Botón "Agregar al Carrito" en ProductCard

```typescript
'use client';

import { useAddToCart, useCartItemQuantity } from '@/hooks/useCart';
import { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useAddToCart();
  const quantity = useCartItemQuantity(product.id);

  const handleAddToCart = () => {
    addToCart.mutate({
      productId: product.id,
      quantity: 1,
    });
  };

  return (
    <div className="border rounded-lg p-4">
      <img 
        src={product.images[0]} 
        alt={product.name}
        className="w-full h-48 object-cover rounded"
      />
      <h3 className="mt-2 font-semibold">{product.name}</h3>
      <p className="text-gray-600">${product.our_price.toFixed(2)}</p>
      
      {quantity > 0 ? (
        <div className="mt-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-600">
            {quantity} en el carrito
          </span>
        </div>
      ) : null}
      
      <Button
        onClick={handleAddToCart}
        disabled={addToCart.isPending}
        className="mt-4 w-full"
      >
        {addToCart.isPending ? (
          'Agregando...'
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Agregar al carrito
          </>
        )}
      </Button>
    </div>
  );
}
```

## Ejemplo 2: Página de Carrito Completa

```typescript
'use client';

import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();

  if (isLoading) {
    return <div className="container mx-auto p-4">Cargando carrito...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
        <Link href="/productos">
          <Button>Explorar productos</Button>
        </Link>
      </div>
    );
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateItem.mutate({ productId, quantity: newQuantity });
  };

  const handleRemove = (productId: string) => {
    if (confirm('¿Eliminar este producto del carrito?')) {
      removeItem.mutate(productId);
    }
  };

  const handleClearCart = () => {
    if (confirm('¿Vaciar todo el carrito?')) {
      clearCart.mutate();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Carrito de Compras ({cart.itemCount} productos)
        </h1>
        <Button
          variant="ghost"
          onClick={handleClearCart}
          disabled={clearCart.isPending}
        >
          Limpiar carrito
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de productos */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 border rounded-lg"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-24 h-24 object-cover rounded"
              />
              
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                {item.brand && (
                  <p className="text-sm text-gray-600">Marca: {item.brand}</p>
                )}
                <p className="mt-2 font-bold">${item.price.toFixed(2)}</p>
              </div>

              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="text-red-600 hover:text-red-800"
                  disabled={removeItem.isPending}
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1 || updateItem.isPending}
                    className="p-1 border rounded hover:bg-gray-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <span className="w-12 text-center font-semibold">
                    {item.quantity}
                  </span>
                  
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                    disabled={updateItem.isPending}
                    className="p-1 border rounded hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <p className="font-bold">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen del carrito */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Resumen del pedido</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Envío:</span>
                <span>
                  {cart.shipping === 0 ? (
                    <span className="text-green-600">¡Gratis!</span>
                  ) : (
                    `$${cart.shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Impuestos (IVA 21%):</span>
                <span>${cart.taxes.toFixed(2)}</span>
              </div>
              
              {cart.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span>-${cart.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {cart.subtotal < 50 && (
              <p className="text-sm text-gray-600 mb-4">
                Agrega ${(50 - cart.subtotal).toFixed(2)} más para envío gratis
              </p>
            )}

            <Link href="/checkout">
              <Button className="w-full" size="lg">
                Proceder al pago
              </Button>
            </Link>
            
            <Link href="/productos">
              <Button variant="ghost" className="w-full mt-2">
                Continuar comprando
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Ejemplo 3: Mini Carrito en el Header

```typescript
'use client';

import { useCart } from '@/hooks/useCart';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

export function CartIcon() {
  const { data: cart } = useCart();

  return (
    <Link href="/carrito" className="relative">
      <ShoppingCart className="w-6 h-6" />
      {cart && cart.itemCount > 0 && (
        <Badge
          className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center"
          variant="primary"
        >
          {cart.itemCount}
        </Badge>
      )}
    </Link>
  );
}
```

## Ejemplo 4: Selector de Cantidad con Validación

```typescript
'use client';

import { useState } from 'react';
import { useAddToCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { Plus, Minus } from 'lucide-react';

interface QuantitySelectorProps {
  productId: string;
  maxQuantity?: number;
  inStock: boolean;
}

export function QuantitySelector({ 
  productId, 
  maxQuantity = 99,
  inStock 
}: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAddToCart();

  const handleDecrease = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const handleIncrease = () => {
    setQuantity(prev => Math.min(maxQuantity, prev + 1));
  };

  const handleAddToCart = () => {
    addToCart.mutate({
      productId,
      quantity,
    });
  };

  if (!inStock) {
    return (
      <div className="text-red-600 font-semibold">
        Producto agotado
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center border rounded-lg">
        <button
          onClick={handleDecrease}
          disabled={quantity <= 1}
          className="p-2 hover:bg-gray-100 disabled:opacity-50"
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <input
          type="number"
          value={quantity}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value >= 1 && value <= maxQuantity) {
              setQuantity(value);
            }
          }}
          className="w-16 text-center border-x py-2"
          min={1}
          max={maxQuantity}
        />
        
        <button
          onClick={handleIncrease}
          disabled={quantity >= maxQuantity}
          className="p-2 hover:bg-gray-100 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={addToCart.isPending}
        className="flex-1"
      >
        {addToCart.isPending ? 'Agregando...' : 'Agregar al carrito'}
      </Button>
    </div>
  );
}
```

## Ejemplo 5: Notificación de Producto Agregado

```typescript
'use client';

import { useAddToCart } from '@/hooks/useCart';
import { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  showViewCart?: boolean;
}

export function AddToCartButton({ 
  product, 
  quantity = 1,
  showViewCart = true 
}: AddToCartButtonProps) {
  const addToCart = useAddToCart();
  const router = useRouter();

  const handleAddToCart = () => {
    addToCart.mutate(
      {
        productId: product.id,
        quantity,
      },
      {
        onSuccess: () => {
          // El toast ya se muestra automáticamente en el hook
          // Aquí podemos agregar lógica adicional si es necesario
          
          if (showViewCart) {
            // Mostrar opción de ir al carrito
            const goToCart = confirm(
              `${product.name} agregado al carrito. ¿Ir al carrito?`
            );
            if (goToCart) {
              router.push('/carrito');
            }
          }
        },
      }
    );
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={addToCart.isPending || !product.is_active}
    >
      {addToCart.isPending ? 'Agregando...' : 'Agregar al carrito'}
    </Button>
  );
}
```

## Ejemplo 6: Carrito Persistente entre Sesiones

```typescript
'use client';

import { useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { cartService } from '@/services/cart.service';

/**
 * Hook para sincronizar el carrito al iniciar sesión
 * Migra el carrito de localStorage al backend
 */
export function useCartSync() {
  const { data: user } = useAuth();
  const { data: cart, refetch } = useCart();

  useEffect(() => {
    if (user && cart) {
      // Usuario acaba de iniciar sesión
      // Sincronizar carrito de localStorage con backend
      syncCartToBackend();
    }
  }, [user?.id]);

  const syncCartToBackend = async () => {
    try {
      // Obtener carrito de localStorage
      const localCart = cartService['getFromLocalStorage']();
      
      if (localCart.items.length > 0) {
        // Migrar items al backend
        for (const item of localCart.items) {
          await cartService.addItem({
            productId: item.productId,
            quantity: item.quantity,
          });
        }

        // Limpiar localStorage después de migrar
        cartService['clearLocalStorage']();
        
        // Refrescar carrito desde backend
        refetch();
      }
    } catch (error) {
      console.error('Error al sincronizar carrito:', error);
    }
  };
}

// Usar en el layout principal
export function CartSyncProvider({ children }: { children: React.ReactNode }) {
  useCartSync();
  return <>{children}</>;
}
```

## Ejemplo 7: Validación de Stock en Tiempo Real

```typescript
'use client';

import { useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/useToast';

/**
 * Hook para validar stock de productos en el carrito
 */
export function useCartStockValidation() {
  const { data: cart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    if (!cart || cart.items.length === 0) return;

    // Validar stock de cada producto
    cart.items.forEach(async (item) => {
      try {
        // Obtener información actualizada del producto
        const product = await productService.getProduct(item.productId);
        
        if (!product.is_active) {
          showToast({
            type: 'warning',
            message: 'Producto no disponible',
            description: `${item.name} ya no está disponible`,
          });
        } else if (item.quantity > product.stock_quantity) {
          showToast({
            type: 'warning',
            message: 'Stock limitado',
            description: `Solo quedan ${product.stock_quantity} unidades de ${item.name}`,
          });
        }
      } catch (error) {
        console.error('Error al validar stock:', error);
      }
    });
  }, [cart?.items]);
}
```

## Ejemplo 8: Carrito con Descuentos

```typescript
'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function DiscountCodeInput() {
  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const { data: cart } = useCart();

  const handleApplyDiscount = async () => {
    if (!code.trim()) return;

    setIsApplying(true);
    try {
      // Llamar al backend para aplicar el código de descuento
      const response = await fetch('/api/cart/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.success) {
        // Refrescar carrito
        queryClient.invalidateQueries({ queryKey: cartKeys.detail() });
        
        showToast({
          type: 'success',
          message: 'Código aplicado',
          description: `Descuento de $${data.discount.toFixed(2)} aplicado`,
        });
        
        setCode('');
      } else {
        showToast({
          type: 'error',
          message: 'Código inválido',
          description: data.message || 'El código no es válido',
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Error',
        description: 'No se pudo aplicar el código',
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Código de descuento</label>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CODIGO"
          disabled={isApplying}
        />
        <Button
          onClick={handleApplyDiscount}
          disabled={!code.trim() || isApplying}
        >
          {isApplying ? 'Aplicando...' : 'Aplicar'}
        </Button>
      </div>
      
      {cart && cart.discount > 0 && (
        <p className="text-sm text-green-600">
          Descuento aplicado: ${cart.discount.toFixed(2)}
        </p>
      )}
    </div>
  );
}
```

## Notas de Implementación

### Optimistic Updates

Todos los ejemplos aprovechan los **optimistic updates** de React Query, lo que significa que la UI se actualiza instantáneamente antes de que el servidor responda, proporcionando una experiencia de usuario fluida.

### Manejo de Errores

Los hooks incluyen manejo de errores automático con toasts. Si una operación falla, el estado se revierte automáticamente y se muestra un mensaje de error al usuario.

### Persistencia

El carrito se persiste automáticamente en localStorage, por lo que los usuarios no pierden su carrito al cerrar el navegador o refrescar la página.

### Performance

React Query gestiona el caché inteligentemente, evitando peticiones innecesarias al servidor y manteniendo los datos sincronizados.
