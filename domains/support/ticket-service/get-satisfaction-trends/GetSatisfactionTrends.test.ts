/**
 * Tests para GetSatisfactionTrends
 * Cobertura: Obtención de tendencias de satisfacción
 */

import { GetSatisfactionTrends } from './GetSatisfactionTrends';

describe('GetSatisfactionTrends', () => {
  let getSatisfactionTrends: GetSatisfactionTrends;

  beforeEach(() => {
    getSatisfactionTrends = new GetSatisfactionTrends();
  });

  it('debe obtener tendencias con periodo semanal por defecto', async () => {
    // Act
    const result = await getSatisfactionTrends.execute();

    // Assert
    expect(Array.isArray(result)).toBe(true);
  });

  it('debe obtener tendencias con periodo diario', async () => {
    // Act
    const result = await getSatisfactionTrends.execute('daily');

    // Assert
    expect(Array.isArray(result)).toBe(true);
  });

  it('debe obtener tendencias con periodo semanal', async () => {
    // Act
    const result = await getSatisfactionTrends.execute('weekly');

    // Assert
    expect(Array.isArray(result)).toBe(true);
  });

  it('debe obtener tendencias con periodo mensual', async () => {
    // Act
    const result = await getSatisfactionTrends.execute('monthly');

    // Assert
    expect(Array.isArray(result)).toBe(true);
  });

  it('debe obtener tendencias con rango de fechas', async () => {
    // Arrange
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    // Act
    const result = await getSatisfactionTrends.execute('weekly', startDate, endDate);

    // Assert
    expect(Array.isArray(result)).toBe(true);
  });

  it('debe obtener tendencias con solo fecha de inicio', async () => {
    // Arrange
    const startDate = new Date('2024-01-01');

    // Act
    const result = await getSatisfactionTrends.execute('weekly', startDate);

    // Assert
    expect(Array.isArray(result)).toBe(true);
  });

  it('debe obtener tendencias con solo fecha de fin', async () => {
    // Arrange
    const endDate = new Date('2024-12-31');

    // Act
    const result = await getSatisfactionTrends.execute('weekly', undefined, endDate);

    // Assert
    expect(Array.isArray(result)).toBe(true);
  });

  it('debe retornar array vacío como placeholder', async () => {
    // Act
    const result = await getSatisfactionTrends.execute();

    // Assert
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('debe manejar todos los periodos válidos', async () => {
    // Arrange
    const periods: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];

    // Act & Assert
    for (const period of periods) {
      const result = await getSatisfactionTrends.execute(period);
      expect(Array.isArray(result)).toBe(true);
    }
  });

  it('debe manejar fechas en diferentes formatos', async () => {
    // Arrange
    const startDate = new Date('2024-06-15T10:30:00Z');
    const endDate = new Date('2024-06-30T23:59:59Z');

    // Act
    const result = await getSatisfactionTrends.execute('daily', startDate, endDate);

    // Assert
    expect(Array.isArray(result)).toBe(true);
  });
});
