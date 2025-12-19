/**
 * API Route: /api/recommender/[...path]
 * 
 * Proxy para el servicio de recomendaciones (recommender-service)
 * Nota: La ruta en el backend es /recommendations, pero mantenemos /recommender
 * para compatibilidad con el código existente
 */

import { NextRequest, NextResponse } from 'next/server';

const API_GATEWAY_URL = process.env.INTERNAL_API_URL || 'http://api-gateway:3000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    // Mapear /recommender a /recommendations en el backend
    const url = `${API_GATEWAY_URL}/recommendations/${path}${queryString ? `?${queryString}` : ''}`;
    
    console.log(`[API Route] Fetching recommendations: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[API Route] Recommender error: ${response.status}`);
      return NextResponse.json(
        { success: false, error: 'Error fetching recommendations' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/recommender:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const body = await request.json();
    
    // Mapear /recommender a /recommendations en el backend
    const url = `${API_GATEWAY_URL}/recommendations/${path}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Error posting recommendation' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/recommender POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
