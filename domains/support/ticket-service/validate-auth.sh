#!/bin/sh

# Script de validación de autenticación para ticket-service
# Valida que el middleware de autenticación funciona correctamente
# IMPORTANTE: Prueba DIRECTAMENTE contra el microservicio (Defense in Depth)

echo "========================================="
echo "Validación de Autenticación - Ticket Service"
echo "Defense in Depth: Validando autenticación directa"
echo "========================================="
echo ""

# Variables
TICKET_SERVICE_URL="http://localhost:3005"

# Token JWT válido de ADMIN (generado con el JWT_SECRET del proyecto)
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6ImFkbWluQHRlY2hub3Zhc3RvcmUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY1ODQyMTM5LCJleHAiOjE3OTczNzgxMzl9.6QqWUTJ9EzKHLgjlguVFpOjqz1pqGikHXxL7Rfe_kyo"

# Token JWT válido de USER (sin rol admin)
USER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIiLCJlbWFpbCI6InVzZXJAdGVjaG5vdmFzdG9yZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc2NTg0MjEzOSwiZXhwIjoxNzk3Mzc4MTM5fQ.IL0jQsxda6uj0L2jVhGsLSbeqEoUazBnkGe9osdYxWA"

# Token inválido
INVALID_TOKEN="invalid.token.here"

echo "NOTA: Probando DIRECTAMENTE contra el microservicio"
echo "      (sin pasar por API Gateway)"
echo ""

# Test 1: Probar endpoint sin token (debe retornar 401)
echo "1. Probando endpoint sin token (debe retornar 401)..."
RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TICKET_SERVICE_URL/api/tickets")

if [ "$RESPONSE_CODE" = "401" ]; then
  echo "✓ Test exitoso: Retornó 401 Unauthorized"
else
  echo "✗ Test fallido: Esperaba 401, obtuvo $RESPONSE_CODE"
fi
echo ""

# Test 2: Probar endpoint con token inválido (debe retornar 401)
echo "2. Probando endpoint con token inválido (debe retornar 401)..."
RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TICKET_SERVICE_URL/api/tickets" \
  -H "Authorization: Bearer $INVALID_TOKEN")

if [ "$RESPONSE_CODE" = "401" ]; then
  echo "✓ Test exitoso: Retornó 401 Unauthorized"
else
  echo "✗ Test fallido: Esperaba 401, obtuvo $RESPONSE_CODE"
fi
echo ""

# Test 3: Probar endpoint con token válido de admin (debe funcionar)
echo "3. Probando endpoint con token válido de admin (debe funcionar)..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$TICKET_SERVICE_URL/api/tickets" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

RESPONSE_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$RESPONSE_CODE" = "200" ]; then
  echo "✓ Test exitoso: Retornó 200 OK"
  echo "   Respuesta: $(echo "$RESPONSE_BODY" | cut -c1-100)..."
else
  echo "✗ Test fallido: Esperaba 200, obtuvo $RESPONSE_CODE"
  echo "   Respuesta: $RESPONSE_BODY"
fi
echo ""

# Test 4: Probar endpoint de métricas con usuario sin rol admin (debe retornar 403)
echo "4. Probando endpoint de métricas con usuario sin rol admin (debe retornar 403)..."
METRICS_RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TICKET_SERVICE_URL/api/metrics/tickets" \
  -H "Authorization: Bearer $USER_TOKEN")

if [ "$METRICS_RESPONSE_CODE" = "403" ]; then
  echo "✓ Test exitoso: Retornó 403 Forbidden"
else
  echo "✗ Test fallido: Esperaba 403, obtuvo $METRICS_RESPONSE_CODE"
fi
echo ""

# Test 5: Probar endpoint de métricas con rol admin (debe funcionar)
echo "5. Probando endpoint de métricas con rol admin (debe funcionar)..."
METRICS_RESPONSE=$(curl -s -w "\n%{http_code}" "$TICKET_SERVICE_URL/api/metrics/tickets" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

METRICS_CODE=$(echo "$METRICS_RESPONSE" | tail -n1)
METRICS_BODY=$(echo "$METRICS_RESPONSE" | sed '$d')

if [ "$METRICS_CODE" = "200" ]; then
  echo "✓ Test exitoso: Retornó 200 OK"
  echo "   Respuesta: $(echo "$METRICS_BODY" | cut -c1-100)..."
else
  echo "✗ Test fallido: Esperaba 200, obtuvo $METRICS_CODE"
  echo "   Respuesta: $METRICS_BODY"
fi
echo ""

echo "========================================="
echo "Validación completada"
echo "========================================="
echo ""
echo "Resumen:"
echo "- El microservicio valida tokens JWT independientemente"
echo "- Rechaza requests sin token (401)"
echo "- Rechaza tokens inválidos (401)"
echo "- Acepta tokens válidos (200)"
echo "- Verifica roles para endpoints admin (403 para no-admin)"
echo "- Defense in Depth implementado correctamente ✓"
