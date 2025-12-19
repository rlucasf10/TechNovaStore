/**
 * API Route: /api/products/sku/[sku]
 * 
 * Proxy para obtener un producto por SKU
 */

import { NextRequest, NextResponse } from 'next/server';

const API_GATEWAY_URL = process.env.INTERNAL_API_URL || 'http://api-gateway:3000/api';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await params;
    
    const url = `${API_GATEWAY_URL}/products/sku/${sku}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error in /api/products/sku/[sku]:`, error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
