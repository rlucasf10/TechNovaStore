/**
 * Tests para ListCampaigns
 */

import { ListCampaigns } from './ListCampaigns'
import { Campaign } from '../shared/models/Campaign'
import { ICampaignRepository } from '../shared/repositories/CampaignRepository'
import { DiscountRules, FrontendConfig, CampaignFilters } from '../shared/types'

describe('ListCampaigns', () => {
  let listCampaigns: ListCampaigns
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

  const createMockCampaign = (overrides: Partial<any> = {}) => {
    return Campaign.fromDatabase({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Campaña de Prueba',
      slug: 'campana-prueba',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      priority: 10,
      isActive: false,
      discountRules: mockDiscountRules,
      frontendConfig: mockFrontendConfig,
      discountsApplied: false,
      createdAt: new Date('2024-12-01'),
      updatedAt: new Date('2024-12-01'),
      ...overrides
    })
  }

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

    listCampaigns = new ListCampaigns(mockRepository)
  })

  describe('execute', () => {
    it('debe listar todas las campañas sin filtros', async () => {
      // Arrange
      const mockCampaigns = [
        createMockCampaign({ id: '1', priority: 100 }),
        createMockCampaign({ id: '2', priority: 50 }),
        createMockCampaign({ id: '3', priority: 10 })
      ]
      mockRepository.findAll.mockResolvedValue(mockCampaigns)

      // Act
      const result = await listCampaigns.execute({})

      // Assert
      expect(result.campaigns).toHaveLength(3)
      expect(result.total).toBe(3)
      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined)
    })

    it('debe retornar lista vacía si no hay campañas', async () => {
      // Arrange
      mockRepository.findAll.mockResolvedValue([])

      // Act
      const result = await listCampaigns.execute({})

      // Assert
      expect(result.campaigns).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('debe filtrar campañas activas', async () => {
      // Arrange
      const activeCampaigns = [
        createMockCampaign({ id: '1', isActive: true }),
        createMockCampaign({ id: '2', isActive: true })
      ]
      mockRepository.findAll.mockResolvedValue(activeCampaigns)

      const filters: CampaignFilters = { isActive: true }

      // Act
      const result = await listCampaigns.execute({ filters })

      // Assert
      expect(result.campaigns).toHaveLength(2)
      expect(result.campaigns.every(c => c.isActive)).toBe(true)
      expect(mockRepository.findAll).toHaveBeenCalledWith(filters)
    })

    it('debe filtrar campañas inactivas', async () => {
      // Arrange
      const inactiveCampaigns = [
        createMockCampaign({ id: '1', isActive: false }),
        createMockCampaign({ id: '2', isActive: false })
      ]
      mockRepository.findAll.mockResolvedValue(inactiveCampaigns)

      const filters: CampaignFilters = { isActive: false }

      // Act
      const result = await listCampaigns.execute({ filters })

      // Assert
      expect(result.campaigns).toHaveLength(2)
      expect(result.campaigns.every(c => !c.isActive)).toBe(true)
      expect(mockRepository.findAll).toHaveBeenCalledWith(filters)
    })

    it('debe retornar campañas ordenadas por prioridad descendente por defecto', async () => {
      // Arrange
      const mockCampaigns = [
        createMockCampaign({ id: '1', priority: 100, name: 'Alta prioridad' }),
        createMockCampaign({ id: '2', priority: 50, name: 'Media prioridad' }),
        createMockCampaign({ id: '3', priority: 10, name: 'Baja prioridad' })
      ]
      mockRepository.findAll.mockResolvedValue(mockCampaigns)

      // Act
      const result = await listCampaigns.execute({})

      // Assert
      expect(result.campaigns[0].priority).toBe(100)
      expect(result.campaigns[1].priority).toBe(50)
      expect(result.campaigns[2].priority).toBe(10)
    })

    it('debe aplicar filtro de fecha de inicio', async () => {
      // Arrange
      const startDate = new Date('2025-01-01')
      const mockCampaigns = [
        createMockCampaign({ id: '1', startDate: new Date('2025-01-15') })
      ]
      mockRepository.findAll.mockResolvedValue(mockCampaigns)

      const filters: CampaignFilters = { startDateFrom: startDate }

      // Act
      const result = await listCampaigns.execute({ filters })

      // Assert
      expect(result.campaigns).toHaveLength(1)
      expect(mockRepository.findAll).toHaveBeenCalledWith(filters)
    })

    it('debe aplicar filtro de fecha de fin', async () => {
      // Arrange
      const endDate = new Date('2025-12-31')
      const mockCampaigns = [
        createMockCampaign({ id: '1', endDate: new Date('2025-06-30') })
      ]
      mockRepository.findAll.mockResolvedValue(mockCampaigns)

      const filters: CampaignFilters = { endDateTo: endDate }

      // Act
      const result = await listCampaigns.execute({ filters })

      // Assert
      expect(result.campaigns).toHaveLength(1)
      expect(mockRepository.findAll).toHaveBeenCalledWith(filters)
    })

    it('debe aplicar filtro de prioridad mínima', async () => {
      // Arrange
      const mockCampaigns = [
        createMockCampaign({ id: '1', priority: 100 }),
        createMockCampaign({ id: '2', priority: 50 })
      ]
      mockRepository.findAll.mockResolvedValue(mockCampaigns)

      const filters: CampaignFilters = { minPriority: 50 }

      // Act
      const result = await listCampaigns.execute({ filters })

      // Assert
      expect(result.campaigns).toHaveLength(2)
      expect(result.campaigns.every(c => c.priority >= 50)).toBe(true)
      expect(mockRepository.findAll).toHaveBeenCalledWith(filters)
    })

    it('debe aplicar paginación con limit', async () => {
      // Arrange
      const mockCampaigns = [
        createMockCampaign({ id: '1' }),
        createMockCampaign({ id: '2' })
      ]
      mockRepository.findAll.mockResolvedValue(mockCampaigns)

      const filters: CampaignFilters = { limit: 2 }

      // Act
      const result = await listCampaigns.execute({ filters })

      // Assert
      expect(result.campaigns).toHaveLength(2)
      expect(mockRepository.findAll).toHaveBeenCalledWith(filters)
    })

    it('debe aplicar paginación con offset', async () => {
      // Arrange
      const mockCampaigns = [
        createMockCampaign({ id: '3' }),
        createMockCampaign({ id: '4' })
      ]
      mockRepository.findAll.mockResolvedValue(mockCampaigns)

      const filters: CampaignFilters = { limit: 2, offset: 2 }

      // Act
      const result = await listCampaigns.execute({ filters })

      // Assert
      expect(result.campaigns).toHaveLength(2)
      expect(mockRepository.findAll).toHaveBeenCalledWith(filters)
    })

    it('debe aplicar múltiples filtros simultáneamente', async () => {
      // Arrange
      const mockCampaigns = [
        createMockCampaign({ id: '1', isActive: true, priority: 100 })
      ]
      mockRepository.findAll.mockResolvedValue(mockCampaigns)

      const filters: CampaignFilters = {
        isActive: true,
        minPriority: 50,
        limit: 10
      }

      // Act
      const result = await listCampaigns.execute({ filters })

      // Assert
      expect(result.campaigns).toHaveLength(1)
      expect(mockRepository.findAll).toHaveBeenCalledWith(filters)
    })

    it('debe manejar errores del repositorio', async () => {
      // Arrange
      const dbError = new Error('Error de base de datos')
      mockRepository.findAll.mockRejectedValue(dbError)

      // Act & Assert
      await expect(listCampaigns.execute({})).rejects.toThrow('Error de base de datos')
    })

    it('debe permitir ordenamiento personalizado', async () => {
      // Arrange
      const mockCampaigns = [
        createMockCampaign({ id: '1', createdAt: new Date('2024-12-01') }),
        createMockCampaign({ id: '2', createdAt: new Date('2024-11-01') })
      ]
      mockRepository.findAll.mockResolvedValue(mockCampaigns)

      const filters: CampaignFilters = {
        orderBy: 'createdAt',
        orderDirection: 'DESC'
      }

      // Act
      const result = await listCampaigns.execute({ filters })

      // Assert
      expect(result.campaigns).toHaveLength(2)
      expect(mockRepository.findAll).toHaveBeenCalledWith(filters)
    })

    it('debe retornar todas las propiedades de las campañas', async () => {
      // Arrange
      const mockCampaigns = [
        createMockCampaign({
          id: '1',
          name: 'Black Friday',
          slug: 'black-friday',
          priority: 100,
          isActive: true,
          discountsApplied: true
        })
      ]
      mockRepository.findAll.mockResolvedValue(mockCampaigns)

      // Act
      const result = await listCampaigns.execute({})

      // Assert
      const campaign = result.campaigns[0]
      expect(campaign.id).toBe('1')
      expect(campaign.name).toBe('Black Friday')
      expect(campaign.slug).toBe('black-friday')
      expect(campaign.priority).toBe(100)
      expect(campaign.isActive).toBe(true)
      expect(campaign.discountsApplied).toBe(true)
      expect(campaign.discountRules).toBeDefined()
      expect(campaign.frontendConfig).toBeDefined()
    })
  })
})
