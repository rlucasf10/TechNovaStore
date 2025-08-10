#!/bin/sh
set -e

echo "VAULT_ADDR: $VAULT_ADDR"
echo "POSTGRES_VAULT_ROLE_ID: $POSTGRES_VAULT_ROLE_ID"
echo "POSTGRES_VAULT_SECRET_ID: $POSTGRES_VAULT_SECRET_ID"

export VAULT_ROLE_ID=$POSTGRES_VAULT_ROLE_ID
export VAULT_SECRET_ID=$POSTGRES_VAULT_SECRET_ID

if [ -z "$VAULT_TOKEN" ] && [ -n "$VAULT_ROLE_ID" ] && [ -n "$VAULT_SECRET_ID" ]; then
  echo "[Postgres] Obteniendo VAULT_TOKEN usando AppRole..."
  export VAULT_TOKEN=$(vault write -field=token auth/approle/login role_id="$VAULT_ROLE_ID" secret_id="$VAULT_SECRET_ID")
  if [ $? -ne 0 ] || [ -z "$VAULT_TOKEN" ]; then
    echo "[Postgres] ERROR: No se pudo obtener el token con AppRole"
    /bin/sh
    exit 1
  fi
fi

if [ -z "$VAULT_ADDR" ] || [ -z "$VAULT_TOKEN" ]; then
  echo "[Postgres] ERROR: VAULT_ADDR o VAULT_TOKEN no están definidos."
  /bin/sh
  exit 1
fi

echo "[Postgres] Esperando a que Vault esté inicializado..."
until curl -s "$VAULT_ADDR/v1/sys/health" | grep -q '"initialized":true'; do
  sleep 2
done

echo "[Postgres] Vault disponible. Recuperando credenciales..."

export POSTGRES_USER=$(vault kv get -field=POSTGRES_USER secret/postgres)
export POSTGRES_PASSWORD=$(vault kv get -field=POSTGRES_PASSWORD secret/postgres)
export POSTGRES_DB=$(vault kv get -field=POSTGRES_DB secret/postgres)

if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_DB" ]; then
  echo "[Postgres] ERROR: No se pudieron recuperar las credenciales de Vault."
  /bin/sh
  exit 1
fi

echo "[Postgres] Credenciales recuperadas. Iniciando Postgres..."

exec docker-entrypoint.sh postgres
