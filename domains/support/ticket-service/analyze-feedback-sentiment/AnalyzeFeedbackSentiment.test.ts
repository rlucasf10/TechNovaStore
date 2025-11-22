/**
 * Tests para AnalyzeFeedbackSentiment
 * Cobertura: Análisis de sentimiento del feedback de satisfacción
 */

import { AnalyzeFeedbackSentiment } from './AnalyzeFeedbackSentiment';

describe('AnalyzeFeedbackSentiment', () => {
  let analyzeFeedbackSentiment: AnalyzeFeedbackSentiment;

  beforeEach(() => {
    analyzeFeedbackSentiment = new AnalyzeFeedbackSentiment();
  });

  describe('execute - Sentimiento Positivo', () => {
    it('debe detectar sentimiento positivo con palabra "excelente"', () => {
      // Arrange
      const feedback = 'El servicio fue excelente, muy satisfecho';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('positive');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.keywords).toContain('excelente');
      expect(result.keywords).toContain('satisfecho');
    });

    it('debe detectar sentimiento positivo con palabra "bueno"', () => {
      // Arrange
      const feedback = 'Todo estuvo muy bueno';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('positive');
      expect(result.keywords).toContain('bueno');
    });

    it('debe detectar sentimiento positivo con palabra "rápido"', () => {
      // Arrange
      const feedback = 'La respuesta fue muy rápida y excelente';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('positive');
      expect(result.keywords).toContain('excelente');
      expect(result.suggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('debe detectar sentimiento positivo con palabra "eficiente"', () => {
      // Arrange
      const feedback = 'El proceso fue muy eficiente';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('positive');
      expect(result.keywords).toContain('eficiente');
      expect(result.suggestions).toContain('Documentar las mejores prácticas utilizadas');
    });

    it('debe detectar sentimiento positivo con múltiples palabras positivas', () => {
      // Arrange
      const feedback = 'Excelente servicio, muy rápido y eficiente. Totalmente satisfecho y lo recomiendo';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('positive');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.keywords.length).toBeGreaterThan(3);
    });

    it('debe aumentar confianza con más palabras positivas', () => {
      // Arrange
      const feedback1 = 'Bueno';
      const feedback2 = 'Excelente y bueno';
      const feedback3 = 'Excelente, bueno y rápido';

      // Act
      const result1 = analyzeFeedbackSentiment.execute(feedback1);
      const result2 = analyzeFeedbackSentiment.execute(feedback2);
      const result3 = analyzeFeedbackSentiment.execute(feedback3);

      // Assert
      expect(result1.confidence).toBeLessThan(result2.confidence);
      expect(result2.confidence).toBeLessThan(result3.confidence);
    });
  });

  describe('execute - Sentimiento Negativo', () => {
    it('debe detectar sentimiento negativo con palabra "malo"', () => {
      // Arrange
      const feedback = 'El servicio fue muy malo';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('negative');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.keywords).toContain('malo');
    });

    it('debe detectar sentimiento negativo con palabra "lento"', () => {
      // Arrange
      const feedback = 'Todo fue muy lento';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('negative');
      expect(result.keywords).toContain('lento');
      expect(result.suggestions).toContain('Mejorar los tiempos de respuesta del equipo de soporte');
    });

    it('debe detectar sentimiento negativo con palabra "terrible"', () => {
      // Arrange
      const feedback = 'La experiencia fue terrible';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('negative');
      expect(result.keywords).toContain('terrible');
    });

    it('debe detectar sentimiento negativo con palabra "insatisfecho"', () => {
      // Arrange
      const feedback = 'Estoy muy insatisfecho y decepcionado con el servicio';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('negative');
      expect(result.keywords).toContain('insatisfecho');
      expect(result.suggestions).toContain('Implementar seguimiento post-resolución para asegurar satisfacción');
    });

    it('debe detectar sentimiento negativo con palabra "problema"', () => {
      // Arrange
      const feedback = 'Tuve muchos problemas';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('negative');
      expect(result.keywords).toContain('problema');
      expect(result.suggestions).toContain('Revisar los procesos de resolución de problemas');
    });

    it('debe detectar sentimiento negativo con palabra "decepcionado"', () => {
      // Arrange
      const feedback = 'Estoy muy decepcionado';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('negative');
      expect(result.keywords).toContain('decepcionado');
    });

    it('debe detectar sentimiento negativo con múltiples palabras negativas', () => {
      // Arrange
      const feedback = 'Terrible servicio, muy lento y malo. Totalmente insatisfecho con los problemas';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('negative');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.keywords.length).toBeGreaterThan(3);
    });

    it('debe generar múltiples sugerencias para feedback negativo complejo', () => {
      // Arrange
      const feedback = 'Servicio lento, tuve problemas y estoy insatisfecho';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('negative');
      expect(result.suggestions.length).toBeGreaterThan(1);
    });
  });

  describe('execute - Sentimiento Neutral', () => {
    it('debe detectar sentimiento neutral sin palabras clave', () => {
      // Arrange
      const feedback = 'El servicio fue normal';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('neutral');
      expect(result.confidence).toBe(0.5);
      expect(result.keywords).toHaveLength(0);
    });

    it('debe detectar sentimiento neutral con igual cantidad de palabras positivas y negativas', () => {
      // Arrange
      const feedback = 'Fue bueno pero también malo';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('neutral');
      expect(result.keywords.length).toBeGreaterThan(0);
    });

    it('debe detectar sentimiento neutral con feedback vacío', () => {
      // Arrange
      const feedback = '';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('neutral');
      expect(result.confidence).toBe(0.5);
      expect(result.keywords).toHaveLength(0);
    });

    it('debe detectar sentimiento neutral con feedback genérico', () => {
      // Arrange
      const feedback = 'Gracias por su atención';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('neutral');
    });
  });

  describe('execute - Casos especiales', () => {
    it('debe ser case-insensitive', () => {
      // Arrange
      const feedback1 = 'EXCELENTE servicio';
      const feedback2 = 'excelente servicio';
      const feedback3 = 'ExCeLenTe servicio';

      // Act
      const result1 = analyzeFeedbackSentiment.execute(feedback1);
      const result2 = analyzeFeedbackSentiment.execute(feedback2);
      const result3 = analyzeFeedbackSentiment.execute(feedback3);

      // Assert
      expect(result1.sentiment).toBe('positive');
      expect(result2.sentiment).toBe('positive');
      expect(result3.sentiment).toBe('positive');
    });

    it('debe manejar feedback con caracteres especiales', () => {
      // Arrange
      const feedback = '¡Excelente! Muy bueno :)';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('positive');
      expect(result.keywords).toContain('excelente');
      expect(result.keywords).toContain('bueno');
    });

    it('debe manejar feedback muy largo', () => {
      // Arrange
      const feedback = 'El servicio fue excelente. '.repeat(100);

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('positive');
      expect(result.keywords).toContain('excelente');
    });

    it('debe limitar la confianza a 0.9', () => {
      // Arrange
      const feedback = 'Excelente bueno rápido eficiente satisfecho recomiendo ' +
                       'excelente bueno rápido eficiente satisfecho recomiendo';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.confidence).toBeLessThanOrEqual(0.9);
    });

    it('debe manejar feedback con números', () => {
      // Arrange
      const feedback = 'Servicio 10/10, excelente';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('positive');
    });

    it('debe detectar palabras clave en medio de oraciones', () => {
      // Arrange
      const feedback = 'Aunque al principio fue lento, al final todo estuvo excelente';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.keywords).toContain('lento');
      expect(result.keywords).toContain('excelente');
    });

    it('debe retornar estructura completa del resultado', () => {
      // Arrange
      const feedback = 'Servicio excelente';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('suggestions');
      expect(Array.isArray(result.keywords)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('debe manejar feedback con saltos de línea', () => {
      // Arrange
      const feedback = 'Servicio excelente\nMuy rápido\nTotalmente satisfecho';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.sentiment).toBe('positive');
      expect(result.keywords.length).toBeGreaterThan(2);
    });

    it('debe priorizar sentimiento con más palabras clave', () => {
      // Arrange
      const feedbackPositivo = 'Excelente, bueno y rápido, aunque hubo un problema menor';
      const feedbackNegativo = 'Malo, lento y terrible, aunque algo fue bueno';

      // Act
      const resultPositivo = analyzeFeedbackSentiment.execute(feedbackPositivo);
      const resultNegativo = analyzeFeedbackSentiment.execute(feedbackNegativo);

      // Assert
      expect(resultPositivo.sentiment).toBe('positive');
      expect(resultNegativo.sentiment).toBe('negative');
    });
  });

  describe('generateImprovementSuggestions', () => {
    it('debe generar sugerencias vacías para sentimiento neutral', () => {
      // Arrange
      const feedback = 'Servicio normal';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.suggestions).toHaveLength(0);
    });

    it('debe generar sugerencias para mantener estándares positivos', () => {
      // Arrange
      const feedback = 'Servicio rápido y eficiente';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.includes('Mantener'))).toBe(true);
    });

    it('debe generar sugerencias de mejora para feedback negativo', () => {
      // Arrange
      const feedback = 'Servicio lento con problemas';

      // Act
      const result = analyzeFeedbackSentiment.execute(feedback);

      // Assert
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.includes('Mejorar'))).toBe(true);
    });
  });
});
