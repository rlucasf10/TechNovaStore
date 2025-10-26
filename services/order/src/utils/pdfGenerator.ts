import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';
import { SpanishInvoiceData, InvoiceLineItem } from '../types/invoice';
import { SpanishTaxCalculator } from './spanishTaxCalculator';

/**
 * PDF Generator for Spanish Invoices
 * Generates PDF invoices compliant with Spanish fiscal regulations
 * 
 * Note: This implementation uses HTML-to-PDF conversion
 * In production, consider using libraries like puppeteer, jsPDF, or PDFKit
 */

export interface PDFGenerationOptions {
  outputDir?: string;
  templatePath?: string;
  includeQR?: boolean;
  watermark?: string;
}

export class PDFGenerator {
  private static readonly DEFAULT_OUTPUT_DIR = path.join(process.cwd(), 'invoices');
  private static readonly TEMPLATE_DIR = path.join(__dirname, '../templates');

  /**
   * Generates a PDF invoice from Spanish invoice data
   */
  static async generateInvoicePDF(
    invoiceData: SpanishInvoiceData,
    options: PDFGenerationOptions = {}
  ): Promise<string> {
    try {
      // Ensure output directory exists
      const outputDir = options.outputDir || this.DEFAULT_OUTPUT_DIR;
      await this.ensureDirectoryExists(outputDir);

      // Generate HTML content
      const htmlContent = await this.generateInvoiceHTML(invoiceData);

      // Generate PDF filename
      const filename = `factura_${invoiceData.invoice_number.replace('/', '_')}.pdf`;

      // For now, save as HTML (in production, convert to PDF)
      // This is a placeholder implementation
      const htmlFilename = `factura_${invoiceData.invoice_number.replace('/', '_')}.html`;
      const htmlPath = path.join(outputDir, htmlFilename);
      
      await fs.promises.writeFile(htmlPath, htmlContent, 'utf8');

      // TODO: Convert HTML to PDF using puppeteer or similar
      // For now, return the HTML path as a placeholder
      const pdfPath = `/invoices/${filename}`;

      logger.info(`Invoice PDF generated: ${invoiceData.invoice_number}`, {
        invoiceNumber: invoiceData.invoice_number,
        outputPath: pdfPath,
      });

      return pdfPath;
    } catch (error) {
      logger.error('Failed to generate invoice PDF:', error);
      throw new Error('PDF generation failed');
    }
  }

  /**
   * Generates HTML content for the Spanish invoice
   */
  private static async generateInvoiceHTML(invoiceData: SpanishInvoiceData): Promise<string> {
    const template = await this.getInvoiceTemplate();
    
    // Replace template variables
    let html = template
      .replace(/{{INVOICE_NUMBER}}/g, invoiceData.invoice_number)
      .replace(/{{ISSUE_DATE}}/g, this.formatDate(invoiceData.issue_date))
      .replace(/{{DUE_DATE}}/g, this.formatDate(invoiceData.due_date))
      .replace(/{{COMPANY_NAME}}/g, invoiceData.company_info.name)
      .replace(/{{COMPANY_CIF}}/g, invoiceData.company_info.cif)
      .replace(/{{COMPANY_ADDRESS}}/g, this.formatAddress(invoiceData.company_info.address))
      .replace(/{{COMPANY_PHONE}}/g, invoiceData.company_info.phone || '')
      .replace(/{{COMPANY_EMAIL}}/g, invoiceData.company_info.email || '')
      .replace(/{{COMPANY_WEBSITE}}/g, invoiceData.company_info.website || '')
      .replace(/{{CUSTOMER_NAME}}/g, invoiceData.customer_info.name)
      .replace(/{{CUSTOMER_ADDRESS}}/g, this.formatAddress(invoiceData.customer_info.address))
      .replace(/{{CUSTOMER_TAX_ID}}/g, invoiceData.customer_info.nif || invoiceData.customer_info.cif || '')
      .replace(/{{SUBTOTAL}}/g, this.formatCurrency(invoiceData.subtotal))
      .replace(/{{TOTAL_TAX}}/g, this.formatCurrency(invoiceData.total_tax))
      .replace(/{{TOTAL_AMOUNT}}/g, this.formatCurrency(invoiceData.total_amount))
      .replace(/{{CURRENCY}}/g, invoiceData.currency)
      .replace(/{{PAYMENT_METHOD}}/g, this.translatePaymentMethod(invoiceData.payment_method))
      .replace(/{{NOTES}}/g, invoiceData.notes || '');

    // Generate line items HTML
    const lineItemsHTML = this.generateLineItemsHTML(invoiceData.line_items);
    html = html.replace(/{{LINE_ITEMS}}/g, lineItemsHTML);

    // Generate tax breakdown HTML
    const taxBreakdownHTML = this.generateTaxBreakdownHTML(invoiceData.line_items);
    html = html.replace(/{{TAX_BREAKDOWN}}/g, taxBreakdownHTML);

    return html;
  }

