import { Header, Footer } from '@/layout'
import { ProductCatalog } from '@/catalog'

export default function ProductosPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1">
        <ProductCatalog />
      </div>
      <Footer />
    </div>
  )
}