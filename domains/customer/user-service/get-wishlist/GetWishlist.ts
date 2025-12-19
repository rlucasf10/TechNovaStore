/**
 * Caso de Uso: Obtener Lista de Deseos
 * 
 * Obtiene todos los productos en la wishlist del usuario autenticado
 */

import { Wishlist } from '../shared/models/Wishlist';
import { logger } from '../shared/utils/logger';
import axios from 'axios';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3000';

export interface GetWishlistRequest {
  userId: number;
}

export interface WishlistItem {
  id: number;
  productId: string;
  product: any; // Producto completo del Product Service
  addedAt: Date;
}

export interface GetWishlistResponse {
  success: boolean;
  data: WishlistItem[];
  message?: string;
}

export class GetWishlist {
  async execute(request: GetWishlistRequest): Promise<GetWishlistResponse> {
    try {
      const { userId } = request;

      logger.info(`Getting wishlist for user ${userId}`);

      // Obtener items de wishlist de la base de datos
      const wishlistItems = await Wishlist.findAll({
        where: { user_id: userId },
        order: [['added_at', 'DESC']],
      });

      logger.info(`Found ${wishlistItems.length} items in wishlist`);

      // Si no hay items, retornar array vacío
      if (wishlistItems.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      // Obtener detalles de productos del Product Service
      const productIds = wishlistItems.map(item => item.product_id);
      
      let products: any[] = [];
      try {
        // Hacer request al Product Service para obtener los productos
        const response = await axios.post(
          `${PRODUCT_SERVICE_URL}/products/batch`,
          { ids: productIds },
          { timeout: 5000 }
        );
        
        products = response.data.data || response.data || [];
      } catch (err: any) {
        logger.warn(`Error fetching products from Product Service: ${err.message || 'Unknown error'}`);
        // Si falla, retornar solo los IDs sin detalles
        products = productIds.map(id => ({ id, name: 'Producto no disponible' }));
      }

      // Combinar wishlist items con productos
      const wishlistWithProducts: WishlistItem[] = wishlistItems.map(item => {
        const product = products.find(p => p.id === item.product_id || p._id === item.product_id);
        
        return {
          id: item.id,
          productId: item.product_id,
          product: product || {
            id: item.product_id,
            sku: item.product_sku,
            name: 'Producto no disponible',
            our_price: 0,
            is_active: false,
          },
          addedAt: item.added_at,
        };
      });

      return {
        success: true,
        data: wishlistWithProducts,
      };
    } catch (error: any) {
      logger.error(`Error getting wishlist: ${error.message || 'Unknown error'}`);
      
      return {
        success: false,
        data: [],
        message: error.message || 'Error al obtener la lista de deseos',
      };
    }
  }
}
