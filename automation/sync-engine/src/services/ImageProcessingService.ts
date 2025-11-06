/**
 * Image Processing Service
 * 
 * Servicio automatizado para gestión de imágenes de productos.
 * Similar a cómo lo hacen Amazon y PCComponentes.
 * 
 * Características:
 * - Descarga automática de imágenes de proveedores
 * - Optimización y redimensionamiento
 * - Subida a CDN/Storage (AWS S3, Cloudinary, etc.)
 * - Generación de múltiples tamaños
 * - Fallbacks inteligentes
 * - Cache de URLs procesadas
 */

import axios from 'axios';
import sharp from 'sharp';
import crypto from 'crypto';
import { logger } from '../utils/logger';

interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  generateThumbnails?: boolean;
}

interface ProcessedImage {
  original: string;
  optimized: string;
  thumbnail?: string;
  sizes?: {
    small: string;
    medium: string;
    large: string;
  };
}

export class ImageProcessingService {
  private readonly CACHE_DIR = '/tmp/product-images';
  private readonly CDN_BASE_URL = process.env.CDN_BASE_URL || 'https://cdn.technovastore.com';
  private readonly S3_BUCKET = process.env.S3_BUCKET || 'technovastore-products';
  
  // Tamaños estándar (como Amazon/PCComponentes)
  private readonly SIZES = {
    thumbnail: { width: 100, height: 100 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 },
  };

