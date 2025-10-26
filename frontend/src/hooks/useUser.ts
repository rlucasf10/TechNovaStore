import { useState, useEffect } from 'react'
import { User } from '@/types'
import api from '@/lib/api'

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
      
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setUser(null)
        return
      }

      const response = await api.get('/user/profile')
      setUser(response.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el perfil de usuario')
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