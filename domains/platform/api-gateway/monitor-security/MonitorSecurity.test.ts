/**
 * Tests exhaustivos para MonitorSecurity
 * Caso de uso CRÍTICO para monitoreo y detección de amenazas
 */

import { Request } from 'express';
import { MonitorSecurity } from './MonitorSecurity';

// Mock logger
jest.mock('../shared/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('MonitorSecurity - Tests Exhaustivos', () => {
  let monitorSecurity: MonitorSecurity;
  let mockReq: any;

  beforeEach(() => {
    monitorSecurity = new MonitorSecurity();
    mockReq = {
      ip: '192.168.1.1',
      url: '/test',
      method: 'GET',
      get: jest.fn((header: string) => {
        if (header === 'User-Agent') return 'Test Agent';
        return undefined;
      }),
    };
    jest.clearAllMocks();
  });

  describe('logSecurityEvent() - Registro de Eventos', () => {
    test('debe registrar evento de seguridad', () => {
      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'SUSPICIOUS_REQUEST',
        'MEDIUM'
      );

      const stats = monitorSecurity.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.suspiciousRequests).toBe(1);
    });

    test('debe registrar evento con detalles', () => {
      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'XSS_ATTEMPT',
        'HIGH',
        { payload: '<script>alert(1)</script>' }
      );

      const stats = monitorSecurity.getStats();
      expect(stats.xssAttempts).toBe(1);
    });

    test('debe rastrear IP del atacante', () => {
      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'SQL_INJECTION_ATTEMPT',
        'HIGH'
      );

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(1);
      expect(suspiciousIPs.length).toBeGreaterThan(0);
      expect(suspiciousIPs[0].ip).toBe('192.168.1.1');
    });

    test('debe manejar IP undefined', () => {
      mockReq.ip = undefined;

      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'BLOCKED_REQUEST',
        'LOW'
      );

      const stats = monitorSecurity.getStats();
      expect(stats.blockedRequests).toBe(1);
    });

    test('debe manejar User-Agent undefined', () => {
      mockReq.get = jest.fn(() => undefined);

      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'AUTH_FAILURE',
        'MEDIUM'
      );

      const stats = monitorSecurity.getStats();
      expect(stats.authFailures).toBe(1);
    });
  });

  describe('Tipos de Eventos de Seguridad', () => {
    test('debe registrar BLOCKED_REQUEST', () => {
      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'BLOCKED_REQUEST',
        'LOW'
      );

      const stats = monitorSecurity.getStats();
      expect(stats.blockedRequests).toBe(1);
    });

    test('debe registrar SUSPICIOUS_REQUEST', () => {
      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'SUSPICIOUS_REQUEST',
        'MEDIUM'
      );

      const stats = monitorSecurity.getStats();
      expect(stats.suspiciousRequests).toBe(1);
    });

    test('debe registrar RATE_LIMIT_EXCEEDED', () => {
      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'RATE_LIMIT_EXCEEDED',
        'MEDIUM'
      );

      const stats = monitorSecurity.getStats();
      expect(stats.rateLimitExceeded).toBe(1);
    });

    test('debe registrar CSRF_VIOLATION', () => {
      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'CSRF_VIOLATION',
        'HIGH'
      );

      const stats = monitorSecurity.getStats();
      expect(stats.csrfViolations).toBe(1);
    });

    test('debe registrar XSS_ATTEMPT', () => {
      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'XSS_ATTEMPT',
        'HIGH'
      );

      const stats = monitorSecurity.getStats();
      expect(stats.xssAttempts).toBe(1);
    });

    test('debe registrar SQL_INJECTION_ATTEMPT', () => {
      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'SQL_INJECTION_ATTEMPT',
        'HIGH'
      );

      const stats = monitorSecurity.getStats();
      expect(stats.sqlInjectionAttempts).toBe(1);
    });

    test('debe registrar AUTH_FAILURE', () => {
      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'AUTH_FAILURE',
        'MEDIUM'
      );

      const stats = monitorSecurity.getStats();
      expect(stats.authFailures).toBe(1);
    });

    test('debe registrar múltiples tipos de eventos', () => {
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH');
      monitorSecurity.logSecurityEvent(mockReq as Request, 'SQL_INJECTION_ATTEMPT', 'HIGH');
      monitorSecurity.logSecurityEvent(mockReq as Request, 'CSRF_VIOLATION', 'HIGH');

      const stats = monitorSecurity.getStats();
      expect(stats.xssAttempts).toBe(1);
      expect(stats.sqlInjectionAttempts).toBe(1);
      expect(stats.csrfViolations).toBe(1);
      expect(stats.totalRequests).toBe(3);
    });
  });

  describe('Niveles de Severidad', () => {
    test('debe manejar severidad LOW', () => {
      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'BLOCKED_REQUEST',
        'LOW'
      );

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);
      expect(suspiciousIPs[0].suspicionScore).toBe(1);
    });

    test('debe manejar severidad MEDIUM', () => {
      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'SUSPICIOUS_REQUEST',
        'MEDIUM'
      );

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);
      expect(suspiciousIPs[0].suspicionScore).toBe(5);
    });

    test('debe manejar severidad HIGH', () => {
      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'XSS_ATTEMPT',
        'HIGH'
      );

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);
      expect(suspiciousIPs[0].suspicionScore).toBe(10);
    });

    test('debe manejar severidad CRITICAL', () => {
      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'SQL_INJECTION_ATTEMPT',
        'CRITICAL'
      );

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);
      expect(suspiciousIPs[0].suspicionScore).toBe(25);
    });

    test('debe acumular scores de múltiples eventos', () => {
      monitorSecurity.logSecurityEvent(mockReq as Request, 'BLOCKED_REQUEST', 'LOW'); // +1
      monitorSecurity.logSecurityEvent(mockReq as Request, 'SUSPICIOUS_REQUEST', 'MEDIUM'); // +5
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH'); // +10

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);
      expect(suspiciousIPs[0].suspicionScore).toBe(16);
    });
  });

  describe('getStats() - Estadísticas de Seguridad', () => {
    test('debe retornar estadísticas iniciales en cero', () => {
      const stats = monitorSecurity.getStats();

      expect(stats.totalRequests).toBe(0);
      expect(stats.blockedRequests).toBe(0);
      expect(stats.suspiciousRequests).toBe(0);
      expect(stats.rateLimitExceeded).toBe(0);
      expect(stats.csrfViolations).toBe(0);
      expect(stats.xssAttempts).toBe(0);
      expect(stats.sqlInjectionAttempts).toBe(0);
      expect(stats.authFailures).toBe(0);
    });

    test('debe actualizar totalRequests con cada evento', () => {
      monitorSecurity.logSecurityEvent(mockReq as Request, 'BLOCKED_REQUEST', 'LOW');
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH');
      monitorSecurity.logSecurityEvent(mockReq as Request, 'AUTH_FAILURE', 'MEDIUM');

      const stats = monitorSecurity.getStats();
      expect(stats.totalRequests).toBe(3);
    });

    test('debe retornar copia de estadísticas', () => {
      const stats1 = monitorSecurity.getStats();
      stats1.totalRequests = 999;

      const stats2 = monitorSecurity.getStats();
      expect(stats2.totalRequests).toBe(0);
    });

    test('debe mantener estadísticas precisas', () => {
      // Simular actividad variada
      for (let i = 0; i < 10; i++) {
        monitorSecurity.logSecurityEvent(mockReq as Request, 'BLOCKED_REQUEST', 'LOW');
      }
      for (let i = 0; i < 5; i++) {
        monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH');
      }
      for (let i = 0; i < 3; i++) {
        monitorSecurity.logSecurityEvent(mockReq as Request, 'SQL_INJECTION_ATTEMPT', 'HIGH');
      }

      const stats = monitorSecurity.getStats();
      expect(stats.totalRequests).toBe(18);
      expect(stats.blockedRequests).toBe(10);
      expect(stats.xssAttempts).toBe(5);
      expect(stats.sqlInjectionAttempts).toBe(3);
    });
  });

  describe('getSuspiciousIPs() - IPs Sospechosas', () => {
    test('debe retornar array vacío inicialmente', () => {
      const suspiciousIPs = monitorSecurity.getSuspiciousIPs();

      expect(suspiciousIPs).toEqual([]);
    });

    test('debe retornar IPs con score mínimo', () => {
      monitorSecurity.logSecurityEvent(mockReq as Request, 'BLOCKED_REQUEST', 'LOW'); // score 1

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(10);
      expect(suspiciousIPs).toHaveLength(0);

      const allIPs = monitorSecurity.getSuspiciousIPs(0);
      expect(allIPs).toHaveLength(1);
    });

    test('debe ordenar IPs por score descendente', () => {
      mockReq.ip = '192.168.1.1';
      monitorSecurity.logSecurityEvent(mockReq as Request, 'BLOCKED_REQUEST', 'LOW'); // score 1

      mockReq.ip = '192.168.1.2';
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH'); // score 10

      mockReq.ip = '192.168.1.3';
      monitorSecurity.logSecurityEvent(mockReq as Request, 'SUSPICIOUS_REQUEST', 'MEDIUM'); // score 5

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);

      expect(suspiciousIPs[0].ip).toBe('192.168.1.2'); // score 10
      expect(suspiciousIPs[1].ip).toBe('192.168.1.3'); // score 5
      expect(suspiciousIPs[2].ip).toBe('192.168.1.1'); // score 1
    });

    test('debe incluir información de eventos', () => {
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH');

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);

      expect(suspiciousIPs[0].events).toHaveLength(1);
      expect(suspiciousIPs[0].events[0].type).toBe('XSS_ATTEMPT');
      expect(suspiciousIPs[0].events[0].severity).toBe('HIGH');
    });

    test('debe incluir timestamps', () => {
      monitorSecurity.logSecurityEvent(mockReq as Request, 'BLOCKED_REQUEST', 'LOW');

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);

      expect(suspiciousIPs[0].firstSeen).toBeInstanceOf(Date);
      expect(suspiciousIPs[0].lastSeen).toBeInstanceOf(Date);
    });

    test('debe actualizar lastSeen con nuevos eventos', (done) => {
      monitorSecurity.logSecurityEvent(mockReq as Request, 'BLOCKED_REQUEST', 'LOW');

      const firstCheck = monitorSecurity.getSuspiciousIPs(0);
      const firstLastSeen = firstCheck[0].lastSeen;

      setTimeout(() => {
        monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH');

        const secondCheck = monitorSecurity.getSuspiciousIPs(0);
        const secondLastSeen = secondCheck[0].lastSeen;

        expect(secondLastSeen.getTime()).toBeGreaterThan(firstLastSeen.getTime());
        done();
      }, 10);
    });

    test('debe rastrear múltiples IPs independientemente', () => {
      mockReq.ip = '192.168.1.1';
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH');

      mockReq.ip = '192.168.1.2';
      monitorSecurity.logSecurityEvent(mockReq as Request, 'SQL_INJECTION_ATTEMPT', 'HIGH');

      mockReq.ip = '192.168.1.3';
      monitorSecurity.logSecurityEvent(mockReq as Request, 'CSRF_VIOLATION', 'HIGH');

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);

      expect(suspiciousIPs).toHaveLength(3);
      expect(suspiciousIPs.map(ip => ip.ip)).toContain('192.168.1.1');
      expect(suspiciousIPs.map(ip => ip.ip)).toContain('192.168.1.2');
      expect(suspiciousIPs.map(ip => ip.ip)).toContain('192.168.1.3');
    });
  });

  describe('isIPSuspicious() - Verificación de IP', () => {
    test('debe retornar false para IP no registrada', () => {
      const isSuspicious = monitorSecurity.isIPSuspicious('192.168.1.1');

      expect(isSuspicious).toBe(false);
    });

    test('debe retornar false para IP con score bajo', () => {
      mockReq.ip = '192.168.1.1';
      monitorSecurity.logSecurityEvent(mockReq as Request, 'BLOCKED_REQUEST', 'LOW'); // score 1

      const isSuspicious = monitorSecurity.isIPSuspicious('192.168.1.1', 50);

      expect(isSuspicious).toBe(false);
    });

    test('debe retornar true para IP con score alto', () => {
      mockReq.ip = '192.168.1.1';
      monitorSecurity.logSecurityEvent(mockReq as Request, 'SQL_INJECTION_ATTEMPT', 'CRITICAL'); // score 25
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'CRITICAL'); // score 25

      const isSuspicious = monitorSecurity.isIPSuspicious('192.168.1.1', 50);

      expect(isSuspicious).toBe(true);
    });

    test('debe usar threshold por defecto de 50', () => {
      mockReq.ip = '192.168.1.1';
      // Acumular score de 50
      monitorSecurity.logSecurityEvent(mockReq as Request, 'SQL_INJECTION_ATTEMPT', 'CRITICAL'); // 25
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'CRITICAL'); // 25

      const isSuspicious = monitorSecurity.isIPSuspicious('192.168.1.1');

      expect(isSuspicious).toBe(true);
    });

    test('debe permitir threshold personalizado', () => {
      mockReq.ip = '192.168.1.1';
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH'); // score 10

      expect(monitorSecurity.isIPSuspicious('192.168.1.1', 5)).toBe(true);
      expect(monitorSecurity.isIPSuspicious('192.168.1.1', 15)).toBe(false);
    });

    test('debe ser case-sensitive en IP', () => {
      mockReq.ip = '192.168.1.1';
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'CRITICAL'); // score 25

      expect(monitorSecurity.isIPSuspicious('192.168.1.1', 25)).toBe(true);
      expect(monitorSecurity.isIPSuspicious('192.168.1.2')).toBe(false);
    });
  });

  describe('clearStats() - Limpieza de Estadísticas', () => {
    test('debe limpiar todas las estadísticas', () => {
      // Generar actividad
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH');
      monitorSecurity.logSecurityEvent(mockReq as Request, 'SQL_INJECTION_ATTEMPT', 'HIGH');
      monitorSecurity.logSecurityEvent(mockReq as Request, 'CSRF_VIOLATION', 'HIGH');

      monitorSecurity.clearStats();

      const stats = monitorSecurity.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.xssAttempts).toBe(0);
      expect(stats.sqlInjectionAttempts).toBe(0);
      expect(stats.csrfViolations).toBe(0);
    });

    test('debe limpiar IPs sospechosas', () => {
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH');

      monitorSecurity.clearStats();

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);
      expect(suspiciousIPs).toHaveLength(0);
    });

    test('debe permitir registrar nuevos eventos después de limpiar', () => {
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH');
      monitorSecurity.clearStats();

      monitorSecurity.logSecurityEvent(mockReq as Request, 'SQL_INJECTION_ATTEMPT', 'HIGH');

      const stats = monitorSecurity.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.sqlInjectionAttempts).toBe(1);
      expect(stats.xssAttempts).toBe(0);
    });
  });

  describe('Limpieza de Eventos Antiguos', () => {
    test('debe limpiar eventos de más de 24 horas', () => {
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH');

      jest.useFakeTimers();
      jest.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 horas

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);

      expect(suspiciousIPs[0].events).toHaveLength(0);
      expect(suspiciousIPs[0].suspicionScore).toBe(0);

      jest.useRealTimers();
    });

    test('debe mantener eventos recientes', () => {
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH');

      jest.useFakeTimers();
      jest.advanceTimersByTime(23 * 60 * 60 * 1000); // 23 horas

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);

      expect(suspiciousIPs[0].events).toHaveLength(1);
      expect(suspiciousIPs[0].suspicionScore).toBe(10);

      jest.useRealTimers();
    });

    test('debe recalcular score después de limpiar eventos antiguos', () => {
      // Evento antiguo
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH'); // +10

      jest.useFakeTimers();
      jest.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 horas

      // Evento nuevo
      monitorSecurity.logSecurityEvent(mockReq as Request, 'SUSPICIOUS_REQUEST', 'MEDIUM'); // +5

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);

      expect(suspiciousIPs[0].suspicionScore).toBe(5); // Solo el evento nuevo

      jest.useRealTimers();
    });
  });

  describe('Casos Edge y Seguridad', () => {
    test('debe manejar muchos eventos simultáneos', () => {
      for (let i = 0; i < 1000; i++) {
        monitorSecurity.logSecurityEvent(mockReq as Request, 'BLOCKED_REQUEST', 'LOW');
      }

      const stats = monitorSecurity.getStats();
      expect(stats.totalRequests).toBe(1000);
      expect(stats.blockedRequests).toBe(1000);
    });

    test('debe manejar muchas IPs diferentes', () => {
      for (let i = 0; i < 100; i++) {
        mockReq.ip = `192.168.1.${i}`;
        monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH');
      }

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);
      expect(suspiciousIPs).toHaveLength(100);
    });

    test('debe manejar IP con formato IPv6', () => {
      mockReq.ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH');

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);
      expect(suspiciousIPs[0].ip).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    test('debe manejar IP localhost', () => {
      mockReq.ip = '127.0.0.1';
      monitorSecurity.logSecurityEvent(mockReq as Request, 'AUTH_FAILURE', 'MEDIUM');

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);
      expect(suspiciousIPs[0].ip).toBe('127.0.0.1');
    });

    test('debe manejar detalles con objetos complejos', () => {
      const complexDetails = {
        payload: '<script>alert(1)</script>',
        headers: { 'User-Agent': 'Malicious Bot' },
        nested: {
          deep: {
            value: 'test',
          },
        },
      };

      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'XSS_ATTEMPT',
        'HIGH',
        complexDetails
      );

      const stats = monitorSecurity.getStats();
      expect(stats.xssAttempts).toBe(1);
    });

    test('debe manejar eventos CRITICAL correctamente', () => {
      monitorSecurity.logSecurityEvent(
        mockReq as Request,
        'SQL_INJECTION_ATTEMPT',
        'CRITICAL'
      );

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);
      expect(suspiciousIPs[0].suspicionScore).toBe(25);
    });

    test('debe acumular scores correctamente con eventos mixtos', () => {
      monitorSecurity.logSecurityEvent(mockReq as Request, 'BLOCKED_REQUEST', 'LOW'); // +1
      monitorSecurity.logSecurityEvent(mockReq as Request, 'SUSPICIOUS_REQUEST', 'MEDIUM'); // +5
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH'); // +10
      monitorSecurity.logSecurityEvent(mockReq as Request, 'SQL_INJECTION_ATTEMPT', 'CRITICAL'); // +25

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(0);
      expect(suspiciousIPs[0].suspicionScore).toBe(41);
    });
  });

  describe('Integración con Flujo Completo', () => {
    test('debe monitorear ataque completo', () => {
      const attackerIP = '10.0.0.666';
      mockReq.ip = attackerIP;

      // Simular ataque progresivo
      monitorSecurity.logSecurityEvent(mockReq as Request, 'SUSPICIOUS_REQUEST', 'MEDIUM');
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'HIGH');
      monitorSecurity.logSecurityEvent(mockReq as Request, 'SQL_INJECTION_ATTEMPT', 'HIGH');
      monitorSecurity.logSecurityEvent(mockReq as Request, 'CSRF_VIOLATION', 'HIGH');

      const stats = monitorSecurity.getStats();
      expect(stats.totalRequests).toBe(4);
      expect(stats.suspiciousRequests).toBe(1);
      expect(stats.xssAttempts).toBe(1);
      expect(stats.sqlInjectionAttempts).toBe(1);
      expect(stats.csrfViolations).toBe(1);

      const isSuspicious = monitorSecurity.isIPSuspicious(attackerIP, 30); // 5+10+10+10=35
      expect(isSuspicious).toBe(true);

      const suspiciousIPs = monitorSecurity.getSuspiciousIPs(10);
      expect(suspiciousIPs[0].ip).toBe(attackerIP);
      expect(suspiciousIPs[0].events).toHaveLength(4);
    });

    test('debe diferenciar entre atacantes y usuarios normales', () => {
      // Usuario normal
      mockReq.ip = '192.168.1.100';
      monitorSecurity.logSecurityEvent(mockReq as Request, 'BLOCKED_REQUEST', 'LOW');

      // Atacante
      mockReq.ip = '10.0.0.666';
      monitorSecurity.logSecurityEvent(mockReq as Request, 'SQL_INJECTION_ATTEMPT', 'CRITICAL');
      monitorSecurity.logSecurityEvent(mockReq as Request, 'XSS_ATTEMPT', 'CRITICAL');

      expect(monitorSecurity.isIPSuspicious('192.168.1.100')).toBe(false);
      expect(monitorSecurity.isIPSuspicious('10.0.0.666')).toBe(true);
    });
  });
});
