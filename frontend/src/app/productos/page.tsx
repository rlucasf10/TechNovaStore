import { Header } from '@/components/ui'
import { ProductCatalog } from '@/components/products'

export default function ProductosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ProductCatalog />
    </div>
  )
}