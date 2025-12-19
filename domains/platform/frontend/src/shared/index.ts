// Shared - Exports
export * from './components/ui'
export * from './components/layout'
export * from './hooks/useToast'
export * from './hooks/useRateLimit'
export * from './hooks/useURLFilters'
export * from './hooks/usePrefetch'
export * from './lib/utils'
export * from './lib/api'
export * from './lib/axios'
export * from './lib/react-query'
// Exportar react-query.config con alias para evitar conflictos
export {
  createQueryClient,
  STALE_TIME,
  GC_TIME,
  staticQueryOptions,
  dynamicQueryOptions,
  realtimeQueryOptions,
  queryKeys as reactQueryKeys,
  defaultQueryOptions
} from './lib/react-query.config'
export * from './lib/socket'
export * from './lib/theme'
export * from './lib/animations'
export * from './lib/form-helpers'
export * from './lib/form-schemas'
export * from './lib/xss-security'
export * from './hooks/useSanitize'
export * from './store/notification.store'
export * from './store/theme.store'
export * from './contexts/ThemeContext'
export { useTheme } from './contexts/ThemeContext'
