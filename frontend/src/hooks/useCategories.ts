import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Category } from '@/types'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data } = await api.get('/categories')
      return data.data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async (): Promise<Category> => {
      const { data } = await api.get(`/categories/${slug}`)
      return data.data
    },
    enabled: !!slug,
  })
}

export function useCategoryTree() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: async (): Promise<Category[]> => {
      const { data } = await api.get('/categories/tree')
      return data.data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}