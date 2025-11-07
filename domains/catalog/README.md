# Dominio: Catalog (Catálogo)

## Propósito

Este dominio es responsable de la **gestión del catálogo de productos**, incluyendo la sincronización con proveedores externos y el sistema de recomendaciones basado en Machine Learning.

## Responsabilidades

- **Gestión de productos**: CRUD de productos, categorías, inventario y precios
- **Sincronización con proveedores**: Integración automática con APIs de proveedores externos
- **Recomendaciones inteligentes**: Sistema de recomendaciones basado en ML para sugerir productos a los usuarios

## Servicios Incluidos

- `product-service`: Microservicio principal para gestión de productos
- `sync-engine`: Motor de sincronización automática con proveedores
- `recommender-service`: Sistema de recomendaciones con Machine Learning

## Casos de Uso Principales

1. Buscar y filtrar productos en el catálogo
2. Obtener detalles de un producto específico
3. Sincronizar productos desde proveedores externos
4. Generar recomendaciones personalizadas para usuarios
5. Gestionar inventario y disponibilidad de productos

## Dependencias

- **MongoDB**: Base de datos principal para productos
- **Redis**: Cache de productos y recomendaciones
- **APIs Externas**: Proveedores de productos (Amazon, MercadoLibre, etc.)

## Eventos Publicados

- `product.created`: Cuando se crea un nuevo producto
- `product.updated`: Cuando se actualiza un producto
- `product.deleted`: Cuando se elimina un producto
- `product.synced`: Cuando se sincroniza un producto desde proveedor
- `inventory.updated`: Cuando cambia el inventario de un producto

## Eventos Consumidos

- `order.completed`: Para actualizar inventario después de una venta
- `user.activity`: Para mejorar recomendaciones basadas en comportamiento
