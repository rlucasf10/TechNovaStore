/**
 * Tests para ManageSession
 */

import { ManageSession } from './ManageSession';

describe('ManageSession', () => {
  let manageSession: ManageSession;

  beforeEach(() => {
    manageSession = new ManageSession();
  });

  describe('createSession', () => {
    it('debe crear una nueva sesión con sessionId', () => {
      const sessionId = 'test-session-123';
      const session = manageSession.createSession(sessionId);

      expect(session.sessionId).toBe(sessionId);
      expect(session.context.sessionId).toBe(sessionId);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastActivity).toBeInstanceOf(Date);
    });

    it('debe crear una sesión con userId cuando se proporciona', () => {
      const sessionId = 'test-session-123';
      const userId = 'user-456';
      const session = manageSession.createSession(sessionId, userId);

      expect(session.userId).toBe(userId);
      expect(session.context.userId).toBe(userId);
    });

    it('debe inicializar el contexto correctamente', () => {
      const session = manageSession.createSession('test-session');

      expect(session.context.previousIntents).toEqual([]);
      expect(session.context.conversationHistory).toEqual([]);
      expect(session.context.userPreferences).toEqual({
        categories: [],
        brands: []
      });
    });
  });

  describe('getOrCreateSession', () => {
    it('debe retornar sesión existente si ya existe', () => {
      const sessionId = 'existing-session';
      const createdSession = manageSession.createSession(sessionId);
      
      const retrievedSession = manageSession.getOrCreateSession(sessionId);

      expect(retrievedSession).toBe(createdSession);
      expect(retrievedSession.sessionId).toBe(sessionId);
    });

    it('debe crear nueva sesión si no existe', () => {
      const sessionId = 'new-session';
      
      const session = manageSession.getOrCreateSession(sessionId);

      expect(session.sessionId).toBe(sessionId);
      expect(session).toBeDefined();
    });

    it('debe crear sesión con userId si se proporciona', () => {
      const sessionId = 'new-session';
      const userId = 'user-123';
      
      const session = manageSession.getOrCreateSession(sessionId, userId);

      expect(session.userId).toBe(userId);
    });
  });

  describe('getSession', () => {
    it('debe retornar sesión existente', () => {
      const sessionId = 'test-session';
      manageSession.createSession(sessionId);
      
      const session = manageSession.getSession(sessionId);

      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
    });

    it('debe retornar undefined si la sesión no existe', () => {
      const session = manageSession.getSession('non-existent');

      expect(session).toBeUndefined();
    });
  });

  describe('updateSessionActivity', () => {
    it('debe actualizar lastActivity de la sesión', async () => {
      const sessionId = 'test-session';
      const session = manageSession.createSession(sessionId);
      const initialActivity = session.lastActivity;

      // Esperar un poco para que el timestamp sea diferente
      await new Promise(resolve => setTimeout(resolve, 10));

      manageSession.updateSessionActivity(sessionId);

      expect(session.lastActivity.getTime()).toBeGreaterThan(initialActivity.getTime());
    });

    it('no debe fallar si la sesión no existe', () => {
      expect(() => {
        manageSession.updateSessionActivity('non-existent');
      }).not.toThrow();
    });
  });

  describe('deleteSession', () => {
    it('debe eliminar una sesión existente', () => {
      const sessionId = 'test-session';
      manageSession.createSession(sessionId);

      manageSession.deleteSession(sessionId);

      const session = manageSession.getSession(sessionId);
      expect(session).toBeUndefined();
    });

    it('no debe fallar si la sesión no existe', () => {
      expect(() => {
        manageSession.deleteSession('non-existent');
      }).not.toThrow();
    });
  });

  describe('getActiveSessionsCount', () => {
    it('debe retornar 0 cuando no hay sesiones', () => {
      const count = manageSession.getActiveSessionsCount();
      expect(count).toBe(0);
    });

    it('debe retornar el número correcto de sesiones activas', () => {
      manageSession.createSession('session-1');
      manageSession.createSession('session-2');
      manageSession.createSession('session-3');

      const count = manageSession.getActiveSessionsCount();
      expect(count).toBe(3);
    });

    it('debe decrementar cuando se eliminan sesiones', () => {
      manageSession.createSession('session-1');
      manageSession.createSession('session-2');
      manageSession.deleteSession('session-1');

      const count = manageSession.getActiveSessionsCount();
      expect(count).toBe(1);
    });
  });
});
