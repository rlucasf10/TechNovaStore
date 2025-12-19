/**
 * Tipos para gestión de direcciones de usuario
 */

export interface UserAddress {
  id: string
  userId: string
  label: string // 'Casa', 'Trabajo', 'Otro'
  firstName: string
  lastName: string
  phone: string
  street: string
  streetNumber: string
  apartment?: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AddressFormData {
  label: string
  firstName: string
  lastName: string
  phone: string
  street: string
  streetNumber: string
  apartment?: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

export type AddressLabel = 'Casa' | 'Trabajo' | 'Otro'