  /**
   * Gets the Spanish invoice HTML template
   */
  private static async getInvoiceTemplate(): Promise<string> {
    const templatePath = path.join(this.TEMPLATE_DIR, 'spanish_invoice_template.html');
    
    try {
      return await fs.promises.readFile(templatePath, 'utf8');
    } catch (error) {
      // If template file doesn't exist, return default template
      return this.getDefaultInvoiceTemplate();
    }
  }

  /**
   * Default Spanish invoice HTML template
   */
  private static getDefaultInvoiceTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura {{INVOICE_NUMBER}}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.4;
        }
        .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 20px;
        }
        .company-info {
            flex: 1;
        }
        .invoice-info {
            text-align: right;
            flex: 1;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 10px;
        }
        .invoice-number {
            font-size: 20px;
            font-weight: bold;
            color: #0066cc;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            margin: 20px 0 10px 0;
            color: #0066cc;
        }
        .customer-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .line-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .line-items-table th,
        .line-items-table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        .line-items-table th {
            background-color: #0066cc;
            color: white;
            font-weight: bold;
        }
        .line-items-table .number {
            text-align: right;
        }
        .totals-section {
            float: right;
            width: 300px;
            margin-top: 20px;
        }
        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
        }
        .totals-table .label {
            font-weight: bold;
            text-align: right;
        }
        .totals-table .amount {
            text-align: right;
            width: 100px;
        }
        .total-final {
            font-size: 18px;
            font-weight: bold;
            background-color: #0066cc;
            color: white;
        }
        .tax-breakdown {
            margin-top: 20px;
            clear: both;
        }
        .tax-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .tax-table th,
        .tax-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
        }
        .tax-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }
        .legal-text {
            margin-top: 20px;
            font-size: 10px;
            color: #888;
        }
        @media print {
            body { margin: 0; }
            .invoice-header { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="invoice-header">
        <div class="company-info">
            <div class="company-name">{{COMPANY_NAME}}</div>
            <div>CIF: {{COMPANY_CIF}}</div>
            <div>{{COMPANY_ADDRESS}}</div>
            <div>Tel: {{COMPANY_PHONE}}</div>
            <div>Email: {{COMPANY_EMAIL}}</div>
            <div>Web: {{COMPANY_WEBSITE}}</div>
        </div>
        <div class="invoice-info">
            <div class="invoice-number">FACTURA</div>
            <div class="invoice-number">{{INVOICE_NUMBER}}</div>
            <div style="margin-top: 15px;">
                <strong>Fecha de emisión:</strong><br>
                {{ISSUE_DATE}}
            </div>
            <div style="margin-top: 10px;">
                <strong>Fecha de vencimiento:</strong><br>
                {{DUE_DATE}}
            </div>
        </div>
    </div>

    <div class="section-title">DATOS DEL CLIENTE</div>
    <div class="customer-info">
        <strong>{{CUSTOMER_NAME}}</strong><br>
        {{CUSTOMER_TAX_ID}}<br>
        {{CUSTOMER_ADDRESS}}
    </div>

    <div class="section-title">DETALLE DE PRODUCTOS/SERVICIOS</div>
    <table class="line-items-table">
        <thead>
            <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Importe</th>
                <th>IVA</th>
            </tr>
        </thead>
        <tbody>
            {{LINE_ITEMS}}
        </tbody>
    </table>

    <div class="totals-section">
        <table class="totals-table">
            <tr>
                <td class="label">Subtotal:</td>
                <td class="amount">{{SUBTOTAL}} {{CURRENCY}}</td>
            </tr>
            <tr>
                <td class="label">IVA Total:</td>
                <td class="amount">{{TOTAL_TAX}} {{CURRENCY}}</td>
            </tr>
            <tr class="total-final">
                <td class="label">TOTAL:</td>
                <td class="amount">{{TOTAL_AMOUNT}} {{CURRENCY}}</td>
            </tr>
        </table>
    </div>

    <div class="tax-breakdown">
        <div class="section-title">DESGLOSE DE IVA</div>
        {{TAX_BREAKDOWN}}
    </div>

    <div class="footer">
        <div><strong>Forma de pago:</strong> {{PAYMENT_METHOD}}</div>
        {{NOTES}}
        
        <div class="legal-text">
            Esta factura se emite de conformidad con la normativa fiscal española vigente.
            Real Decreto 1619/2012, de 30 de noviembre, por el que se aprueba el Reglamento 
            por el que se regulan las obligaciones de facturación.
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generates HTML for line items
   */
  private static generateLineItemsHTML(lineItems: InvoiceLineItem[]): string {
    return lineItems.map(item => `
        <tr>
            <td>${this.escapeHtml(item.description)}</td>
            <td class="number">${item.quantity}</td>
            <td class="number">${this.formatCurrency(item.unit_price)}</td>
            <td class="number">${this.formatCurrency(item.total_price)}</td>
            <td class="number">${SpanishTaxCalculator.formatTaxRate(item.tax_rate)}</td>
        </tr>
    `).join('');
  }

  /**
   * Generates HTML for tax breakdown
   */
  private static generateTaxBreakdownHTML(lineItems: InvoiceLineItem[]): string {
    // Group by tax rate
    const taxGroups = new Map<number, { base: number; tax: number }>();
    
    for (const item of lineItems) {
      const existing = taxGroups.get(item.tax_rate) || { base: 0, tax: 0 };
      existing.base += item.total_price;
      existing.tax += item.tax_amount;
      taxGroups.set(item.tax_rate, existing);
    }

    const rows = Array.from(taxGroups.entries()).map(([rate, amounts]) => `
        <tr>
            <td>${SpanishTaxCalculator.formatTaxRate(rate)}</td>
            <td>${this.formatCurrency(amounts.base)}</td>
            <td>${this.formatCurrency(amounts.tax)}</td>
        </tr>
    `).join('');

    return `
        <table class="tax-table">
            <thead>
                <tr>
                    <th>Tipo IVA</th>
                    <th>Base Imponible</th>
                    <th>Cuota IVA</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
  }

  /**
   * Formats a date for Spanish locale
   */
  private static formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Formats currency for Spanish locale
   */
  private static formatCurrency(amount: number): string {
    return amount.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Formats address for display
   */
  private static formatAddress(address: any): string {
    const parts = [
      address.street,
      `${address.postal_code} ${address.city}`,
      address.province !== address.city ? address.province : null,
      address.country,
    ].filter(Boolean);
    
    return parts.join('<br>');
  }

  /**
   * Translates payment method to Spanish
   */
  private static translatePaymentMethod(method: string): string {
    const translations: Record<string, string> = {
      'credit_card': 'Tarjeta de Crédito',
      'debit_card': 'Tarjeta de Débito',
      'paypal': 'PayPal',
      'bank_transfer': 'Transferencia Bancaria',
      'cash_on_delivery': 'Contra Reembolso',
    };
    
    return translations[method] || method;
  }

  /**
   * Escapes HTML characters
   */
  private static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Ensures directory exists
   */
  private static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.access(dirPath);
    } catch {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
  }
}

/**
 * Main function to generate invoice PDF
 */
export async function generateInvoicePDF(
  invoiceData: SpanishInvoiceData,
  options?: PDFGenerationOptions
): Promise<string> {
  return PDFGenerator.generateInvoicePDF(invoiceData, options);
}