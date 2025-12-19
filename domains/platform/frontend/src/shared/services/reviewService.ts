/**
 * Servicio de Reviews de Productos
 * 
 * Maneja todas las operaciones relacionadas con reviews de productos:
 * - Obtener reviews de un producto
 * - Crear una nueva review
 * - Votar una review (útil/no útil)
 */

import { api } from '@/lib/api';

/**
 * Interfaz para una imagen de review
 */
export interface ReviewImage {
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
}

/**
 * Interfaz para una review de producto
 */
export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  images: ReviewImage[];
  verified: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  // Voto del usuario actual (si está autenticado)
  userVote?: boolean | null;
}

/**
 * Interfaz para la distribución de ratings
 */
export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

/**
 * Interfaz para las estadísticas de reviews
 */
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
}

/**
 * Interfaz para la paginación de reviews
 */
export interface ReviewPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Interfaz para la respuesta de obtener reviews
 */
export interface GetReviewsResponse {
  success: boolean;
  data: {
    reviews: Review[];
    pagination: ReviewPagination;
    stats: ReviewStats;
  };
}

/**
 * Interfaz para los parámetros de obtener reviews
 */
export interface GetReviewsParams {
  page?: number;
  limit?: number;
  rating?: number;
  sortBy?: 'newest' | 'oldest' | 'helpful' | 'rating_high' | 'rating_low';
}

/**
 * Interfaz para crear una review
 */
export interface CreateReviewData {
  rating: number;
  title: string;
  comment: string;
  images?: { url: string; thumbnailUrl?: string }[];
}

/**
 * Interfaz para la respuesta de crear review
 */
export interface CreateReviewResponse {
  success: boolean;
  data: Review;
  message: string;
}

/**
 * Interfaz para la respuesta de votar review
 */
export interface VoteReviewResponse {
  success: boolean;
  data: {
    helpfulCount: number;
    notHelpfulCount: number;
    userVote: boolean | null;
  };
  message: string;
}

/**
 * Servicio de Reviews
 */
class ReviewService {
  /**
   * Obtiene las reviews de un producto
   */
  async getProductReviews(
    productId: string,
    params: GetReviewsParams = {}
  ): Promise<GetReviewsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.rating) queryParams.append('rating', params.rating.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);

    const queryString = queryParams.toString();
    const url = `/products/${productId}/reviews${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<GetReviewsResponse>(url);
    return response.data;
  }

  /**
   * Crea una nueva review para un producto
   */
  async createReview(
    productId: string,
    data: CreateReviewData
  ): Promise<CreateReviewResponse> {
    const response = await api.post<CreateReviewResponse>(
      `/products/${productId}/reviews`,
      data
    );
    return response.data;
  }

  /**
   * Vota una review como útil o no útil
   */
  async voteReview(
    reviewId: string,
    helpful: boolean
  ): Promise<VoteReviewResponse> {
    const response = await api.post<VoteReviewResponse>(
      `/reviews/${reviewId}/vote`,
      { helpful }
    );
    return response.data;
  }
}

// Exportar instancia singleton
export const reviewService = new ReviewService();
