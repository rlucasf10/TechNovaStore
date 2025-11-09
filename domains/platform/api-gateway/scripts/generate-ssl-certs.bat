@echo off
REM Generate SSL certificates for TechNovaStore development (Windows)
REM This script creates self-signed certificates for local development only
REM DO NOT use these certificates in production!

setlocal enabledelayedexpansion

set CERT_DIR=.\certs
set DAYS=365
set COUNTRY=ES
set STATE=Madrid
set CITY=Madrid
set ORG=TechNovaStore
set UNIT=Development
set COMMON_NAME=localhost

echo 🔐 Generating SSL certificates for TechNovaStore development...

REM Create certs directory if it doesn't exist
if not exist "%CERT_DIR%" mkdir "%CERT_DIR%"

REM Check if OpenSSL is available
where openssl >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ OpenSSL not found in PATH
    echo Please install OpenSSL or use Git Bash which includes OpenSSL
    echo Download from: https://slproweb.com/products/Win32OpenSSL.html
    pause
    exit /b 1
)

echo 📝 Generating private key...
openssl genrsa -out "%CERT_DIR%\private.key" 4096
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to generate private key
    pause
    exit /b 1
)

echo 📝 Generating certificate signing request...
openssl req -new -key "%CERT_DIR%\private.key" -out "%CERT_DIR%\certificate.csr" -subj "/C=%COUNTRY%/ST=%STATE%/L=%CITY%/O=%ORG%/OU=%UNIT%/CN=%COMMON_NAME%"
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to generate certificate signing request
    pause
    exit /b 1
)

echo 📝 Generating certificate with SAN...
(
echo [req]
echo default_bits = 4096
echo prompt = no
echo distinguished_name = req_distinguished_name
echo req_extensions = v3_req
echo.
echo [req_distinguished_name]
echo C=%COUNTRY%
echo ST=%STATE%
echo L=%CITY%
echo O=%ORG%
echo OU=%UNIT%
echo CN=%COMMON_NAME%
echo.
echo [v3_req]
echo keyUsage = keyEncipherment, dataEncipherment
echo extendedKeyUsage = serverAuth
echo subjectAltName = @alt_names
echo.
echo [alt_names]
echo DNS.1 = localhost
echo DNS.2 = *.localhost
echo DNS.3 = 127.0.0.1
echo IP.1 = 127.0.0.1
echo IP.2 = ::1
) > "%CERT_DIR%\san.conf"

REM Generate new certificate with SAN
openssl req -new -key "%CERT_DIR%\private.key" -out "%CERT_DIR%\certificate_san.csr" -config "%CERT_DIR%\san.conf"
openssl x509 -req -days %DAYS% -in "%CERT_DIR%\certificate_san.csr" -signkey "%CERT_DIR%\private.key" -out "%CERT_DIR%\certificate.crt" -extensions v3_req -extfile "%CERT_DIR%\san.conf"

REM Clean up temporary files
del "%CERT_DIR%\certificate.csr" 2>nul
del "%CERT_DIR%\certificate_san.csr" 2>nul
del "%CERT_DIR%\san.conf" 2>nul

echo ✅ SSL certificates generated successfully!
echo.
echo 📁 Certificate files:
echo    Private Key: %CERT_DIR%\private.key
echo    Certificate: %CERT_DIR%\certificate.crt
echo.
echo ⚠️  WARNING: These are self-signed certificates for development only!
echo    Your browser will show security warnings.
echo    For production, obtain certificates from a trusted CA like Let's Encrypt.
echo.
echo 🔧 To trust the certificate in your browser:
echo    1. Navigate to https://localhost:3443
echo    2. Click 'Advanced' when you see the security warning
echo    3. Click 'Proceed to localhost (unsafe)'
echo.
echo 🔧 To add the certificate to Windows trust store:
echo    1. Double-click %CERT_DIR%\certificate.crt
echo    2. Click 'Install Certificate...'
echo    3. Select 'Local Machine' and click 'Next'
echo    4. Select 'Place all certificates in the following store'
echo    5. Click 'Browse' and select 'Trusted Root Certification Authorities'
echo    6. Click 'Next' and then 'Finish'

pause