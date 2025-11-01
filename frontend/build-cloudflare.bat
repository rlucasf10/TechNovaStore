@echo off
REM Script de build para Cloudflare Pages (Windows)
REM Este script asegura que todas las dependencias se instalen correctamente

echo Instalando dependencias del frontend...
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%

echo Construyendo aplicacion Next.js...
call npm run build:pages
if %errorlevel% neq 0 exit /b %errorlevel%

echo Build completado exitosamente