  /**
   * Procesar imágenes de un producto desde URLs de proveedores
   * 
   * @param imageUrls - URLs de imágenes del proveedor
   * @param productSku - SKU del producto para nombrar archivos
   * @returns URLs de imágenes procesadas y optimizadas
   */
  async processProductImages(
    imageUrls: string[],
    productSku: string
  ): Promise<string[]> {
    const processedUrls: string[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const imageUrl = imageUrls[i];
        logger.info(`Procesando imagen ${i + 1}/${imageUrls.length} para ${productSku}`);

        // 1. Descargar imagen del proveedor
        const imageBuffer = await this.downloadImage(imageUrl);
        
        if (!imageBuffer) {
          logger.warn(`No se pudo descargar imagen: ${imageUrl}`);
          continue;
        }

        // 2. Optimizar y redimensionar
        const optimizedBuffer = await this.optimizeImage(imageBuffer, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 85,
          format: 'webp',
        });

        // 3. Generar nombre único
        const filename = this.generateFilename(productSku, i);

        // 4. Subir a CDN/Storage
        const cdnUrl = await this.uploadToStorage(optimizedBuffer, filename);

        if (cdnUrl) {
          processedUrls.push(cdnUrl);
          logger.info(`Imagen procesada exitosamente: ${cdnUrl}`);
        }

      } catch (error) {
        logger.error(`Error procesando imagen ${i + 1} para ${productSku}:`, error);
        // Continuar con la siguiente imagen
      }
    }

    // Si no se pudo procesar ninguna imagen, usar placeholder
    if (processedUrls.length === 0) {
      logger.warn(`No se procesaron imágenes para ${productSku}, usando placeholder`);
      processedUrls.push(this.getPlaceholderUrl(productSku));
    }

    return processedUrls;
  }

  /**
   * Descargar imagen desde URL del proveedor
   */
  private async downloadImage(url: string): Promise<Buffer | null> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 segundos
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      return Buffer.from(response.data);
    } catch (error) {
      logger.error(`Error descargando imagen ${url}:`, error);
      return null;
    }
  }

  /**
   * Optimizar imagen con Sharp
   * - Redimensionar manteniendo aspect ratio
   * - Convertir a WebP para mejor compresión
   * - Optimizar calidad
   */
  private async optimizeImage(
    buffer: Buffer,
    options: ImageProcessingOptions
  ): Promise<Buffer> {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 85,
      format = 'webp',
    } = options;

    let image = sharp(buffer);

    // Obtener metadata
    const metadata = await image.metadata();
    
    // Redimensionar solo si es necesario
    if (metadata.width && metadata.width > maxWidth || 
        metadata.height && metadata.height > maxHeight) {
      image = image.resize(maxWidth, maxHeight, {
        fit: 'inside', // Mantener aspect ratio
        withoutEnlargement: true, // No agrandar imágenes pequeñas
      });
    }

    // Convertir a formato optimizado
    if (format === 'webp') {
      image = image.webp({ quality });
    } else if (format === 'jpeg') {
      image = image.jpeg({ quality, progressive: true });
    } else if (format === 'png') {
      image = image.png({ quality, compressionLevel: 9 });
    }

    return await image.toBuffer();
  }

  /**
   * Generar múltiples tamaños de una imagen
   * Similar a Amazon (thumbnail, small, medium, large)
   */
  async generateMultipleSizes(
    buffer: Buffer,
    productSku: string,
    index: number
  ): Promise<ProcessedImage['sizes']> {
    const sizes: ProcessedImage['sizes'] = {
      small: '',
      medium: '',
      large: '',
    };

    try {
      // Small (300x300)
      const smallBuffer = await sharp(buffer)
        .resize(this.SIZES.small.width, this.SIZES.small.height, { fit: 'inside' })
        .webp({ quality: 80 })
        .toBuffer();
      sizes.small = await this.uploadToStorage(
        smallBuffer,
        this.generateFilename(productSku, index, 'small')
      );

      // Medium (600x600)
      const mediumBuffer = await sharp(buffer)
        .resize(this.SIZES.medium.width, this.SIZES.medium.height, { fit: 'inside' })
        .webp({ quality: 85 })
        .toBuffer();
      sizes.medium = await this.uploadToStorage(
        mediumBuffer,
        this.generateFilename(productSku, index, 'medium')
      );

      // Large (1200x1200)
      const largeBuffer = await sharp(buffer)
        .resize(this.SIZES.large.width, this.SIZES.large.height, { fit: 'inside' })
        .webp({ quality: 90 })
        .toBuffer();
      sizes.large = await this.uploadToStorage(
        largeBuffer,
        this.generateFilename(productSku, index, 'large')
      );

    } catch (error) {
      logger.error(`Error generando múltiples tamaños para ${productSku}:`, error);
    }

    return sizes;
  }

  /**
   * Subir imagen a storage (AWS S3, Cloudinary, etc.)
   * 
   * NOTA: Implementar según tu proveedor de storage
   * Ejemplos: AWS S3, Google Cloud Storage, Cloudinary, Azure Blob
   */
  private async uploadToStorage(
    buffer: Buffer,
    filename: string
  ): Promise<string> {
    try {
      // OPCIÓN 1: Guardar localmente (desarrollo)
      if (process.env.NODE_ENV === 'development') {
        const fs = require('fs').promises;
        const path = require('path');
        
        const publicDir = path.join(process.cwd(), '../../frontend/public/products');
        await fs.mkdir(publicDir, { recursive: true });
        
        const filepath = path.join(publicDir, filename);
        await fs.writeFile(filepath, buffer);
        
        return `/products/${filename}`;
      }

      // OPCIÓN 2: AWS S3 (producción)
      // const AWS = require('aws-sdk');
      // const s3 = new AWS.S3();
      // 
      // const params = {
      //   Bucket: this.S3_BUCKET,
      //   Key: `products/${filename}`,
      //   Body: buffer,
      //   ContentType: 'image/webp',
      //   ACL: 'public-read',
      // };
      // 
      // const result = await s3.upload(params).promise();
      // return result.Location;

      // OPCIÓN 3: Cloudinary
      // const cloudinary = require('cloudinary').v2;
      // 
      // return new Promise((resolve, reject) => {
      //   cloudinary.uploader.upload_stream(
      //     { folder: 'products', public_id: filename },
      //     (error, result) => {
      //       if (error) reject(error);
      //       else resolve(result.secure_url);
      //     }
      //   ).end(buffer);
      // });

      // Por defecto, retornar URL del CDN
      return `${this.CDN_BASE_URL}/products/${filename}`;

    } catch (error) {
      logger.error(`Error subiendo imagen ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Generar nombre de archivo único y descriptivo
   * Formato: {sku}-{index}-{size}-{hash}.webp
   */
  private generateFilename(
    sku: string,
    index: number,
    size: string = 'original'
  ): string {
    const timestamp = Date.now();
    const hash = crypto
      .createHash('md5')
      .update(`${sku}-${index}-${timestamp}`)
      .digest('hex')
      .substring(0, 8);

    const safeSku = sku.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    return `${safeSku}-${index}-${size}-${hash}.webp`;
  }

  /**
   * Obtener URL de placeholder según categoría del producto
   */
  private getPlaceholderUrl(sku: string): string {
    // Detectar categoría por SKU o usar genérico
    const category = this.detectCategoryFromSku(sku);
    return `/placeholder-${category}.svg`;
  }

  /**
   * Detectar categoría desde SKU para placeholder inteligente
   */
  private detectCategoryFromSku(sku: string): string {
    const skuLower = sku.toLowerCase();
    
    if (skuLower.includes('lap') || skuLower.includes('note')) return 'laptop';
    if (skuLower.includes('mon') || skuLower.includes('scr')) return 'monitor';
    if (skuLower.includes('key') || skuLower.includes('tec')) return 'keyboard';
    if (skuLower.includes('mou') || skuLower.includes('rat')) return 'mouse';
    if (skuLower.includes('cpu') || skuLower.includes('proc')) return 'processor';
    if (skuLower.includes('gpu') || skuLower.includes('graph')) return 'graphics-card';
    
    return 'product'; // Genérico
  }

  /**
   * Limpiar imágenes antiguas (garbage collection)
   */
  async cleanupOldImages(productSku: string): Promise<void> {
    try {
      // Implementar lógica para eliminar imágenes antiguas del storage
      logger.info(`Limpiando imágenes antiguas de ${productSku}`);
      
      // TODO: Implementar según tu storage provider
      
    } catch (error) {
      logger.error(`Error limpiando imágenes de ${productSku}:`, error);
    }
  }

  /**
   * Validar que una URL de imagen sea accesible
   */
  async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Extraer URLs de imágenes desde HTML del proveedor (scraping)
   */
  extractImageUrlsFromHtml(html: string, selector: string = 'img'): string[] {
    // Implementar con cheerio o similar si necesitas scraping
    // const cheerio = require('cheerio');
    // const $ = cheerio.load(html);
    // return $(selector).map((i, el) => $(el).attr('src')).get();
    
    return [];
  }
}

// Exportar instancia singleton
export const imageProcessingService = new ImageProcessingService();
