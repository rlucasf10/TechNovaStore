import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Product, PaginatedResponse } from '@/types'

interface ProductsParams {
  page?: number
  limit?: number
  category?: string
  search?: string
  sort?: string
  minPrice?: number
  maxPrice?: number
}

export function useProducts(params: ProductsParams = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async (): Promise<PaginatedResponse<Product>> => {
      const { data } = await api.get('/products', { params })
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async (): Promise<Product> => {
      const { data } = await api.get(`/products/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: async (): Promise<Product[]> => {
      if (!query.trim()) return []
      const { data } = await api.get('/products/search', {
        params: { q: query, limit: 10 }
      })
      return data.data
    },
    enabled: query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async (): Promise<Product[]> => {
      const { data } = await api.get('/products/featured')
      return data.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}