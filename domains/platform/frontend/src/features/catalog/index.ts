// Catalog Feature - Exports

// Components
export * from './components/products/ProductCard'
export * from './components/products/ProductGrid'
export * from './components/products/ProductDetail'
export * from './components/products/ProductToolbar'
export * from './components/products/ProductPagination'
export * from './components/products/ProductCatalog'
export * from './components/products/SearchBar'
export * from './components/products/RelatedProducts'
export * from './components/products/ProductReviews'
export * from './components/products/ProductQA'
export * from './components/products/PriceComparator'
export * from './components/products/TechnicalComparator'
export * from './components/products/ComparisonFloatingButton'

// Export ProductFilters component (avoiding conflict with ProductFilters interface)
export { ProductFilters } from './components/products/ProductFilters'

// Export ProductFilterSidebar with its types (including ProductFilters interface)
export { 
  ProductFilterSidebar,
  type ProductFilters as ProductFiltersType,
  type CategoryOption,
  type BrandOption,
  type SpecOption
} from './components/products/ProductFilterSidebar'

// Hooks
export * from './hooks/useProducts'
export * from './hooks/useCategories'
export * from './hooks/useSearch'
export * from './hooks/useInfiniteProducts'

// Services
export { 
  productService,
  type ProductFilters as ProductFiltersService,
  type SearchProductsParams
} from './services/product.service'
export { 
  categoryService,
  type CategoryTree
} from './services/category.service'
export { searchService } from './services/search.service'
