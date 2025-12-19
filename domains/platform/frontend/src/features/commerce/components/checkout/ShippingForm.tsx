'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ProvinceSelector } from '@/shared/components/checkout/ProvinceSelector'
import { MunicipalitySelector } from '@/shared/components/checkout/MunicipalitySelector'
import { StreetAutocomplete } from '@/shared/components/checkout/StreetAutocomplete'

// Schema de validación con Zod
const addressSchema = z.object({
  street: z.string().min(1, 'La calle es obligatoria'),
  number: z.string().min(1, 'El número es obligatorio'),
  floor: z.string().optional().default(''),
  door: z.string().optional().default(''),
  block: z.string().optional().default(''),
  stairs: z.string().optional().default(''),
  provinceCode: z.string().min(1, 'La provincia es obligatoria'),
  provinceName: z.string().optional().default(''),
  municipalityCode: z.string().min(1, 'El municipio es obligatorio'),
  city: z.string().min(1, 'La ciudad es obligatoria'),
  state: z.string().min(1, 'La provincia es obligatoria'),
  postal_code: z.string().min(5, 'El código postal es obligatorio').max(5, 'El código postal debe tener 5 dígitos'),
  country: z.string().default('España'),
})

// Schema opcional para billingAddress (cuando sameAsBilling es true)
const optionalAddressSchema = z.object({
  street: z.string().optional().default(''),
  number: z.string().optional().default(''),
  floor: z.string().optional().default(''),
  door: z.string().optional().default(''),
  block: z.string().optional().default(''),
  stairs: z.string().optional().default(''),
  provinceCode: z.string().optional().default(''),
  provinceName: z.string().optional().default(''),
  municipalityCode: z.string().optional().default(''),
  city: z.string().optional().default(''),
  state: z.string().optional().default(''),
  postal_code: z.string().optional().default(''),
  country: z.string().default('España'),
})

const shippingFormSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: z.union([addressSchema, optionalAddressSchema]),
  sameAsBilling: z.boolean(),
  savedAddressId: z.string().optional(),
}).superRefine((data, ctx) => {
  // Solo validar billingAddress si sameAsBilling es false
  if (!data.sameAsBilling) {
    if (!data.billingAddress.street || data.billingAddress.street.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La calle es obligatoria',
        path: ['billingAddress', 'street'],
      })
    }
    if (!data.billingAddress.number || data.billingAddress.number.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El número es obligatorio',
        path: ['billingAddress', 'number'],
      })
    }
    if (!data.billingAddress.provinceCode || data.billingAddress.provinceCode.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La provincia es obligatoria',
        path: ['billingAddress', 'provinceCode'],
      })
    }
    if (!data.billingAddress.municipalityCode || data.billingAddress.municipalityCode.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El municipio es obligatorio',
        path: ['billingAddress', 'municipalityCode'],
      })
    }
    if (!data.billingAddress.city || data.billingAddress.city.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La ciudad es obligatoria',
        path: ['billingAddress', 'city'],
      })
    }
    if (!data.billingAddress.state || data.billingAddress.state.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La provincia es obligatoria',
        path: ['billingAddress', 'state'],
      })
    }
    if (!data.billingAddress.postal_code || data.billingAddress.postal_code.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El código postal es obligatorio',
        path: ['billingAddress', 'postal_code'],
      })
    }
  }
})

type ShippingFormData = z.infer<typeof shippingFormSchema>

interface Address {
  street: string
  city: string
  state: string
  postal_code: string
  country: string
}

interface SavedAddress extends Address {
  id: string
  label: string
  isDefault: boolean
}

interface CheckoutData {
  shippingAddress: Address
  billingAddress: Address
  sameAsBilling: boolean
}

interface ShippingFormProps {
  initialData: Partial<CheckoutData>
  onComplete: (_data: Partial<CheckoutData>) => void
  savedAddresses?: SavedAddress[]
}

