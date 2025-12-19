import { Router } from 'express';
import { GetProductReviews } from '../../get-product-reviews/GetProductReviews';
import { CreateReview } from '../../create-review/CreateReview';
import { VoteReview } from '../../vote-review/VoteReview';
import { authMiddleware } from '../../shared/middleware/auth';

export const reviewRoutes = Router();

const getProductReviews = new GetProductReviews();
const createReview = new CreateReview();
const voteReview = new VoteReview();

/**
 * Rutas de reviews de productos
 * 
 * GET /products/:productId/reviews - Obtener reviews de un producto (público)
 * POST /products/:productId/reviews - Crear una review (requiere autenticación)
 * POST /reviews/:reviewId/vote - Votar una review (requiere autenticación)
 */

// Obtener reviews de un producto (público)
reviewRoutes.get(
  '/products/:productId/reviews',
  (req, res) => getProductReviews.execute(req, res)
);

// Crear una review (requiere autenticación)
// El middleware authMiddleware valida el token JWT y extrae la información del usuario
reviewRoutes.post(
  '/products/:productId/reviews',
  authMiddleware,
  (req, res) => createReview.execute(req, res)
);

// Votar una review (requiere autenticación)
// El middleware authMiddleware valida el token JWT y extrae la información del usuario
reviewRoutes.post(
  '/reviews/:reviewId/vote',
  authMiddleware,
  (req, res) => voteReview.execute(req, res)
);
