/**
 * Tests para GetPricingAlerts
 */

import { GetPricingAlerts, PricingAlert } from './GetPricingAlerts';
import { PriceComparator } from '../shared/pricing/PriceComparator';
import { PricingAlertType } from '../shared/types/pricing';

describe('GetPricingAlerts', () => {
  let getPricingAlerts: GetPricingAlerts;
  let mockPriceComparator: jest.Mocked<PriceComparator>;

  beforeEach(() => {
    mockPriceComparator = {
      getAlerts: jest.fn(),
    } as any;

    getPricingAlerts = new GetPricingAlerts(mockPriceComparator);
  });

  describe('execute', () => {
    const mockAlerts: PricingAlert[] = [
      {
        id: 'alert-1',
        sku: 'TEST-001',
        type: PricingAlertType.PRICE_DROP,
        message: 'Competitor price dropped by 20%',
        severity: 'high',
        created_at: new Date(),
        resolved: false,
      },
      {
        id: 'alert-2',
        sku: 'TEST-002',
        type: PricingAlertType.COMPETITOR_UNDERCUT,
        message: 'Price is 15% above market average',
        severity: 'medium',
        created_at: new Date(),
        resolved: false,
      },
    ];

    it('debe obtener alertas correctamente', () => {
      mockPriceComparator.getAlerts.mockReturnValue(mockAlerts);

      const result = getPricingAlerts.execute();

      expect(result).toEqual(mockAlerts);
      expect(result).toHaveLength(2);
      expect(mockPriceComparator.getAlerts).toHaveBeenCalled();
    });

    it('debe manejar lista vacía de alertas', () => {
      mockPriceComparator.getAlerts.mockReturnValue([]);

      const result = getPricingAlerts.execute();

      expect(result).toHaveLength(0);
    });

    it('debe manejar alertas de tipo PRICE_DROP', () => {
      const priceDropAlerts: PricingAlert[] = [
        {
          id: 'alert-1',
          sku: 'TEST-001',
          type: PricingAlertType.PRICE_DROP,
          message: 'Price dropped',
          severity: 'high',
          created_at: new Date(),
          resolved: false,
        },
      ];

      mockPriceComparator.getAlerts.mockReturnValue(priceDropAlerts);

      const result = getPricingAlerts.execute();

      expect(result[0].type).toBe(PricingAlertType.PRICE_DROP);
    });

    it('debe manejar alertas de tipo PRICE_SPIKE', () => {
      const priceSpikeAlerts: PricingAlert[] = [
        {
          id: 'alert-1',
          sku: 'TEST-001',
          type: PricingAlertType.PRICE_SPIKE,
          message: 'Price spiked',
          severity: 'high',
          created_at: new Date(),
          resolved: false,
        },
      ];

      mockPriceComparator.getAlerts.mockReturnValue(priceSpikeAlerts);

      const result = getPricingAlerts.execute();

      expect(result[0].type).toBe(PricingAlertType.PRICE_SPIKE);
    });

    it('debe manejar alertas de tipo COMPETITOR_UNDERCUT', () => {
      const competitorAlerts: PricingAlert[] = [
        {
          id: 'alert-1',
          sku: 'TEST-001',
          type: PricingAlertType.COMPETITOR_UNDERCUT,
          message: 'Competitor undercut detected',
          severity: 'high',
          created_at: new Date(),
          resolved: false,
        },
      ];

      mockPriceComparator.getAlerts.mockReturnValue(competitorAlerts);

      const result = getPricingAlerts.execute();

      expect(result[0].type).toBe(PricingAlertType.COMPETITOR_UNDERCUT);
    });

    it('debe manejar alertas con severidad alta', () => {
      const highSeverityAlerts: PricingAlert[] = [
        {
          id: 'alert-1',
          sku: 'TEST-001',
          type: PricingAlertType.PRICE_DROP,
          message: 'Critical price change',
          severity: 'high',
          created_at: new Date(),
          resolved: false,
        },
      ];

      mockPriceComparator.getAlerts.mockReturnValue(highSeverityAlerts);

      const result = getPricingAlerts.execute();

      expect(result[0].severity).toBe('high');
    });

    it('debe manejar alertas con severidad media', () => {
      const mediumSeverityAlerts: PricingAlert[] = [
        {
          id: 'alert-1',
          sku: 'TEST-001',
          type: PricingAlertType.MARGIN_TOO_LOW,
          message: 'Moderate issue',
          severity: 'medium',
          created_at: new Date(),
          resolved: false,
        },
      ];

      mockPriceComparator.getAlerts.mockReturnValue(mediumSeverityAlerts);

      const result = getPricingAlerts.execute();

      expect(result[0].severity).toBe('medium');
    });

    it('debe manejar alertas con severidad baja', () => {
      const lowSeverityAlerts: PricingAlert[] = [
        {
          id: 'alert-1',
          sku: 'TEST-001',
          type: PricingAlertType.OUT_OF_STOCK,
          message: 'Minor issue',
          severity: 'low',
          created_at: new Date(),
          resolved: false,
        },
      ];

      mockPriceComparator.getAlerts.mockReturnValue(lowSeverityAlerts);

      const result = getPricingAlerts.execute();

      expect(result[0].severity).toBe('low');
    });

    it('debe llamar al comparator exactamente una vez', () => {
      mockPriceComparator.getAlerts.mockReturnValue(mockAlerts);

      getPricingAlerts.execute();

      expect(mockPriceComparator.getAlerts).toHaveBeenCalledTimes(1);
    });

    it('debe manejar múltiples alertas del mismo producto', () => {
      const multipleAlerts: PricingAlert[] = [
        {
          id: 'alert-1',
          sku: 'TEST-001',
          type: PricingAlertType.PRICE_DROP,
          message: 'Alert 1',
          severity: 'high',
          created_at: new Date(),
          resolved: false,
        },
        {
          id: 'alert-2',
          sku: 'TEST-001',
          type: PricingAlertType.COMPETITOR_UNDERCUT,
          message: 'Alert 2',
          severity: 'medium',
          created_at: new Date(),
          resolved: false,
        },
      ];

      mockPriceComparator.getAlerts.mockReturnValue(multipleAlerts);

      const result = getPricingAlerts.execute();

      expect(result).toHaveLength(2);
      expect(result[0].sku).toBe(result[1].sku);
    });

    it('debe ejecutarse múltiples veces sin errores', () => {
      mockPriceComparator.getAlerts.mockReturnValue(mockAlerts);

      expect(() => getPricingAlerts.execute()).not.toThrow();
      expect(() => getPricingAlerts.execute()).not.toThrow();
      expect(() => getPricingAlerts.execute()).not.toThrow();
    });

    it('debe manejar alertas resueltas', () => {
      const resolvedAlerts: PricingAlert[] = [
        {
          id: 'alert-1',
          sku: 'TEST-001',
          type: PricingAlertType.PRICE_DROP,
          message: 'Resolved alert',
          severity: 'low',
          created_at: new Date(),
          resolved: true,
        },
      ];

      mockPriceComparator.getAlerts.mockReturnValue(resolvedAlerts);

      const result = getPricingAlerts.execute();

      expect(result[0].resolved).toBe(true);
    });

    it('debe manejar alertas no resueltas', () => {
      const unresolvedAlerts: PricingAlert[] = [
        {
          id: 'alert-1',
          sku: 'TEST-001',
          type: PricingAlertType.PRICING_ERROR,
          message: 'Unresolved alert',
          severity: 'critical',
          created_at: new Date(),
          resolved: false,
        },
      ];

      mockPriceComparator.getAlerts.mockReturnValue(unresolvedAlerts);

      const result = getPricingAlerts.execute();

      expect(result[0].resolved).toBe(false);
    });
  });
});
