import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';
import { logger } from './logger';

/**
 * Invoice Number Generator
 * Generates sequential invoice numbers compliant with Spanish fiscal regulations
 * 
 * Spanish invoice numbering requirements:
 * - Must be sequential and correlative
 * - Cannot have gaps in the sequence
 * - Must include year for proper organization
 * - Format: YYYY-NNNNNNNN (Year-Sequential Number)
 */

export interface InvoiceNumberSequence {
  year: number;
  last_number: number;
  created_at: Date;
  updated_at: Date;
}

export class InvoiceNumberGenerator {
  private static readonly TABLE_NAME = 'invoice_sequences';
  // Lock timeout for database operations (currently not used but kept for future use)
  // private static readonly LOCK_TIMEOUT = 5000; // 5 seconds

  /**
   * Generates the next sequential invoice number
   * Thread-safe implementation using database locks
   */
  static async generateNext(): Promise<string> {
    const transaction = await sequelize.transaction();
    
    try {
      const currentYear = new Date().getFullYear();
      
      // Lock the sequence row for the current year to prevent race conditions
      const [sequence] = await sequelize.query(
        `
        SELECT year, last_number, created_at, updated_at 
        FROM ${this.TABLE_NAME} 
        WHERE year = :year 
        FOR UPDATE
        `,
        {
          replacements: { year: currentYear },
          type: QueryTypes.SELECT,
          transaction,
        }
      ) as InvoiceNumberSequence[];

      let nextNumber: number;

      if (sequence) {
        // Increment existing sequence
        nextNumber = sequence.last_number + 1;
        
        await sequelize.query(
          `
          UPDATE ${this.TABLE_NAME} 
          SET last_number = :nextNumber, updated_at = NOW() 
          WHERE year = :year
          `,
          {
            replacements: { nextNumber, year: currentYear },
            type: QueryTypes.UPDATE,
            transaction,
          }
        );
      } else {
        // Create new sequence for the year
        nextNumber = 1;
        
        await sequelize.query(
          `
          INSERT INTO ${this.TABLE_NAME} (year, last_number, created_at, updated_at) 
          VALUES (:year, :nextNumber, NOW(), NOW())
          `,
          {
            replacements: { year: currentYear, nextNumber },
            type: QueryTypes.INSERT,
            transaction,
          }
        );
      }

      await transaction.commit();

      const invoiceNumber = this.formatInvoiceNumber(currentYear, nextNumber);
      
      logger.info(`Generated invoice number: ${invoiceNumber}`, {
        year: currentYear,
        sequenceNumber: nextNumber,
      });

      return invoiceNumber;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to generate invoice number:', error);
      throw new Error('Failed to generate sequential invoice number');
    }
  }

  /**
   * Formats the invoice number according to Spanish standards
   */
  private static formatInvoiceNumber(year: number, sequenceNumber: number): string {
    // Format: YYYY-NNNNNNNN (8-digit sequence number with leading zeros)
    const paddedNumber = sequenceNumber.toString().padStart(8, '0');
    return `${year}-${paddedNumber}`;
  }

  /**
   * Gets the current sequence information for a year
   */
  static async getCurrentSequence(year?: number): Promise<InvoiceNumberSequence | null> {
    const targetYear = year || new Date().getFullYear();
    
    const [sequence] = await sequelize.query(
      `
      SELECT year, last_number, created_at, updated_at 
      FROM ${this.TABLE_NAME} 
      WHERE year = :year
      `,
      {
        replacements: { year: targetYear },
        type: QueryTypes.SELECT,
      }
    ) as InvoiceNumberSequence[];

    return sequence || null;
  }

  /**
   * Validates an invoice number format
   */
  static validateInvoiceNumber(invoiceNumber: string): boolean {
    // Spanish invoice number format: YYYY-NNNNNNNN
    const regex = /^\d{4}-\d{8}$/;
    
    if (!regex.test(invoiceNumber)) {
      return false;
    }

    const [yearStr, numberStr] = invoiceNumber.split('-');
    const year = parseInt(yearStr, 10);
    const number = parseInt(numberStr, 10);

    // Validate year (reasonable range)
    if (year < 2020 || year > new Date().getFullYear() + 1) {
      return false;
    }

    // Validate sequence number (must be positive)
    if (number < 1) {
      return false;
    }

    return true;
  }

  /**
   * Extracts year and sequence number from invoice number
   */
  static parseInvoiceNumber(invoiceNumber: string): { year: number; sequenceNumber: number } | null {
    if (!this.validateInvoiceNumber(invoiceNumber)) {
      return null;
    }

    const [yearStr, numberStr] = invoiceNumber.split('-');
    return {
      year: parseInt(yearStr, 10),
      sequenceNumber: parseInt(numberStr, 10),
    };
  }

  /**
   * Gets the next invoice number that would be generated (without actually generating it)
   */
  static async getNextInvoiceNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const sequence = await this.getCurrentSequence(currentYear);
    
    const nextNumber = sequence ? sequence.last_number + 1 : 1;
    return this.formatInvoiceNumber(currentYear, nextNumber);
  }

  /**
   * Resets the sequence for a year (DANGEROUS - use only for testing or year-end)
   */
  static async resetSequence(year: number, startNumber: number = 0): Promise<void> {
    if (year === new Date().getFullYear()) {
      throw new Error('Cannot reset sequence for current year in production');
    }

    await sequelize.query(
      `
      INSERT INTO ${this.TABLE_NAME} (year, last_number, created_at, updated_at) 
      VALUES (:year, :startNumber, NOW(), NOW())
      ON CONFLICT (year) 
      DO UPDATE SET last_number = :startNumber, updated_at = NOW()
      `,
      {
        replacements: { year, startNumber },
        type: QueryTypes.UPSERT,
      }
    );

    logger.warn(`Invoice sequence reset for year ${year} to ${startNumber}`, {
      year,
      startNumber,
    });
  }

  /**
   * Creates the invoice_sequences table if it doesn't exist
   */
  static async initializeSequenceTable(): Promise<void> {
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS ${this.TABLE_NAME} (
          year INTEGER PRIMARY KEY,
          last_number INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create index for performance
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_invoice_sequences_year 
        ON ${this.TABLE_NAME} (year)
      `);

      logger.info('Invoice sequence table initialized');
    } catch (error) {
      logger.error('Failed to initialize invoice sequence table:', error);
      throw error;
    }
  }

  /**
   * Gets statistics about invoice sequences
   */
  static async getSequenceStats(): Promise<{
    totalYears: number;
    currentYearSequence: number;
    totalInvoices: number;
    yearlyBreakdown: { year: number; count: number }[];
  }> {
    const stats = await sequelize.query(
      `
      SELECT 
        COUNT(*) as total_years,
        SUM(last_number) as total_invoices
      FROM ${this.TABLE_NAME}
      `,
      { type: QueryTypes.SELECT }
    ) as any[];

    const yearlyBreakdown = await sequelize.query(
      `
      SELECT year, last_number as count
      FROM ${this.TABLE_NAME}
      ORDER BY year DESC
      `,
      { type: QueryTypes.SELECT }
    ) as { year: number; count: number }[];

    const currentYear = new Date().getFullYear();
    const currentYearSequence = await this.getCurrentSequence(currentYear);

    return {
      totalYears: parseInt(stats[0]?.total_years || '0', 10),
      currentYearSequence: currentYearSequence?.last_number || 0,
      totalInvoices: parseInt(stats[0]?.total_invoices || '0', 10),
      yearlyBreakdown,
    };
  }
}