export function ShippingForm({ initialData, onComplete, savedAddresses = [] }: ShippingFormProps) {
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>('')
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false)
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      shippingAddress: initialData.shippingAddress || {
        street: '',
        number: '',
        floor: '',
        door: '',
        block: '',
        stairs: '',
        provinceCode: '',
        provinceName: '',
        municipalityCode: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'España',
      },
      billingAddress: initialData.billingAddress || {
        street: '',
        number: '',
        floor: '',
        door: '',
        block: '',
        stairs: '',
        provinceCode: '',
        provinceName: '',
        municipalityCode: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'España',
      },
      sameAsBilling: initialData.sameAsBilling ?? true,
      savedAddressId: '',
    },
  })

  const sameAsBilling = watch('sameAsBilling')
  const shippingAddress = watch('shippingAddress')

  // Calcular estimación de entrega cuando cambia el código postal
  useEffect(() => {
    const calculateDelivery = async () => {
      if (shippingAddress.postal_code && shippingAddress.postal_code.length === 5) {
        setIsLoadingEstimate(true)
        try {
          // Simulación de cálculo de entrega (en producción, llamar al backend)
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Lógica simple: 2-3 días para Madrid, 3-5 días para otras provincias
          const isMadrid = shippingAddress.postal_code.startsWith('28')
          const days = isMadrid ? '2-3' : '3-5'
          const deliveryDate = new Date()
          deliveryDate.setDate(deliveryDate.getDate() + (isMadrid ? 3 : 5))
          
          setEstimatedDelivery(
            `Entrega estimada: ${days} días laborables (antes del ${deliveryDate.toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'long' 
            })})`
          )
        } catch (error) {
          console.error('Error calculando entrega:', error)
          setEstimatedDelivery('No se pudo calcular la estimación de entrega')
        } finally {
          setIsLoadingEstimate(false)
        }
      } else {
        setEstimatedDelivery('')
      }
    }

    calculateDelivery()
  }, [shippingAddress.postal_code])

  // Manejar selección de dirección guardada
  const handleSavedAddressSelect = (addressId: string) => {
    const selected = savedAddresses.find(addr => addr.id === addressId)
    if (selected) {
      setValue('shippingAddress', {
        street: selected.street,
        number: '',
        floor: '',
        door: '',
        block: '',
        stairs: '',
        provinceCode: '',
        provinceName: '',
        municipalityCode: '',
        city: selected.city,
        state: selected.state,
        postal_code: selected.postal_code,
        country: selected.country,
      })
      setValue('savedAddressId', addressId)
    }
  }

  // Sincronizar dirección de facturación con dirección de envío si sameAsBilling es true
  useEffect(() => {
    if (sameAsBilling) {
      setValue('billingAddress', shippingAddress)
    }
  }, [sameAsBilling, shippingAddress, setValue])

  const onSubmit = (data: ShippingFormData) => {
    const submitData: Partial<CheckoutData> = {
      shippingAddress: data.shippingAddress,
      billingAddress: data.sameAsBilling ? data.shippingAddress : data.billingAddress,
      sameAsBilling: data.sameAsBilling,
    }
    
    onComplete(submitData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Selector de direcciones guardadas */}
      {savedAddresses.length > 0 && (
        <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
          <label htmlFor="saved-address-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Usar dirección guardada
          </label>
          <select
            id="saved-address-select"
            name="savedAddress"
            onChange={(e) => handleSavedAddressSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">Seleccionar dirección...</option>
            {savedAddresses.map((addr) => (
              <option key={addr.id} value={addr.id}>
                {addr.label} - {addr.street}, {addr.city}
                {addr.isDefault && ' (Predeterminada)'}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Dirección de Envío</h2>
        
        <div className="grid grid-cols-1 gap-4">
          {/* Calle y Número */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Controller
                name="shippingAddress.street"
                control={control}
                render={({ field }) => (
                  <StreetAutocomplete
                    value={field.value}
                    onChange={field.onChange}
                    onSelect={(address) => {
                      // Extraer calle y número si vienen en la dirección
                      const parts = address.street.split(' ');
                      const lastPart = parts[parts.length - 1];
                      
                      // Si el último elemento es un número, separarlo
                      if (/^\d+/.test(lastPart)) {
                        const streetName = parts.slice(0, -1).join(' ');
                        field.onChange(streetName);
                        setValue('shippingAddress.number', lastPart);
                      } else {
                        field.onChange(address.street);
                        if (address.houseNumber) {
                          setValue('shippingAddress.number', address.houseNumber);
                        }
                      }
                    }}
                    postalCode={watch('shippingAddress.postal_code')}
                    city={watch('shippingAddress.city')}
                    province={watch('shippingAddress.provinceName')}
                    error={errors.shippingAddress?.street?.message}
                    placeholder="Nombre de la calle (ej: Gran Vía)..."
                  />
                )}
              />
            </div>
            
            <Controller
              name="shippingAddress.number"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="shipping-number"
                  label="Número *"
                  error={errors.shippingAddress?.number?.message}
                  placeholder="28"
                />
              )}
            />
          </div>

          {/* Detalles adicionales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Controller
              name="shippingAddress.block"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="shipping-block"
                  label="Bloque"
                  placeholder="A"
                />
              )}
            />
            
            <Controller
              name="shippingAddress.stairs"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="shipping-stairs"
                  label="Escalera"
                  placeholder="1"
                />
              )}
            />
            
            <Controller
              name="shippingAddress.floor"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="shipping-floor"
                  label="Piso"
                  placeholder="3º"
                />
              )}
            />
            
            <Controller
              name="shippingAddress.door"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="shipping-door"
                  label="Puerta"
                  placeholder="B"
                />
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="shippingAddress.provinceCode"
              control={control}
              render={({ field }) => (
                <ProvinceSelector
                  value={field.value || null}
                  onChange={(code, name) => {
                    field.onChange(code)
                    setValue('shippingAddress.provinceName', name)
                    setValue('shippingAddress.state', name)
                    setSelectedProvinceCode(code)
                    // Limpiar municipio y código postal al cambiar provincia
                    setValue('shippingAddress.municipalityCode', '')
                    setValue('shippingAddress.city', '')
                    setValue('shippingAddress.postal_code', '')
                  }}
                  error={errors.shippingAddress?.provinceCode?.message}
                  placeholder="Selecciona provincia"
                />
              )}
            />
            
            <Controller
              name="shippingAddress.municipalityCode"
              control={control}
              render={({ field }) => (
                <MunicipalitySelector
                  provinceCode={selectedProvinceCode}
                  value={field.value || null}
                  onChange={(code, name, postalCodes) => {
                    field.onChange(code)
                    setValue('shippingAddress.city', name)
                    // Auto-completar código postal si hay uno solo
                    if (postalCodes && postalCodes.length === 1) {
                      setValue('shippingAddress.postal_code', postalCodes[0])
                    } else if (postalCodes && postalCodes.length > 0) {
                      // Si hay múltiples, usar el primero por defecto
                      setValue('shippingAddress.postal_code', postalCodes[0])
                    }
                  }}
                  error={errors.shippingAddress?.municipalityCode?.message}
                  placeholder="Selecciona municipio"
                  searchable={true}
                />
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="shippingAddress.postal_code"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="shipping-postal-code"
                  label="Código Postal *"
                  error={errors.shippingAddress?.postal_code?.message}
                  placeholder="28001"
                  maxLength={5}
                />
              )}
            />
            
            <Controller
              name="shippingAddress.country"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="shipping-country"
                  label="País *"
                  disabled
                />
              )}
            />
          </div>
        </div>

        {/* Estimación de entrega */}
        {estimatedDelivery && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-800 dark:text-green-200">
                {isLoadingEstimate ? 'Calculando entrega...' : estimatedDelivery}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Checkbox de dirección de facturación */}
      <div className="flex items-center">
        <Controller
          name="sameAsBilling"
          control={control}
          render={({ field }) => (
            <>
              <input
                id="same-as-billing"
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
              />
              <label htmlFor="same-as-billing" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                La dirección de facturación es la misma que la de envío
              </label>
            </>
          )}
        />
      </div>

      {/* Dirección de facturación */}
      {!sameAsBilling && (
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Dirección de Facturación</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <Controller
              name="billingAddress.street"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="billing-street"
                  label="Dirección completa *"
                  error={errors.billingAddress?.street?.message}
                  placeholder="Calle, número, piso, puerta..."
                />
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="billingAddress.city"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="billing-city"
                    label="Ciudad *"
                    error={errors.billingAddress?.city?.message}
                    placeholder="Madrid"
                  />
                )}
              />
              
              <Controller
                name="billingAddress.postal_code"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="billing-postal-code"
                    label="Código Postal *"
                    error={errors.billingAddress?.postal_code?.message}
                    placeholder="28001"
                    maxLength={5}
                  />
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="billingAddress.state"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="billing-state"
                    label="Provincia *"
                    error={errors.billingAddress?.state?.message}
                    placeholder="Madrid"
                  />
                )}
              />
              
              <Controller
                name="billingAddress.country"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="billing-country"
                    label="País *"
                    disabled
                  />
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mostrar errores generales */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Por favor, corrige los siguientes errores:
              </h3>
              <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                {errors.shippingAddress?.street && <li>{errors.shippingAddress.street.message}</li>}
                {errors.shippingAddress?.number && <li>{errors.shippingAddress.number.message}</li>}
                {errors.shippingAddress?.provinceCode && <li>{errors.shippingAddress.provinceCode.message}</li>}
                {errors.shippingAddress?.municipalityCode && <li>{errors.shippingAddress.municipalityCode.message}</li>}
                {errors.shippingAddress?.city && <li>{errors.shippingAddress.city.message}</li>}
                {errors.shippingAddress?.state && <li>{errors.shippingAddress.state.message}</li>}
                {errors.shippingAddress?.postal_code && <li>{errors.shippingAddress.postal_code.message}</li>}
                {!sameAsBilling && errors.billingAddress?.street && <li>Dirección de facturación: {errors.billingAddress.street.message}</li>}
                {!sameAsBilling && errors.billingAddress?.number && <li>Número de facturación: {errors.billingAddress.number.message}</li>}
                {!sameAsBilling && errors.billingAddress?.city && <li>Ciudad de facturación: {errors.billingAddress.city.message}</li>}
                {!sameAsBilling && errors.billingAddress?.state && <li>Provincia de facturación: {errors.billingAddress.state.message}</li>}
                {!sameAsBilling && errors.billingAddress?.postal_code && <li>CP de facturación: {errors.billingAddress.postal_code.message}</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-slate-700">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Procesando...' : 'Continuar al Pago →'}
        </Button>
      </div>
    </form>
  )
}