/**
 * Servicio de Notificaciones
 * 
 * Gestiona las notificaciones de usuario con el backend
 */

import axios, { AxiosRequestConfig } from 'axios'

// La URL base del API (ya incluye /api)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// CSRF token cache
let csrfToken: string | null = null
let sessionId: string | null = null

/**
 * Obtener CSRF token del servidor
 */
async function getCSRFToken(): Promise<{ token: string; sessionId: string }> {
  if (csrfToken && sessionId) {
    return { token: csrfToken, sessionId }
  }

  try {
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Construir URL base sin /api para el endpoint de CSRF
    const csrfBaseUrl = API_URL.replace('/api', '')
    const response = await axios.get(`${csrfBaseUrl}/api/csrf-token`, {
      headers: { 'X-Session-ID': sessionId },
      withCredentials: true,
      timeout: 5000,
    })

    csrfToken = response.data.csrfToken || response.data.token
    sessionId = response.data.sessionId || sessionId

    return { token: csrfToken!, sessionId: sessionId! }
  } catch (error) {
    console.error('Error getting CSRF token:', error)
    throw error
  }
}

/**
 * Obtener configuración de axios con autenticación
 * 
 * ✅ SEGURIDAD: NO agregamos Authorization header con tokens de localStorage
 * La autenticación se maneja automáticamente mediante httpOnly cookies
 * que el navegador envía con withCredentials: true
 */
function getAuthConfig(): AxiosRequestConfig {
  const config: AxiosRequestConfig = {
    withCredentials: true,
    headers: {}
  }
  
  return config
}

/**
 * Obtener configuración con autenticación Y CSRF token (para PUT/POST/DELETE)
 */
async function getAuthConfigWithCSRF(): Promise<AxiosRequestConfig> {
  const config = getAuthConfig()
  
  try {
    const { token, sessionId: sid } = await getCSRFToken()
    config.headers = {
      ...config.headers,
      'X-CSRF-Token': token,
      'X-Session-ID': sid
    }
  } catch (error) {
    console.error('Failed to get CSRF token:', error)
  }
  
  return config
}

export interface UserNotification {
  id: string
  user_id: string
  type: 'order' | 'shipping' | 'payment' | 'system' | 'promotion'
  title: string
  message: string
  read: boolean
  action_url?: string
  timestamp: string
  created_at: string
  updated_at: string
}

export interface GetNotificationsParams {
  userId: string
  type?: 'order' | 'shipping' | 'payment' | 'system' | 'promotion'
  read?: boolean
  limit?: number
  offset?: number
}

export interface GetNotificationsResponse {
  notifications: UserNotification[]
  unreadCount: number
}

export interface CreateNotificationData {
  user_id: string
  type: 'order' | 'shipping' | 'payment' | 'system' | 'promotion'
  title: string
  message: string
  action_url?: string
}

/**
 * Obtener notificaciones de un usuario
 */
export async function getUserNotifications(
  params: GetNotificationsParams
): Promise<GetNotificationsResponse> {
  const { userId, ...queryParams } = params
  
  // API_URL ya incluye /api, así que usamos /notifications directamente
  const config = getAuthConfig()
  const response = await axios.get(
    `${API_URL}/notifications/user/${userId}`,
    { 
      ...config,
      params: queryParams
    }
  )
  
  return response.data.data
}

/**
 * Crear una notificación para un usuario
 */
export async function createUserNotification(
  data: CreateNotificationData
): Promise<UserNotification> {
  const config = await getAuthConfigWithCSRF()
  const response = await axios.post(
    `${API_URL}/notifications/user`,
    data,
    config
  )
  
  return response.data.data
}

/**
 * Marcar una notificación como leída
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  const config = await getAuthConfigWithCSRF()
  await axios.put(
    `${API_URL}/notifications/${notificationId}/read`,
    { user_id: userId },
    config
  )
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<number> {
  const config = await getAuthConfigWithCSRF()
  const response = await axios.put(
    `${API_URL}/notifications/user/${userId}/mark-all-read`,
    {},
    config
  )
  
  return response.data.count
}

/**
 * Eliminar una notificación
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<void> {
  const config = await getAuthConfigWithCSRF()
  await axios.delete(
    `${API_URL}/notifications/${notificationId}`,
    { 
      ...config,
      data: { user_id: userId }
    }
  )
}

export const notificationService = {
  getUserNotifications,
  createUserNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
}
