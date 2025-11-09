#!/bin/bash

# Generate SSL certificates for TechNovaStore development
# This script creates self-signed certificates for local development only
# DO NOT use these certificates in production!

set -e

CERT_DIR="./certs"
DAYS=365
COUNTRY="ES"
STATE="Madrid"
CITY="Madrid"
ORG="TechNovaStore"
UNIT="Development"
COMMON_NAME="localhost"

echo "🔐 Generating SSL certificates for TechNovaStore development..."

# Create certs directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate private key
echo "📝 Generating private key..."
openssl genrsa -out "$CERT_DIR/private.key" 4096

# Generate certificate signing request
echo "📝 Generating certificate signing request..."
openssl req -new -key "$CERT_DIR/private.key" -out "$CERT_DIR/certificate.csr" -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/OU=$UNIT/CN=$COMMON_NAME"

# Generate self-signed certificate
echo "📝 Generating self-signed certificate..."
openssl x509 -req -days $DAYS -in "$CERT_DIR/certificate.csr" -signkey "$CERT_DIR/private.key" -out "$CERT_DIR/certificate.crt"

# Generate certificate with Subject Alternative Names for better browser compatibility
echo "📝 Generating certificate with SAN..."
cat > "$CERT_DIR/san.conf" << EOF
[req]
default_bits = 4096
prompt = no
distinguished_name = req_distinguished_name
req_extensions = v3_req

[req_distinguished_name]
C=$COUNTRY
ST=$STATE
L=$CITY
O=$ORG
OU=$UNIT
CN=$COMMON_NAME

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Generate new certificate with SAN
openssl req -new -key "$CERT_DIR/private.key" -out "$CERT_DIR/certificate_san.csr" -config "$CERT_DIR/san.conf"
openssl x509 -req -days $DAYS -in "$CERT_DIR/certificate_san.csr" -signkey "$CERT_DIR/private.key" -out "$CERT_DIR/certificate.crt" -extensions v3_req -extfile "$CERT_DIR/san.conf"

# Clean up temporary files
rm "$CERT_DIR/certificate.csr" "$CERT_DIR/certificate_san.csr" "$CERT_DIR/san.conf"

# Set appropriate permissions
chmod 600 "$CERT_DIR/private.key"
chmod 644 "$CERT_DIR/certificate.crt"

echo "✅ SSL certificates generated successfully!"
echo ""
echo "📁 Certificate files:"
echo "   Private Key: $CERT_DIR/private.key"
echo "   Certificate: $CERT_DIR/certificate.crt"
echo ""
echo "⚠️  WARNING: These are self-signed certificates for development only!"
echo "   Your browser will show security warnings."
echo "   For production, obtain certificates from a trusted CA like Let's Encrypt."
echo ""
echo "🔧 To trust the certificate in your browser:"
echo "   1. Navigate to https://localhost:3443"
echo "   2. Click 'Advanced' when you see the security warning"
echo "   3. Click 'Proceed to localhost (unsafe)'"
echo ""
echo "🔧 To add the certificate to your system trust store:"
echo "   macOS: sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERT_DIR/certificate.crt"
echo "   Linux: sudo cp $CERT_DIR/certificate.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates"
echo "   Windows: Import $CERT_DIR/certificate.crt into 'Trusted Root Certification Authorities'"