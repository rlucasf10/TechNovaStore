#!/bin/sh
set -e

echo "VAULT_ADDR: $VAULT_ADDR"
echo "PGADMIN_VAULT_ROLE_ID: $PGADMIN_VAULT_ROLE_ID"
echo "PGADMIN_VAULT_SECRET_ID: $PGADMIN_VAULT_SECRET_ID"

# Reasignar variables para que Vault CLI use las que espera
export VAULT_ROLE_ID=$PGADMIN_VAULT_ROLE_ID
export VAULT_SECRET_ID=$PGADMIN_VAULT_SECRET_ID

# Si no hay VAULT_TOKEN, intenta login con AppRole
if [ -z "$VAULT_TOKEN" ] && [ -n "$VAULT_ROLE_ID" ] && [ -n "$VAULT_SECRET_ID" ]; then
  echo "[pgAdmin] Obteniendo VAULT_TOKEN usando AppRole..."
  export VAULT_TOKEN=$(vault write -field=token auth/approle/login role_id="$VAULT_ROLE_ID" secret_id="$VAULT_SECRET_ID")
  if [ $? -ne 0 ] || [ -z "$VAULT_TOKEN" ]; then
    echo "[pgAdmin] ERROR: No se pudo obtener el token con AppRole"
    /bin/sh
    exit 1
  fi
fi

# Comprobar que VAULT_ADDR y VAULT_TOKEN están definidos
if [ -z "$VAULT_ADDR" ] || [ -z "$VAULT_TOKEN" ]; then
  echo "[pgAdmin] ERROR: VAULT_ADDR o VAULT_TOKEN no están definidos."
  /bin/sh
  exit 1
fi

echo "[pgAdmin] Esperando a que Vault esté inicializado..."
until curl -s "$VAULT_ADDR/v1/sys/health" | grep -q '"initialized":true'; do
  sleep 2
done

echo "[pgAdmin] Vault disponible. Recuperando credenciales..."

# Recuperar email y password desde Vault
export PGADMIN_DEFAULT_EMAIL=$(vault kv get -field=email secret/pgadmin)
export PGADMIN_DEFAULT_PASSWORD=$(vault kv get -field=password secret/pgadmin)

# Verificar que se han obtenido las credenciales
if [ -z "$PGADMIN_DEFAULT_EMAIL" ] || [ -z "$PGADMIN_DEFAULT_PASSWORD" ]; then
  echo "[pgAdmin] ERROR: No se pudieron recuperar las credenciales de Vault."
  /bin/sh
  exit 1
fi

echo "[pgAdmin] Iniciando pgAdmin con credenciales desde Vault..."

# Ejecutar el entrypoint original de pgAdmin, pasando todos los argumentos recibidos
exec /entrypoint.sh "$@"
