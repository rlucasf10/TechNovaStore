# Integración de Pagos - PaymentForm

## Resumen

El componente `PaymentForm` implementa un formulario completo de pago con soporte para:
- Tarjetas de crédito/débito (con validación Luhn)
- PayPal
- Transferencia bancaria

## Características Implementadas

### ✅ Validación de Tarjetas

- **Algoritmo de Luhn**: Validación matemática del número de tarjeta
- **Detección automática**: Visa, Mastercard, American Express, Discover
- **Formato automático**: Espaciado correcto según el tipo de tarjeta
- **Validación de expiración**: Verifica que la tarjeta no esté expirada
- **CVV enmascarado**: Campo de contraseña con opción de mostrar/ocultar

### ✅ Campos Enmascarados

- **Número de tarjeta**: Formato automático con espacios (4-4-4-4 o 4-6-5 para Amex)
- **CVV**: Campo tipo password con toggle para mostrar/ocultar
- **Validación en tiempo real**: Errores se limpian al escribir

### ✅ Iconos de Tarjetas

- Iconos SVG para Visa, Mastercard, American Express, Discover
- Detección automática del tipo de tarjeta mientras se escribe
- Muestra el icono correspondiente en el campo de número de tarjeta

### ✅ Badges de Seguridad

- **SSL Seguro**: Encriptación de 256 bits
- **PCI DSS**: Certificación de seguridad
- **Pago Seguro**: 100% protegido

### ✅ Opción de Guardar Tarjeta

- Checkbox para guardar la tarjeta para futuras compras
- En producción, esto se implementaría con tokenización (Stripe/PayPal)

## Integración con Stripe (Pendiente)

Para integrar con Stripe en producción:

### 1. Instalar Stripe SDK

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Configurar Stripe Provider

```typescript
// src/app/providers.tsx
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Elements stripe={stripePromise}>
      {/* otros providers */}
      {children}
    </Elements>
  )
}
```

### 3. Actualizar PaymentForm para usar Stripe Elements

```typescript
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

export function PaymentForm({ onComplete }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) return

    // Crear Payment Method
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement)!,
      billing_details: {
        name: cardDetails.name,
      },
    })

    if (error) {
      setErrors({ card: error.message })
      return
    }

    // Enviar paymentMethod.id al backend
    onComplete({
      paymentMethod: 'card',
      stripePaymentMethodId: paymentMethod.id,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Reemplazar inputs manuales con CardElement */}
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }}
      />
      {/* ... resto del formulario */}
    </form>
  )
}
```

### 4. Backend: Procesar el Pago

```typescript
// Backend: POST /api/checkout/process-payment
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function processPayment(req, res) {
  const { paymentMethodId, amount, orderId } = req.body

  try {
    // Crear Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe usa centavos
      currency: 'eur',
      payment_method: paymentMethodId,
      confirm: true,
      metadata: {
        orderId,
      },
    })

    if (paymentIntent.status === 'succeeded') {
      // Actualizar pedido como pagado
      await updateOrderStatus(orderId, 'paid')
      
      res.json({ success: true, orderId })
    } else {
      res.status(400).json({ error: 'Payment failed' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

## Integración con PayPal (Pendiente)

Para integrar con PayPal:

### 1. Instalar PayPal SDK

```bash
npm install @paypal/react-paypal-js
```

### 2. Configurar PayPal Provider

```typescript
// src/app/providers.tsx
import { PayPalScriptProvider } from '@paypal/react-paypal-js'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PayPalScriptProvider
      options={{
        'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        currency: 'EUR',
      }}
    >
      {children}
    </PayPalScriptProvider>
  )
}
```

### 3. Actualizar PaymentForm para PayPal

```typescript
import { PayPalButtons } from '@paypal/react-paypal-js'

export function PaymentForm({ onComplete }: PaymentFormProps) {
  return (
    <form>
      {paymentMethod === 'paypal' && (
        <PayPalButtons
          createOrder={(data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: totalAmount.toString(),
                  },
                },
              ],
            })
          }}
          onApprove={async (data, actions) => {
            const order = await actions.order!.capture()
            
            // Enviar al backend para verificar
            onComplete({
              paymentMethod: 'paypal',
              paypalOrderId: order.id,
            })
          }}
          onError={(err) => {
            console.error('PayPal error:', err)
            setErrors({ paypal: 'Error al procesar el pago con PayPal' })
          }}
        />
      )}
    </form>
  )
}
```

## Seguridad

### Datos Sensibles

**IMPORTANTE**: En producción, NUNCA enviar datos de tarjeta al backend directamente.

- ✅ **Correcto**: Usar Stripe Elements o PayPal SDK para tokenizar
- ❌ **Incorrecto**: Enviar `cardNumber`, `cvv`, etc. al backend

### Tokenización

```typescript
// Frontend: Crear token con Stripe
const { token } = await stripe.createToken(cardElement)

// Enviar solo el token al backend
fetch('/api/checkout/process', {
  method: 'POST',
  body: JSON.stringify({
    stripeToken: token.id, // Solo el token, no los datos reales
    amount: 1000,
  }),
})
```

### PCI DSS Compliance

Al usar Stripe Elements o PayPal SDK:
- Los datos de tarjeta nunca tocan tu servidor
- Stripe/PayPal maneja la encriptación y almacenamiento
- Tu aplicación mantiene compliance PCI DSS nivel más bajo

## Variables de Entorno Requeridas

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

## Testing

### Tarjetas de Prueba (Stripe)

```
Visa: 4242 4242 4242 4242
Mastercard: 5555 5555 5555 4444
Amex: 3782 822463 10005
Discover: 6011 1111 1111 1117

CVV: Cualquier 3 dígitos (4 para Amex)
Fecha: Cualquier fecha futura
```

### PayPal Sandbox

Crear cuentas de prueba en: https://developer.paypal.com/dashboard/accounts

## Estado Actual

- ✅ Formulario completo implementado
- ✅ Validación Luhn
- ✅ Campos enmascarados
- ✅ Iconos de tarjetas
- ✅ Badges de seguridad
- ⏳ Integración con Stripe (pendiente)
- ⏳ Integración con PayPal (pendiente)
- ⏳ Backend para procesar pagos (pendiente)

## Próximos Pasos

1. Instalar SDKs de Stripe y PayPal
2. Configurar providers en `app/providers.tsx`
3. Reemplazar inputs manuales con Stripe Elements
4. Implementar PayPal Buttons
5. Crear endpoints en backend para procesar pagos
6. Implementar webhooks para confirmaciones
7. Testing exhaustivo con tarjetas de prueba
