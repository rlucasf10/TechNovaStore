@echo off
echo ========================================
echo   Construyendo Proyectos Compartidos
echo ========================================
echo.

echo [1/4] Construyendo Shared Types...
cd shared\types
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la construccion de Shared Types
    exit /b 1
)
cd ..\..

echo [2/4] Construyendo Shared Utils...
cd shared\utils
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la construccion de Shared Utils
    exit /b 1
)
cd ..\..

echo [3/4] Construyendo Shared Config...
cd shared\config
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la construccion de Shared Config
    exit /b 1
)
cd ..\..

echo [4/4] Construyendo Shared Models...
cd shared\models
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la construccion de Shared Models
    exit /b 1
)
cd ..\..

echo.
echo ========================================
echo   PROYECTOS COMPARTIDOS CONSTRUIDOS
echo ========================================
echo.
echo Todos los proyectos compartidos se han construido correctamente.
echo Ahora puedes usar las referencias de TypeScript en el proyecto principal.
echo.