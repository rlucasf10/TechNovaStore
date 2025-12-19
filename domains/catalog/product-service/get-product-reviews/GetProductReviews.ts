import { Request, Response } from 'express';
import { Review, Product } from '../shared/types';
import { logger } from '../shared/infrastructure/logger';

/**
 * Interfaz para los parámetros de consulta de reviews
 */
interface GetReviewsQuery {
  page?: string;
  limit?: string;
  rating?: string;
  sortBy?: 'newest' | 'oldest' | 'helpful' | 'rating_high' | 'rating_low';
}

/**
 * Obtiene las reviews de un producto con paginación y filtros
 */
export class GetProductReviews {
  async execute(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { 
        page = '1', 
        limit = '10', 
        rating,
        sortBy = 'newest'
      } = req.query as GetReviewsQuery;

      // Validar productId
      if (!productId) {
        res.status(400).json({ 
          success: false, 
          error: 'Se requiere el ID del producto' 
        });
        return;
      }

      // Verificar que el producto existe
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({ 
          success: false, 
          error: 'Producto no encontrado' 
        });
        return;
      }

      // Construir filtro
      const filter: any = { 
        productId,
        status: 'approved'
      };

      // Filtrar por rating si se especifica
      if (rating && !isNaN(parseInt(rating))) {
        filter.rating = parseInt(rating);
      }

      // Configurar ordenamiento
      let sort: any = { createdAt: -1 }; // Por defecto: más recientes primero
      switch (sortBy) {
        case 'oldest':
          sort = { createdAt: 1 };
          break;
        case 'helpful':
          sort = { helpfulCount: -1, createdAt: -1 };
          break;
        case 'rating_high':
          sort = { rating: -1, createdAt: -1 };
          break;
        case 'rating_low':
          sort = { rating: 1, createdAt: -1 };
          break;
      }

      // Paginación
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      // Obtener reviews y total
      const [reviews, total] = await Promise.all([
        Review.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Review.countDocuments(filter)
      ]);

      // Calcular estadísticas de rating
      const ratingStats = await Review.aggregate([
        { $match: { productId, status: 'approved' } },
        { 
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        }
      ]);

      // Calcular promedio de rating
      const avgRating = await Review.aggregate([
        { $match: { productId, status: 'approved' } },
        { 
          $group: {
            _id: null,
            average: { $avg: '$rating' },
            total: { $sum: 1 }
          }
        }
      ]);

      // Formatear distribución de ratings
      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratingStats.forEach(stat => {
        ratingDistribution[stat._id] = stat.count;
      });

      res.json({
        success: true,
        data: {
          reviews: reviews.map(review => ({
            ...review,
            id: review._id.toString(),
            _id: undefined
          })),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
            hasMore: skip + reviews.length < total
          },
          stats: {
            averageRating: avgRating[0]?.average || 0,
            totalReviews: avgRating[0]?.total || 0,
            ratingDistribution
          }
        }
      });

    } catch (error) {
      logger.error('Error al obtener reviews:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }
}
