/**
 * Batch Processor Utility - Campaign Manager Service
 * 
 * Proporciona funcionalidad para procesar elementos en lotes.
 * Implementa los requisitos 3.6, 4.5.
 */

import { logger } from './logger'

/**
 * Opciones de configuración para el procesamiento por lotes
 */
export interface BatchProcessorOptions {
  /** Tamaño del lote (por defecto 100) */
  batchSize?: number
  
  /** Retraso entre lotes en milisegundos (por defecto 0) */
  delayBetweenBatches?: number
  
  /** Continuar procesando si un lote falla (por defecto false) */
  continueOnError?: boolean
  
  /** Callback para progreso */
  onProgress?: (processed: number, total: number) => void
  
  /** Callback para errores */
  onError?: (error: Error, batch: any[], batchIndex: number) => void
}

/**
 * Resultado del procesamiento por lotes
 */
export interface BatchProcessorResult<R> {
  /** Resultados exitosos */
  results: R[]
  
  /** Número total de elementos procesados */
  totalProcessed: number
  
  /** Número de elementos exitosos */
  successCount: number
  
  /** Número de elementos fallidos */
  failureCount: number
  
  /** Errores encontrados */
  errors: Array<{
    batchIndex: number
    error: Error
  }>
  
  /** Tiempo total de procesamiento en milisegundos */
  processingTime: number
}

/**
 * Clase para procesar elementos en lotes
 * Requisitos: 3.6, 4.5
 */
export class BatchProcessor {
  private readonly defaultBatchSize = 100
  private readonly defaultDelay = 0

