/**
 * Servicio para gestión de direcciones de usuario
 * Por ahora usa localStorage, pero está preparado para integración con backend
 */

import { UserAddress, AddressFormData } from '../types/address.types'

const STORAGE_KEY = 'user_addresses'

class AddressService {
  /**
   * Obtener todas las direcciones del usuario
   */
  async getAddresses(userId: string): Promise<UserAddress[]> {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
      if (!stored) return []
      
      const addresses = JSON.parse(stored) as UserAddress[]
      // Convertir strings de fecha a objetos Date
      return addresses.map(addr => ({
        ...addr,
        createdAt: new Date(addr.createdAt),
        updatedAt: new Date(addr.updatedAt)
      }))
    } catch (error) {
      console.error('Error al obtener direcciones:', error)
      return []
    }
  }

  /**
   * Obtener una dirección por ID
   */
  async getAddress(userId: string, addressId: string): Promise<UserAddress | null> {
    const addresses = await this.getAddresses(userId)
    return addresses.find(addr => addr.id === addressId) || null
  }

  /**
   * Obtener la dirección predeterminada
   */
  async getDefaultAddress(userId: string): Promise<UserAddress | null> {
    const addresses = await this.getAddresses(userId)
    return addresses.find(addr => addr.isDefault) || null
  }

  /**
   * Crear una nueva dirección
   */
  async createAddress(userId: string, data: AddressFormData): Promise<UserAddress> {
    const addresses = await this.getAddresses(userId)
    
    // Si es la primera dirección o se marca como predeterminada, actualizar otras
    if (data.isDefault || addresses.length === 0) {
      addresses.forEach(addr => {
        addr.isDefault = false
      })
    }

    const newAddress: UserAddress = {
      id: this.generateId(),
      userId,
      ...data,
      isDefault: data.isDefault || addresses.length === 0, // Primera dirección es predeterminada
      createdAt: new Date(),
      updatedAt: new Date()
    }

    addresses.push(newAddress)
    this.saveAddresses(userId, addresses)
    
    return newAddress
  }

  /**
   * Actualizar una dirección existente
   */
  async updateAddress(
    userId: string,
    addressId: string,
    data: Partial<AddressFormData>
  ): Promise<UserAddress> {
    const addresses = await this.getAddresses(userId)
    const index = addresses.findIndex(addr => addr.id === addressId)
    
    if (index === -1) {
      throw new Error('Dirección no encontrada')
    }

    // Si se marca como predeterminada, desmarcar las demás
    if (data.isDefault) {
      addresses.forEach(addr => {
        addr.isDefault = false
      })
    }

    const updatedAddress: UserAddress = {
      ...addresses[index],
      ...data,
      updatedAt: new Date()
    }

    addresses[index] = updatedAddress
    this.saveAddresses(userId, addresses)
    
    return updatedAddress
  }

  /**
   * Eliminar una dirección
   */
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const addresses = await this.getAddresses(userId)
    const filtered = addresses.filter(addr => addr.id !== addressId)
    
    // Si se eliminó la dirección predeterminada y quedan otras, marcar la primera como predeterminada
    const deletedAddress = addresses.find(addr => addr.id === addressId)
    if (deletedAddress?.isDefault && filtered.length > 0) {
      filtered[0].isDefault = true
    }
    
    this.saveAddresses(userId, filtered)
  }

  /**
   * Marcar una dirección como predeterminada
   */
  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    const addresses = await this.getAddresses(userId)
    
    addresses.forEach(addr => {
      addr.isDefault = addr.id === addressId
      if (addr.id === addressId) {
        addr.updatedAt = new Date()
      }
    })
    
    this.saveAddresses(userId, addresses)
  }

  /**
   * Guardar direcciones en localStorage
   */
  private saveAddresses(userId: string, addresses: UserAddress[]): void {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(addresses))
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const addressService = new AddressService()
