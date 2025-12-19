/**
 * API Route: Admin Proxy (Catch-all)
 * 
 * Proxy para todas las rutas de administración del API Gateway.
 * Redirige las peticiones del navegador al API Gateway interno de Docker.
 * 
 * Rutas soportadas:
 * - /api/admin/kpis - KPIs del dashboard
 * - /api/admin/services-health - Estado de servicios
 * - /api/admin/activity - Actividad reciente
 * - /api/admin/metrics/* - Métricas de servicios
 * - /api/admin/analytics/* - Analytics y reportes
 */

import { NextRequest, NextResponse } from 'next/server';

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://api-gateway:3000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    const url = `${INTERNAL_API_URL}/admin/${path}${queryString ? `?${queryString}` : ''}`;
    
    console.log(`[API Route] Fetching admin data: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Pasar headers de autenticación si existen
        ...(request.headers.get('authorization') && {
          'authorization': request.headers.get('authorization')!
        }),
        ...(request.headers.get('cookie') && {
          'cookie': request.headers.get('cookie')!
        }),
      },
      cache: 'no-store', // No cachear datos de admin
    });

    if (!response.ok) {
      console.error(`[API Route] Admin error: ${response.status}`);
      return NextResponse.json(
        { error: 'Error al obtener datos de administración', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[API Route] Admin fetch error:', error);
    return NextResponse.json(
      { error: 'Error al conectar con el servidor de administración' },
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
    
    const url = `${INTERNAL_API_URL}/admin/${path}`;
    
    console.log(`[API Route] Posting admin data: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'authorization': request.headers.get('authorization')!
        }),
        ...(request.headers.get('cookie') && {
          'cookie': request.headers.get('cookie')!
        }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`[API Route] Admin POST error: ${response.status}`);
      return NextResponse.json(
        { error: 'Error al enviar datos de administración', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[API Route] Admin POST error:', error);
    return NextResponse.json(
      { error: 'Error al conectar con el servidor de administración' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const body = await request.json();
    
    const url = `${INTERNAL_API_URL}/admin/${path}`;
    
    console.log(`[API Route] Updating admin data: ${url}`);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'authorization': request.headers.get('authorization')!
        }),
        ...(request.headers.get('cookie') && {
          'cookie': request.headers.get('cookie')!
        }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`[API Route] Admin PUT error: ${response.status}`);
      return NextResponse.json(
        { error: 'Error al actualizar datos de administración', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[API Route] Admin PUT error:', error);
    return NextResponse.json(
      { error: 'Error al conectar con el servidor de administración' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    
    const url = `${INTERNAL_API_URL}/admin/${path}`;
    
    console.log(`[API Route] Deleting admin data: ${url}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'authorization': request.headers.get('authorization')!
        }),
        ...(request.headers.get('cookie') && {
          'cookie': request.headers.get('cookie')!
        }),
      },
    });

    if (!response.ok) {
      console.error(`[API Route] Admin DELETE error: ${response.status}`);
      return NextResponse.json(
        { error: 'Error al eliminar datos de administración', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[API Route] Admin DELETE error:', error);
    return NextResponse.json(
      { error: 'Error al conectar con el servidor de administración' },
      { status: 500 }
    );
  }
}