  /**
   * Procesa una lista de elementos en lotes
   * 
   * @param items - Lista de elementos a procesar
   * @param processor - Función que procesa un lote de elementos
   * @param options - Opciones de configuración
   * @returns Resultado del procesamiento con estadísticas
   */
  async processBatch<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    options: BatchProcessorOptions = {}
  ): Promise<BatchProcessorResult<R>> {
    const startTime = Date.now()
    const batchSize = options.batchSize || this.defaultBatchSize
    const delay = options.delayBetweenBatches || this.defaultDelay
    const continueOnError = options.continueOnError || false

    const results: R[] = []
    const errors: Array<{ batchIndex: number; error: Error }> = []
    let successCount = 0
    let failureCount = 0

    // Dividir items en lotes
    const batches = this.createBatches(items, batchSize)
    const totalBatches = batches.length

    logger.info('Iniciando procesamiento por lotes', {
      totalItems: items.length,
      batchSize,
      totalBatches,
    })

    // Procesar cada lote
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      const batchIndex = i + 1

      try {
        logger.debug(`Procesando lote ${batchIndex}/${totalBatches}`, {
          batchSize: batch.length,
        })

        // Procesar el lote
        const batchResults = await processor(batch)
        results.push(...batchResults)
        successCount += batch.length

        // Notificar progreso
        if (options.onProgress) {
          options.onProgress(successCount + failureCount, items.length)
        }

        logger.debug(`Lote ${batchIndex}/${totalBatches} procesado exitosamente`, {
          itemsProcessed: batch.length,
        })

        // Aplicar retraso entre lotes si está configurado
        if (delay > 0 && i < batches.length - 1) {
          await this.sleep(delay)
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        
        logger.error(`Error procesando lote ${batchIndex}/${totalBatches}`, {
          error: err.message,
          stack: err.stack,
          batchSize: batch.length,
        })

        errors.push({ batchIndex, error: err })
        failureCount += batch.length

        // Notificar error
        if (options.onError) {
          options.onError(err, batch, batchIndex)
        }

        // Detener si no se debe continuar en caso de error
        if (!continueOnError) {
          logger.warn('Deteniendo procesamiento por lotes debido a error')
          break
        }
      }
    }

    const processingTime = Date.now() - startTime

    logger.info('Procesamiento por lotes completado', {
      totalProcessed: successCount + failureCount,
      successCount,
      failureCount,
      processingTime,
      errorsCount: errors.length,
    })

    return {
      results,
      totalProcessed: successCount + failureCount,
      successCount,
      failureCount,
      errors,
      processingTime,
    }
  }

  /**
   * Procesa elementos en lotes de forma secuencial con reintentos
   * 
   * @param items - Lista de elementos a procesar
   * @param processor - Función que procesa un elemento individual
   * @param options - Opciones de configuración
   * @param maxRetries - Número máximo de reintentos por elemento
   * @returns Resultado del procesamiento
   */
  async processBatchWithRetry<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: BatchProcessorOptions = {},
    maxRetries: number = 3
  ): Promise<BatchProcessorResult<R>> {
    const batchProcessor = async (batch: T[]): Promise<R[]> => {
      const results: R[] = []

      for (const item of batch) {
        let lastError: Error | null = null
        let attempt = 0

        while (attempt <= maxRetries) {
          try {
            const result = await processor(item)
            results.push(result)
            break
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error))
            attempt++

            if (attempt <= maxRetries) {
              logger.warn(`Reintentando procesamiento (intento ${attempt}/${maxRetries})`, {
                error: lastError.message,
              })
              await this.sleep(1000 * attempt) // Backoff exponencial
            }
          }
        }

        if (lastError && attempt > maxRetries) {
          throw lastError
        }
      }

      return results
    }

    return this.processBatch(items, batchProcessor, options)
  }

  /**
   * Procesa elementos en lotes de forma paralela
   * 
   * @param items - Lista de elementos a procesar
   * @param processor - Función que procesa un lote de elementos
   * @param options - Opciones de configuración
   * @param concurrency - Número de lotes a procesar en paralelo
   * @returns Resultado del procesamiento
   */
  async processBatchParallel<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    options: BatchProcessorOptions = {},
    concurrency: number = 3
  ): Promise<BatchProcessorResult<R>> {
    const startTime = Date.now()
    const batchSize = options.batchSize || this.defaultBatchSize

    const results: R[] = []
    const errors: Array<{ batchIndex: number; error: Error }> = []
    let successCount = 0
    let failureCount = 0

    // Dividir items en lotes
    const batches = this.createBatches(items, batchSize)
    const totalBatches = batches.length

    logger.info('Iniciando procesamiento paralelo por lotes', {
      totalItems: items.length,
      batchSize,
      totalBatches,
      concurrency,
    })

    // Procesar lotes en paralelo con límite de concurrencia
    for (let i = 0; i < batches.length; i += concurrency) {
      const batchGroup = batches.slice(i, i + concurrency)
      const batchPromises = batchGroup.map(async (batch, index) => {
        const batchIndex = i + index + 1

        try {
          const batchResults = await processor(batch)
          return { success: true as const, results: batchResults, batchIndex }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          return { success: false as const, error: err, batchIndex }
        }
      })

      const batchGroupResults = await Promise.all(batchPromises)

      for (const result of batchGroupResults) {
        if (result.success && result.results) {
          results.push(...result.results)
          successCount += result.results.length
        } else if (!result.success && result.error) {
          errors.push({ batchIndex: result.batchIndex, error: result.error })
          failureCount += batchSize
        }
      }

      // Notificar progreso
      if (options.onProgress) {
        options.onProgress(successCount + failureCount, items.length)
      }
    }

    const processingTime = Date.now() - startTime

    logger.info('Procesamiento paralelo por lotes completado', {
      totalProcessed: successCount + failureCount,
      successCount,
      failureCount,
      processingTime,
      errorsCount: errors.length,
    })

    return {
      results,
      totalProcessed: successCount + failureCount,
      successCount,
      failureCount,
      errors,
      processingTime,
    }
  }

  /**
   * Divide una lista en lotes del tamaño especificado
   * 
   * @param items - Lista de elementos
   * @param batchSize - Tamaño de cada lote
   * @returns Array de lotes
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }

    return batches
  }

  /**
   * Pausa la ejecución por un tiempo determinado
   * 
   * @param ms - Milisegundos a esperar
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Calcula el tamaño óptimo de lote basado en el número de elementos
   * 
   * @param totalItems - Número total de elementos
   * @param maxBatchSize - Tamaño máximo de lote (por defecto 100)
   * @returns Tamaño de lote recomendado
   */
  calculateOptimalBatchSize(totalItems: number, maxBatchSize: number = 100): number {
    if (totalItems <= maxBatchSize) {
      return totalItems
    }

    // Intentar dividir en lotes de tamaño similar
    const numBatches = Math.ceil(totalItems / maxBatchSize)
    return Math.ceil(totalItems / numBatches)
  }
}

/**
 * Instancia singleton del procesador por lotes
 */
export const batchProcessor = new BatchProcessor()

export default batchProcessor
