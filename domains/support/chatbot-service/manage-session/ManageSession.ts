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

export interface ChatSession {
  sessionId: string;
  userId?: string;
  context: ChatContext;
  createdAt: Date;
  lastActivity: Date;
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
        lastProducts: undefined
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
   * Inicia la limpieza periódica de sesiones expiradas
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = new Date();
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas

      for (const [sessionId, session] of this.sessions.entries()) {
        if (now.getTime() - session.lastActivity.getTime() > maxAge) {
          this.sessions.delete(sessionId);
          console.log(`Cleaned up expired session: ${sessionId}`);
        }
      }
    }, 60 * 60 * 1000); // Ejecutar cada hora
  }
}
