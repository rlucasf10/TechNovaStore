import { Request, Response } from 'express';
import { Review } from '../shared/types';
import { logger } from '../shared/infrastructure/logger';

/**
 * Interfaz para el cuerpo de la solicitud de votar review
 */
interface VoteReviewBody {
  helpful: boolean;
}

/**
 * Registra un voto de utilidad para una review
 */
export class VoteReview {
  async execute(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { helpful } = req.body as VoteReviewBody;
      
      // Obtener información del usuario del token JWT
      const user = (req as any).user;
      
      if (!user || !user.id) {
        res.status(401).json({ 
          success: false, 
          error: 'Se requiere autenticación para votar' 
        });
        return;
      }

      // Validar reviewId
      if (!reviewId) {
        res.status(400).json({ 
          success: false, 
          error: 'Se requiere el ID de la review' 
        });
        return;
      }

      // Validar helpful
      if (typeof helpful !== 'boolean') {
        res.status(400).json({ 
          success: false, 
          error: 'El campo helpful debe ser un booleano' 
        });
        return;
      }

      // Buscar la review
      const review = await Review.findById(reviewId);
      if (!review) {
        res.status(404).json({ 
          success: false, 
          error: 'Review no encontrada' 
        });
        return;
      }

      // No permitir votar en tu propia review
      if (review.userId === user.id) {
        res.status(403).json({ 
          success: false, 
          error: 'No puedes votar en tu propia review' 
        });
        return;
      }

      // Buscar si el usuario ya votó
      const existingVoteIndex = review.votes.findIndex(v => v.userId === user.id);
      
      if (existingVoteIndex !== -1) {
        const existingVote = review.votes[existingVoteIndex];
        
        // Si el voto es el mismo, eliminarlo (toggle)
        if (existingVote.helpful === helpful) {
          review.votes.splice(existingVoteIndex, 1);
          if (helpful) {
            review.helpfulCount = Math.max(0, review.helpfulCount - 1);
          } else {
            review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1);
          }
        } else {
          // Cambiar el voto
          if (existingVote.helpful) {
            review.helpfulCount = Math.max(0, review.helpfulCount - 1);
            review.notHelpfulCount += 1;
          } else {
            review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1);
            review.helpfulCount += 1;
          }
          review.votes[existingVoteIndex].helpful = helpful;
          review.votes[existingVoteIndex].createdAt = new Date();
        }
      } else {
        // Agregar nuevo voto
        review.votes.push({
          userId: user.id,
          helpful,
          createdAt: new Date()
        });
        
        if (helpful) {
          review.helpfulCount += 1;
        } else {
          review.notHelpfulCount += 1;
        }
      }

      await review.save();

      logger.info('Voto registrado exitosamente', { 
        reviewId, 
        userId: user.id,
        helpful 
      });

      res.json({
        success: true,
        data: {
          helpfulCount: review.helpfulCount,
          notHelpfulCount: review.notHelpfulCount,
          userVote: review.votes.find(v => v.userId === user.id)?.helpful ?? null
        },
        message: 'Voto registrado exitosamente'
      });

    } catch (error) {
      logger.error('Error al votar review:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }
}
