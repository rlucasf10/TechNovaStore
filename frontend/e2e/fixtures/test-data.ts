/**
 * Test data fixtures for E2E tests
 */

export const testProducts = [
  {
    id: 'laptop-gaming-1',
    name: 'Gaming Laptop RTX 4070',
    price: 1299.99,
    category: 'Laptops',
    brand: 'TechBrand',
    image: '/images/laptop-gaming.jpg',
    description: 'High-performance gaming laptop with RTX 4070 graphics card',
    specifications: {
      processor: 'Intel i7-13700H',
      memory: '16GB DDR5',
      storage: '1TB NVMe SSD',
      graphics: 'RTX 4070 8GB',
      display: '15.6" 144Hz FHD'
    },
    providers: [
      { name: 'Amazon', price: 1299.99, shipping: 0, deliveryDays: 2 },
      { name: 'AliExpress', price: 1199.99, shipping: 25, deliveryDays: 15 },
      { name: 'Newegg', price: 1249.99, shipping: 15, deliveryDays: 3 }
    ],
    rating: 4.5,
    reviews: 234,
    inStock: true
  },
  {
    id: 'smartphone-pro-1',
    name: 'Smartphone Pro 256GB',
    price: 899.99,
    category: 'Smartphones',
    brand: 'MobileTech',
    image: '/images/smartphone-pro.jpg',
    description: 'Latest flagship smartphone with advanced camera system',
    specifications: {
      display: '6.7" OLED 120Hz',
      processor: 'Snapdragon 8 Gen 3',
      memory: '12GB RAM',
      storage: '256GB',
      camera: '108MP Triple Camera',
      battery: '5000mAh'
    },
    providers: [
      { name: 'Amazon', price: 899.99, shipping: 0, deliveryDays: 1 },
      { name: 'eBay', price: 849.99, shipping: 10, deliveryDays: 5 }
    ],
    rating: 4.7,
    reviews: 156,
    inStock: true
  },
  {
    id: 'tablet-pro-1',
    name: 'Tablet Pro 11" 512GB',
    price: 799.99,
    category: 'Tablets',
    brand: 'TabletCorp',
    image: '/images/tablet-pro.jpg',
    description: 'Professional tablet for creative work and productivity',
    specifications: {
      display: '11" Liquid Retina',
      processor: 'M2 Chip',
      memory: '8GB RAM',
      storage: '512GB',
      connectivity: 'Wi-Fi 6E + 5G',
      accessories: 'Apple Pencil Compatible'
    },
    providers: [
      { name: 'Amazon', price: 799.99, shipping: 0, deliveryDays: 2 },
      { name: 'Banggood', price: 749.99, shipping: 30, deliveryDays: 20 }
    ],
    rating: 4.6,
    reviews: 89,
    inStock: true
  }
];

export const testCategories = [
  { id: 1, name: 'Laptops', slug: 'laptops', count: 45 },
  { id: 2, name: 'Smartphones', slug: 'smartphones', count: 32 },
  { id: 3, name: 'Tablets', slug: 'tablets', count: 18 },
  { id: 4, name: 'Accessories', slug: 'accessories', count: 67 },
  { id: 5, name: 'Gaming', slug: 'gaming', count: 28 }
];

export const testUser = {
  id: 'user-123',
  email: 'test@technovastore.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  phone: '+34 600 123 456',
  addresses: [
    {
      id: 'addr-1',
      type: 'shipping',
      street: 'Calle Mayor 123',
      city: 'Madrid',
      postalCode: '28001',
      country: 'España',
      isDefault: true
    },
    {
      id: 'addr-2',
      type: 'billing',
      street: 'Avenida Libertad 456',
      city: 'Barcelona',
      postalCode: '08001',
      country: 'España',
      isDefault: false
    }
  ]
};

export const testCart = {
  id: 'cart-123',
  userId: 'user-123',
  items: [
    {
      id: 'item-1',
      productId: 'laptop-gaming-1',
      name: 'Gaming Laptop RTX 4070',
      price: 1299.99,
      quantity: 1,
      image: '/images/laptop-gaming.jpg'
    },
    {
      id: 'item-2',
      productId: 'smartphone-pro-1',
      name: 'Smartphone Pro 256GB',
      price: 899.99,
      quantity: 1,
      image: '/images/smartphone-pro.jpg'
    }
  ],
  subtotal: 2199.98,
  tax: 219.99,
  shipping: 0,
  total: 2419.97,
  currency: 'EUR'
};

