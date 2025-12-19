/**
 * Caso de uso: Gestionar sesión de chat
 * 
 * Este caso de uso maneja la creación y gestión de sesiones de chat:
 * 1. Crear nuevas sesiones
 * 2. Obtener sesiones existentes
 * 3. Actualizar actividad de sesiones
 * 4. Limpiar sesiones expiradas
 */

import { ChatContext } from '../shared/types';
import { logger } from '../shared/utils/logger';

export interface ChatSession {
  sessionId: string;
  userId?: string;
  context: ChatContext;
  createdAt: Date;
  lastActivity: Date;
  preferredAIProvider?: 'gemini' | 'fallback';
}

export class ManageSession {
  private sessions: Map<string, ChatSession>;

  constructor() {
    this.sessions = new Map();
    this.startSessionCleanup();
  }

  /**
   * Crea una nueva sesión de chat
   */
  createSession(sessionId: string, userId?: string): ChatSession {
    const now = new Date();

    const session: ChatSession = {
      sessionId,
      userId,
      context: {
        sessionId,
        userId,
        previousIntents: [],
        userPreferences: {
          categories: [],
          brands: []
        },
        conversationHistory: [],
        lastProductQuery: undefined,
        lastProducts: undefined,
        // Inicializar array de productos ya mostrados (para evitar repeticiones)
        shownProductSkus: []
      },
      createdAt: now,
      lastActivity: now
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Obtiene una sesión existente o crea una nueva
   */
  getOrCreateSession(sessionId: string, userId?: string): ChatSession {
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = this.createSession(sessionId, userId);
    }

    return session;
  }

  /**
   * Obtiene una sesión existente
   */
  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Actualiza la actividad de una sesión
   */
  updateSessionActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * Elimina una sesión
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Obtiene el número de sesiones activas
   */
  getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  /**
   * Obtiene el total de sesiones (alias para compatibilidad)
   */
  getTotalSessions(): number {
    return this.sessions.size;
  }

  /**
   * Obtiene el número de sesiones activas (alias para compatibilidad)
   */
  getActiveSessions(): number {
    return this.sessions.size;
  }

  /**
   * Limpia todas las sesiones activas (para reinicio del servicio)
   */
  clearAllSessions(): number {
    const count = this.sessions.size;
    this.sessions.clear();
    logger.info('Todas las sesiones limpiadas', { count });
    return count;
  }

  /**
   * Inicia la limpieza periódica de sesiones expiradas
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = new Date();
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas

      for (const [sessionId, session] of this.sessions.entries()) {
        if (now.getTime() - session.lastActivity.getTime() > maxAge) {
          this.sessions.delete(sessionId);
          logger.debug('Sesión expirada limpiada', { sessionId });
        }
      }
    }, 60 * 60 * 1000); // Ejecutar cada hora
  }
}
