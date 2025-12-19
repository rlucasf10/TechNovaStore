/**
 * API Route: /api/products/[id]
 * 
 * Proxy para obtener un producto específico por ID
 */

import { NextRequest, NextResponse } from 'next/server';

const API_GATEWAY_URL = process.env.INTERNAL_API_URL || 'http://api-gateway:3000/api';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const url = `${API_GATEWAY_URL}/products/${id}`;
    
    console.log(`[API Route] Fetching product: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log(`[API Route] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Route] Error response: ${errorText}`);
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: response.status }
      );
    }

    const text = await response.text();
    console.log(`[API Route] Response text length: ${text.length}`);
    
    // Intentar parsear el JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error(`[API Route] JSON parse error:`, parseError);
      console.error(`[API Route] Response text:`, text.substring(0, 500));
      return NextResponse.json(
        { success: false, error: 'Invalid JSON response from backend' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[API Route] Error in /api/products/[id]:`, error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
