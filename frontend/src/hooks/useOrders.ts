import { useState, useEffect } from 'react'
import { Order } from '@/types'
import api from '@/lib/api'

interface UseOrdersReturn {
  orders: Order[] | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get('/orders')
      setOrders(response.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los pedidos')
      setOrders(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders
  }
}