/**
 * Caso de Uso: Eliminar de Lista de Deseos
 * 
 * Elimina un producto de la wishlist del usuario autenticado
 */

import { Wishlist } from '../shared/models/Wishlist';
import { logger } from '../shared/utils/logger';

export interface RemoveFromWishlistRequest {
  userId: number;
  productId: string;
}

export interface RemoveFromWishlistResponse {
  success: boolean;
  message?: string;
}

export class RemoveFromWishlist {
  async execute(request: RemoveFromWishlistRequest): Promise<RemoveFromWishlistResponse> {
    try {
      const { userId, productId } = request;

      logger.info(`Removing product ${productId} from wishlist for user ${userId}`);

      // Buscar y eliminar el item
      const deleted = await Wishlist.destroy({
        where: {
          user_id: userId,
          product_id: productId,
        },
      });

      if (deleted === 0) {
        logger.info(`Product ${productId} not found in wishlist`);
        return {
          success: true,
          message: 'El producto no estaba en tu lista de deseos',
        };
      }

      logger.info(`Product ${productId} removed from wishlist successfully`);

      return {
        success: true,
        message: 'Producto eliminado de tu lista de deseos',
      };
    } catch (error: any) {
      logger.error('Error removing from wishlist:', error);
      
      return {
        success: false,
        message: error.message || 'Error al eliminar de la lista de deseos',
      };
    }
  }
}
