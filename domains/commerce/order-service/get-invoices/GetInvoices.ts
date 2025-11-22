/**
 * Caso de uso: Obtener Facturas
 * 
 * Obtiene una lista paginada de facturas con filtros opcionales.
 */

import { Invoice } from '../shared/models/Invoice';
import { Order } from '../shared/models/Order';

export interface GetInvoicesOptions {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface GetInvoicesResponse {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class GetInvoices {
  async execute(options: GetInvoicesOptions = {}): Promise<GetInvoicesResponse> {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
    } = options;

    const where: any = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.issued_date = {};
      if (startDate) where.issued_date.gte = startDate;
      if (endDate) where.issued_date.lte = endDate;
    }

    const offset = (page - 1) * limit;

    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
        },
      ],
      order: [['issued_date', 'DESC']],
      limit,
      offset,
    });

    return {
      invoices,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }
}
