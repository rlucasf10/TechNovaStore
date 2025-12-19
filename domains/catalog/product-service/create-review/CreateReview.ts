import { Request, Response } from 'express';
import { Review, Product, IReview } from '../shared/types';
import { logger } from '../shared/infrastructure/logger';

/**
 * Interfaz para el cuerpo de la solicitud de crear review
 */
interface CreateReviewBody {
  rating: number;
  title: string;
  comment: string;
  images?: { url: string; thumbnailUrl?: string }[];
}

/**
 * Crea una nueva review para un producto
 */
export class CreateReview {
  async execute(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { rating, title, comment, images = [] } = req.body as CreateReviewBody;
      
      // Obtener información del usuario del token JWT
      const user = (req as any).user;
      
      if (!user || !user.id) {
        res.status(401).json({ 
          success: false, 
          error: 'Se requiere autenticación para crear una review' 
        });
        return;
      }

      // Validar productId
      if (!productId) {
        res.status(400).json({ 
          success: false, 
          error: 'Se requiere el ID del producto' 
        });
        return;
      }

      // Validar campos requeridos
      if (!rating || rating < 1 || rating > 5) {
        res.status(400).json({ 
          success: false, 
          error: 'El rating debe estar entre 1 y 5' 
        });
        return;
      }

      if (!title || title.trim().length < 5) {
        res.status(400).json({ 
          success: false, 
          error: 'El título debe tener al menos 5 caracteres' 
        });
        return;
      }

      if (!comment || comment.trim().length < 10) {
        res.status(400).json({ 
          success: false, 
          error: 'El comentario debe tener al menos 10 caracteres' 
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

      // Verificar si el usuario ya tiene una review para este producto
      const existingReview = await Review.findOne({ 
        productId, 
        userId: user.id 
      });

      if (existingReview) {
        res.status(409).json({ 
          success: false, 
          error: 'Ya has dejado una review para este producto' 
        });
        return;
      }

      // Crear la review
      const review: IReview = new Review({
        productId,
        userId: user.id,
        userName: user.name || user.firstName || 'Usuario',
        userAvatar: user.avatar,
        rating: Math.round(rating),
        title: title.trim(),
        comment: comment.trim(),
        images: images.map(img => ({
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          uploadedAt: new Date()
        })),
        verified: false, // TODO: Verificar si el usuario compró el producto
        status: 'approved', // Auto-aprobar por ahora
        helpfulCount: 0,
        notHelpfulCount: 0,
        votes: []
      });

      await review.save();

      // Actualizar estadísticas del producto
      await this.updateProductRating(productId);

      logger.info('Review creada exitosamente', { 
        reviewId: (review._id as any).toString(), 
        productId, 
        userId: user.id 
      });

      res.status(201).json({
        success: true,
        data: {
          ...review.toJSON(),
          id: (review._id as any).toString()
        },
        message: 'Review creada exitosamente'
      });

    } catch (error: any) {
      // Manejar error de duplicado
      if (error.code === 11000) {
        res.status(409).json({ 
          success: false, 
          error: 'Ya has dejado una review para este producto' 
        });
        return;
      }

      logger.error('Error al crear review:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  /**
   * Actualiza el rating promedio del producto
   */
  private async updateProductRating(productId: string): Promise<void> {
    try {
      const stats = await Review.aggregate([
        { $match: { productId, status: 'approved' } },
        { 
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]);

      if (stats.length > 0) {
        await Product.findByIdAndUpdate(productId, {
          rating: Math.round(stats[0].averageRating * 10) / 10,
          review_count: stats[0].totalReviews
        });
      }
    } catch (error) {
      logger.error('Error al actualizar rating del producto:', error);
    }
  }
}
