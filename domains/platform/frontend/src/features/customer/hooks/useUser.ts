import { useState, useEffect } from 'react'
import { authService, type User } from '@/customer'

interface UseUserReturn {
  user: User | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // ✅ SEGURIDAD: Usar authService.getCurrentUser() que maneja httpOnly cookies correctamente
      // NO verificamos tokens en localStorage
      // La autenticación se maneja automáticamente mediante httpOnly cookies
      // Si hay cookie válida, el backend responde con usuario
      // Si no hay cookie o es inválida, el backend responde 401 (manejado silenciosamente)
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number; data?: { message?: string } } }
      
      // Si el error es 401 (no autenticado), es un estado esperado
      // NO mostrar error ni loguear, simplemente establecer user como null
      if (axiosError?.response?.status === 401) {
        setUser(null)
        setError(null) // No hay error, el usuario simplemente no está autenticado
        return
      }
      
      // Si el error es 500, también puede ser un token inválido
      if (axiosError?.response?.status === 500) {
        setUser(null)
        setError(null) // No mostrar error para tokens inválidos
        return
      }
      
      // Para otros errores, sí mostrar el mensaje
      const errorMessage = axiosError?.response?.data?.message || 'Error al cargar el perfil de usuario'
      setError(errorMessage)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return {
    user,
    loading,
    error,
    refetch: fetchUser
  }
}