export const testOrder = {
  id: 'order-123',
  orderNumber: 'TNS-2024-001',
  userId: 'user-123',
  status: 'processing',
  items: testCart.items,
  shippingAddress: testUser.addresses[0],
  billingAddress: testUser.addresses[1],
  paymentMethod: 'credit-card',
  paymentStatus: 'paid',
  subtotal: 2199.98,
  tax: 219.99,
  shipping: 0,
  total: 2419.97,
  currency: 'EUR',
  createdAt: '2024-01-15T10:30:00Z',
  estimatedDelivery: '2024-01-17T18:00:00Z',
  tracking: {
    number: 'TRK123456789',
    carrier: 'DHL',
    status: 'in_transit',
    updates: [
      {
        status: 'order_placed',
        timestamp: '2024-01-15T10:30:00Z',
        location: 'Madrid, España'
      },
      {
        status: 'processing',
        timestamp: '2024-01-15T14:20:00Z',
        location: 'Warehouse Madrid'
      },
      {
        status: 'shipped',
        timestamp: '2024-01-16T09:15:00Z',
        location: 'DHL Hub Madrid'
      }
    ]
  }
};

export const testChatMessages = [
  {
    id: 'msg-1',
    type: 'user',
    content: 'Hola, necesito ayuda para elegir un laptop',
    timestamp: '2024-01-15T15:30:00Z'
  },
  {
    id: 'msg-2',
    type: 'bot',
    content: '¡Hola! Estaré encantado de ayudarte a elegir el laptop perfecto. ¿Para qué lo vas a usar principalmente?',
    timestamp: '2024-01-15T15:30:05Z'
  },
  {
    id: 'msg-3',
    type: 'user',
    content: 'Para gaming y trabajo de diseño',
    timestamp: '2024-01-15T15:31:00Z'
  },
  {
    id: 'msg-4',
    type: 'bot',
    content: 'Perfecto, para gaming y diseño te recomiendo laptops con tarjetas gráficas dedicadas. Te sugiero el Gaming Laptop RTX 4070 que tenemos en oferta.',
    timestamp: '2024-01-15T15:31:10Z',
    suggestions: [
      {
        type: 'product',
        productId: 'laptop-gaming-1',
        title: 'Ver Gaming Laptop RTX 4070'
      }
    ]
  }
];

export const mockApiResponses = {
  products: {
    list: {
      products: testProducts,
      total: testProducts.length,
      page: 1,
      limit: 20
    },
    search: (query: string) => ({
      products: testProducts.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      ),
      query,
      total: testProducts.length
    }),
    byCategory: (category: string) => ({
      products: testProducts.filter(p => 
        p.category.toLowerCase() === category.toLowerCase()
      ),
      category,
      total: testProducts.length
    }),
    byId: (id: string) => testProducts.find(p => p.id === id)
  },
  categories: {
    list: testCategories
  },
  cart: {
    get: testCart,
    add: (productId: string, quantity: number = 1) => ({
      ...testCart,
      items: [
        ...testCart.items,
        {
          id: `item-${Date.now()}`,
          productId,
          name: testProducts.find(p => p.id === productId)?.name || 'Product',
          price: testProducts.find(p => p.id === productId)?.price || 0,
          quantity,
          image: testProducts.find(p => p.id === productId)?.image || ''
        }
      ]
    }),
    update: (itemId: string, quantity: number) => ({
      ...testCart,
      items: testCart.items.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    }),
    remove: (itemId: string) => ({
      ...testCart,
      items: testCart.items.filter(item => item.id !== itemId)
    })
  },
  orders: {
    create: testOrder,
    get: (id: string) => testOrder,
    list: [testOrder]
  },
  chat: {
    send: (message: string) => ({
      id: `msg-${Date.now()}`,
      type: 'bot',
      content: `Gracias por tu mensaje: "${message}". ¿En qué más puedo ayudarte?`,
      timestamp: new Date().toISOString()
    })
  }
};