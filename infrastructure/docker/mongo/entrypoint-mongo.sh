#!/bin/sh
set -e

echo "VAULT_ADDR: $VAULT_ADDR"
echo "MONGO_VAULT_ROLE_ID: $MONGO_VAULT_ROLE_ID"
echo "MONGO_VAULT_SECRET_ID: $MONGO_VAULT_SECRET_ID"

export VAULT_ROLE_ID=$MONGO_VAULT_ROLE_ID
export VAULT_SECRET_ID=$MONGO_VAULT_SECRET_ID

if [ -z "$VAULT_TOKEN" ] && [ -n "$VAULT_ROLE_ID" ] && [ -n "$VAULT_SECRET_ID" ]; then
  echo "[Mongo] Obteniendo VAULT_TOKEN usando AppRole..."
  export VAULT_TOKEN=$(vault write -field=token auth/approle/login role_id="$VAULT_ROLE_ID" secret_id="$VAULT_SECRET_ID")
  if [ $? -ne 0 ] || [ -z "$VAULT_TOKEN" ]; then
    echo "[Mongo] ERROR: No se pudo obtener el token con AppRole"
    /bin/sh
    exit 1
  fi
fi

if [ -z "$VAULT_ADDR" ] || [ -z "$VAULT_TOKEN" ]; then
  echo "[Mongo] ERROR: VAULT_ADDR o VAULT_TOKEN no están definidos."
  /bin/sh
  exit 1
fi

echo "[Mongo] Esperando a que Vault esté inicializado..."
until curl -s "$VAULT_ADDR/v1/sys/health" | grep -q '"initialized":true'; do
  sleep 2
done

echo "[Mongo] Vault disponible. Recuperando credenciales..."

export MONGO_INITDB_ROOT_USERNAME=$(vault kv get -field=MONGO_INITDB_ROOT_USERNAME secret/mongo)
export MONGO_INITDB_ROOT_PASSWORD=$(vault kv get -field=MONGO_INITDB_ROOT_PASSWORD secret/mongo)

if [ -z "$MONGO_INITDB_ROOT_USERNAME" ] || [ -z "$MONGO_INITDB_ROOT_PASSWORD" ]; then
  echo "[Mongo] ERROR: No se pudieron recuperar las credenciales de Vault."
  /bin/sh
  exit 1
fi

echo "[Mongo] Credenciales recuperadas. Iniciando MongoDB..."

exec docker-entrypoint.sh mongod
