'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Address } from '@/types'
import { CheckoutData } from '@/app/checkout/page'

interface ShippingFormProps {
  initialData: Partial<CheckoutData>
  onComplete: (_data: Partial<CheckoutData>) => void
}

export function ShippingForm({ initialData, onComplete }: ShippingFormProps) {
  const [formData, setFormData] = useState({
    shippingAddress: initialData.shippingAddress || {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'España',
    },
    billingAddress: initialData.billingAddress || {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'España',
    },
    sameAsBilling: initialData.sameAsBilling ?? true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string, addressType: 'shipping' | 'billing' = 'shipping') => {
    setFormData(prev => ({
      ...prev,
      [`${addressType}Address`]: {
        ...prev[`${addressType}Address`],
        [field]: value,
      },
    }))

    // Clear error when user starts typing
    if (errors[`${addressType}.${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`${addressType}.${field}`]: '',
      }))
    }
  }

  const handleSameAsBillingChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sameAsBilling: checked,
      billingAddress: checked ? prev.shippingAddress : prev.billingAddress,
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate shipping address
    const requiredFields = ['street', 'city', 'state', 'postal_code']
    
    requiredFields.forEach(field => {
      if (!formData.shippingAddress[field as keyof Address]) {
        newErrors[`shipping.${field}`] = 'Este campo es obligatorio'
      }
    })

    // Validate postal code format (Spanish format)
    if (formData.shippingAddress.postal_code && !/^\d{5}$/.test(formData.shippingAddress.postal_code)) {
      newErrors['shipping.postal_code'] = 'Código postal debe tener 5 dígitos'
    }

    // Validate billing address if different from shipping
    if (!formData.sameAsBilling) {
      requiredFields.forEach(field => {
        if (!formData.billingAddress[field as keyof Address]) {
          newErrors[`billing.${field}`] = 'Este campo es obligatorio'
        }
      })

      if (formData.billingAddress.postal_code && !/^\d{5}$/.test(formData.billingAddress.postal_code)) {
        newErrors['billing.postal_code'] = 'Código postal debe tener 5 dígitos'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      const submitData = {
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.sameAsBilling ? formData.shippingAddress : formData.billingAddress,
        sameAsBilling: formData.sameAsBilling,
      }
      
      onComplete(submitData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-6">Dirección de Envío</h2>
        
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Dirección completa *"
            value={formData.shippingAddress.street}
            onChange={(e) => handleInputChange('street', e.target.value)}
            error={errors['shipping.street']}
            placeholder="Calle, número, piso, puerta..."
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Ciudad *"
              value={formData.shippingAddress.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              error={errors['shipping.city']}
              placeholder="Madrid"
            />
            
            <Input
              label="Código Postal *"
              value={formData.shippingAddress.postal_code}
              onChange={(e) => handleInputChange('postal_code', e.target.value)}
              error={errors['shipping.postal_code']}
              placeholder="28001"
              maxLength={5}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Provincia *"
              value={formData.shippingAddress.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              error={errors['shipping.state']}
              placeholder="Madrid"
            />
            
            <Input
              label="País *"
              value={formData.shippingAddress.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              disabled
            />
          </div>
        </div>
      </div>

      {/* Same as billing checkbox */}
      <div className="flex items-center">
        <input
          id="same-as-billing"
          type="checkbox"
          checked={formData.sameAsBilling}
          onChange={(e) => handleSameAsBillingChange(e.target.checked)}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="same-as-billing" className="ml-2 text-sm text-gray-700">
          La dirección de facturación es la misma que la de envío
        </label>
      </div>

      {/* Billing Address */}
      {!formData.sameAsBilling && (
        <div>
          <h3 className="text-lg font-medium mb-4">Dirección de Facturación</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Dirección completa *"
              value={formData.billingAddress.street}
              onChange={(e) => handleInputChange('street', e.target.value, 'billing')}
              error={errors['billing.street']}
              placeholder="Calle, número, piso, puerta..."
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ciudad *"
                value={formData.billingAddress.city}
                onChange={(e) => handleInputChange('city', e.target.value, 'billing')}
                error={errors['billing.city']}
                placeholder="Madrid"
              />
              
              <Input
                label="Código Postal *"
                value={formData.billingAddress.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value, 'billing')}
                error={errors['billing.postal_code']}
                placeholder="28001"
                maxLength={5}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Provincia *"
                value={formData.billingAddress.state}
                onChange={(e) => handleInputChange('state', e.target.value, 'billing')}
                error={errors['billing.state']}
                placeholder="Madrid"
              />
              
              <Input
                label="País *"
                value={formData.billingAddress.country}
                onChange={(e) => handleInputChange('country', e.target.value, 'billing')}
                disabled
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-6 border-t">
        <Button type="submit" size="lg">
          Continuar al Pago
        </Button>
      </div>
    </form>
  )
}