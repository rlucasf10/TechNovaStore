/**
 * Tests para GetCampaign
 */

import { GetCampaign, CampaignNotFoundError } from './GetCampaign'
import { Campaign } from '../shared/models/Campaign'
import { ICampaignRepository } from '../shared/repositories/CampaignRepository'
import { DiscountRules, FrontendConfig } from '../shared/types'

describe('GetCampaign', () => {
  let getCampaign: GetCampaign
  let mockRepository: jest.Mocked<ICampaignRepository>

  // Datos de prueba
  const mockDiscountRules: DiscountRules = {
    global: {
      type: 'percentage',
      value: 20
    }
  }

  const mockFrontendConfig: FrontendConfig = {
    promoBanner: {
      messages: [{ icon: '🔥', text: 'Oferta especial' }]
    },
    hero: {
      title: 'Campaña de prueba',
      subtitle: 'Grandes descuentos',
      ctaText: 'Ver ofertas'
    },
    dealsSection: {
      title: 'Ofertas',
      subtitle: 'No te las pierdas',
      badge: 'OFERTA'
    }
  }

  const mockCampaign = Campaign.fromDatabase({
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Campaña de Prueba',
    slug: 'campana-prueba',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
    priority: 10,
    isActive: true,
    discountRules: mockDiscountRules,
    frontendConfig: mockFrontendConfig,
    discountsApplied: true,
    appliedAt: new Date('2025-01-01'),
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-01')
  })

  beforeEach(() => {
    // Crear mock del repositorio
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      findPendingActivation: jest.fn(),
      findPendingDeactivation: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }

    getCampaign = new GetCampaign(mockRepository)
  })

  describe('execute', () => {
    it('debe obtener una campaña existente por ID', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(mockCampaign)

      // Act
      const result = await getCampaign.execute({
        campaignId: '123e4567-e89b-12d3-a456-426614174000'
      })

      // Assert
      expect(result.campaign).toBe(mockCampaign)
      expect(mockRepository.findById).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000'
      )
    })

    it('debe lanzar CampaignNotFoundError si la campaña no existe', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        getCampaign.execute({
          campaignId: 'non-existent-id'
        })
      ).rejects.toThrow(CampaignNotFoundError)

      expect(mockRepository.findById).toHaveBeenCalledWith('non-existent-id')
    })

    it('debe retornar campaña con todos sus campos', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(mockCampaign)

      // Act
      const result = await getCampaign.execute({
        campaignId: '123e4567-e89b-12d3-a456-426614174000'
      })

      // Assert
      expect(result.campaign.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(result.campaign.name).toBe('Campaña de Prueba')
      expect(result.campaign.slug).toBe('campana-prueba')
      expect(result.campaign.priority).toBe(10)
      expect(result.campaign.isActive).toBe(true)
      expect(result.campaign.discountRules).toEqual(mockDiscountRules)
      expect(result.campaign.frontendConfig).toEqual(mockFrontendConfig)
    })

    it('debe retornar campaña activa correctamente', async () => {
      // Arrange
      const activeCampaign = Campaign.fromDatabase({
        ...mockCampaign.toJSON(),
        isActive: true,
        discountsApplied: true
      })
      mockRepository.findById.mockResolvedValue(activeCampaign)

      // Act
      const result = await getCampaign.execute({
        campaignId: '123e4567-e89b-12d3-a456-426614174000'
      })

      // Assert
      expect(result.campaign.isActive).toBe(true)
      expect(result.campaign.discountsApplied).toBe(true)
    })

    it('debe retornar campaña inactiva correctamente', async () => {
      // Arrange
      const inactiveCampaign = Campaign.fromDatabase({
        ...mockCampaign.toJSON(),
        isActive: false,
        discountsApplied: false
      })
      mockRepository.findById.mockResolvedValue(inactiveCampaign)

      // Act
      const result = await getCampaign.execute({
        campaignId: '123e4567-e89b-12d3-a456-426614174000'
      })

      // Assert
      expect(result.campaign.isActive).toBe(false)
      expect(result.campaign.discountsApplied).toBe(false)
    })

    it('debe manejar errores del repositorio', async () => {
      // Arrange
      const dbError = new Error('Error de base de datos')
      mockRepository.findById.mockRejectedValue(dbError)

      // Act & Assert
      await expect(
        getCampaign.execute({
          campaignId: '123e4567-e89b-12d3-a456-426614174000'
        })
      ).rejects.toThrow('Error de base de datos')
    })

    it('debe validar que el ID no esté vacío', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        getCampaign.execute({
          campaignId: ''
        })
      ).rejects.toThrow(CampaignNotFoundError)
    })

    it('debe retornar campaña con fechas correctas', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(mockCampaign)

      // Act
      const result = await getCampaign.execute({
        campaignId: '123e4567-e89b-12d3-a456-426614174000'
      })

      // Assert
      expect(result.campaign.startDate).toEqual(new Date('2025-01-01'))
      expect(result.campaign.endDate).toEqual(new Date('2025-01-31'))
      expect(result.campaign.createdAt).toEqual(new Date('2024-12-01'))
      expect(result.campaign.updatedAt).toEqual(new Date('2024-12-01'))
    })

    it('debe retornar campaña con appliedAt si está aplicada', async () => {
      // Arrange
      const appliedCampaign = Campaign.fromDatabase({
        ...mockCampaign.toJSON(),
        discountsApplied: true,
        appliedAt: new Date('2025-01-01T10:00:00Z')
      })
      mockRepository.findById.mockResolvedValue(appliedCampaign)

      // Act
      const result = await getCampaign.execute({
        campaignId: '123e4567-e89b-12d3-a456-426614174000'
      })

      // Assert
      expect(result.campaign.appliedAt).toEqual(new Date('2025-01-01T10:00:00Z'))
    })

    it('debe retornar campaña con deactivatedAt si está desactivada', async () => {
      // Arrange
      const deactivatedCampaign = Campaign.fromDatabase({
        ...mockCampaign.toJSON(),
        isActive: false,
        deactivatedAt: new Date('2025-01-31T23:59:59Z')
      })
      mockRepository.findById.mockResolvedValue(deactivatedCampaign)

      // Act
      const result = await getCampaign.execute({
        campaignId: '123e4567-e89b-12d3-a456-426614174000'
      })

      // Assert
      expect(result.campaign.deactivatedAt).toEqual(new Date('2025-01-31T23:59:59Z'))
    })
  })
})
