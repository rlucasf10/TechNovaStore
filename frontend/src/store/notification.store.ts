/**
 * Store de Notificaciones con Zustand
 * 
 * Maneja el estado de notificaciones tipo toast:
 * - Lista de notificaciones activas
 * - Agregar/remover notificaciones
 * - Auto-close después de timeout
 */

import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number; // en milisegundos, 0 = no auto-close
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationState {
  // Estado
  notifications: Notification[];
  maxNotifications: number;
  
  // Acciones
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  
  // Helpers
  success: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  warning: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
}

// Generar ID único
const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  // Estado inicial
  notifications: [],
  maxNotifications: 3,
  
  // Acciones
  addNotification: (notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const duration = notification.duration ?? 5000; // 5 segundos por defecto
    
    const newNotification: Notification = {
      ...notification,
      id,
      duration,
    };
    
    set((state: NotificationState) => {
      // Limitar a maxNotifications
      const notifications = [...state.notifications, newNotification];
      if (notifications.length > state.maxNotifications) {
        notifications.shift(); // Remover la más antigua
      }
      return { notifications };
    });
    
    // Auto-close si tiene duration > 0
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
    
    return id;
  },
  
  removeNotification: (id: string) => {
    set((state: NotificationState) => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },
  
  clearAll: () => {
    set({ notifications: [] });
  },
  
  // Helpers
  success: (message: string, title?: string, duration?: number) => {
    return get().addNotification({
      type: 'success',
      title: title || 'Éxito',
      message,
      duration,
    });
  },
  
  error: (message: string, title?: string, duration?: number) => {
    return get().addNotification({
      type: 'error',
      title: title || 'Error',
      message,
      duration: duration ?? 7000, // Errores duran más
    });
  },
  
  warning: (message: string, title?: string, duration?: number) => {
    return get().addNotification({
      type: 'warning',
      title: title || 'Advertencia',
      message,
      duration,
    });
  },
  
  info: (message: string, title?: string, duration?: number) => {
    return get().addNotification({
      type: 'info',
      title: title || 'Información',
      message,
      duration,
    });
  },
}));
