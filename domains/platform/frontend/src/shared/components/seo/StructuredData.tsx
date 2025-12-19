/**
 * Componente para añadir Structured Data (JSON-LD) a las páginas
 * Mejora el SEO y permite rich snippets en resultados de búsqueda
 */

interface OrganizationSchema {
  '@context': 'https://schema.org'
  '@type': 'Organization'
  name: string
  url: string
  logo: string
  description: string
  contactPoint: {
    '@type': 'ContactPoint'
    telephone: string
    contactType: string
    availableLanguage: string[]
  }
  sameAs: string[]
}

interface WebsiteSchema {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  name: string
  url: string
  potentialAction: {
    '@type': 'SearchAction'
    target: string
    'query-input': string
  }
}

interface ProductSchema {
  '@context': 'https://schema.org'
  '@type': 'Product'
  name: string
  description: string
  image: string[]
  sku: string
  brand?: {
    '@type': 'Brand'
    name: string
  }
  offers: {
    '@type': 'Offer'
    price: string
    priceCurrency: string
    availability: string
    url: string
  }
  aggregateRating?: {
    '@type': 'AggregateRating'
    ratingValue: string
    reviewCount: string
  }
}

interface BreadcrumbSchema {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: Array<{
    '@type': 'ListItem'
    position: number
    name: string
    item: string
  }>
}

/**
 * Schema de Organización para la página principal
 */
export function OrganizationStructuredData() {
  const schema: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TechNovaStore',
    url: 'http://localhost:3020',
    logo: 'http://localhost:3020/logo.png',
    description: 'Tienda online de tecnología e informática con los mejores precios',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+34-900-123-456',
      contactType: 'customer service',
      availableLanguage: ['Spanish', 'English'],
    },
    sameAs: [
      'https://facebook.com/technovastore',
      'https://twitter.com/technovastore',
      'https://instagram.com/technovastore',
      'https://linkedin.com/company/technovastore',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Schema de Website con SearchAction
 */
export function WebsiteStructuredData() {
  const schema: WebsiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TechNovaStore',
    url: 'http://localhost:3020',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'http://localhost:3020/productos?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Schema de Producto para páginas de detalle
 */
export function ProductStructuredData({
  name,
  description,
  images,
  sku,
  brand,
  price,
  currency = 'EUR',
  availability = 'InStock',
  url,
  rating,
  reviewCount,
}: {
  name: string
  description: string
  images: string[]
  sku: string
  brand?: string
  price: number
  currency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
  url: string
  rating?: number
  reviewCount?: number
}) {
  const schema: ProductSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: images,
    sku,
    ...(brand && {
      brand: {
        '@type': 'Brand',
        name: brand,
      },
    }),
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url,
    },
    ...(rating &&
      reviewCount && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: rating.toFixed(1),
          reviewCount: reviewCount.toString(),
        },
      }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Schema de Breadcrumb para navegación
 */
export function BreadcrumbStructuredData({
  items,
}: {
  items: Array<{ name: string; url: string }>
}) {
  const schema: BreadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
