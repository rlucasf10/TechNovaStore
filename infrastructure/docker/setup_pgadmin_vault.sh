## 0. Inicializar Vault si no está inicializado
init_status=$(docker exec -i $VAULT_CONTAINER sh -c "export VAULT_ADDR='$VAULT_ADDR_DOCKER' && vault status -format=json" 2>/dev/null)
if echo "$init_status" | grep -q '"initialized":false'; then
  echo "[!] Vault NO está inicializado. Inicializando..."
  docker exec -i $VAULT_CONTAINER sh -c "export VAULT_ADDR='$VAULT_ADDR_DOCKER' && vault operator init -key-shares=5 -key-threshold=3" > "$CLAVES_FILE"
  echo "[+] Vault inicializado. Unseal Keys y Root Token guardados en $CLAVES_FILE"
  echo "¡IMPORTANTE! Guarda este archivo en un lugar seguro."
  echo "Debes desellar Vault antes de continuar:"
  awk '/Unseal Key [0-9]+:/ {print $4}' "$CLAVES_FILE" | head -n 3 | while read key; do
    echo "docker exec -it technova_vault sh -c \"export VAULT_ADDR='http://127.0.0.1:8200' && vault operator unseal $key\""
  done
  exit 0
fi
#!/bin/bash
# Script maestro para inicializar Vault, crear policy/AppRole, actualizar .env y reiniciar pgAdmin
# Uso: ./setup_pgadmin_vault.sh

set -e

# CONFIGURACIÓN
VAULT_CONTAINER=technova_vault
PGADMIN_CONTAINER=technova_pgadmin
ENV_FILE="$(dirname "$0")/.env"
VAULT_ADDR_DOCKER="http://127.0.0.1:8200"
VAULT_ADDR_COMPOSE="http://vault:8200"
PGADMIN_POLICY="pgadmin-policy"
PGADMIN_ROLE="pgadmin-role"
SECRET_PATH="secret/pgadmin"

# Ruta segura al archivo de claves (raíz del proyecto)
CLAVES_FILE="$(dirname "$0")/../../claves-vault.txt"

# 1. Inicializar y desellar Vault si es necesario
if [ ! -f "$CLAVES_FILE" ]; then
  echo "[!] No se encontró $CLAVES_FILE. Abortando."
  exit 1
fi
init_output=$(docker exec -i $VAULT_CONTAINER sh -c "export VAULT_ADDR='$VAULT_ADDR_DOCKER' && vault status" 2>&1 || true)
if echo "$init_output" | grep -q 'Sealed'; then
  echo "[+] Vault está sellado. Desellando..."
  for key in $(awk '/Unseal Key/ {print $4}' "$CLAVES_FILE" | head -n 3); do
    docker exec -i $VAULT_CONTAINER sh -c "export VAULT_ADDR='$VAULT_ADDR_DOCKER' && vault operator unseal $key"
  done
else
  echo "[+] Vault ya está desellado o inicializado."
fi

# 2. Login con el root token
ROOT_TOKEN=$(awk '/Initial Root Token:/ {print $4}' "$CLAVES_FILE" | head -n 1)
if [ -z "$ROOT_TOKEN" ]; then
  echo "[!] No se encontró el root token en $CLAVES_FILE. Abortando."
  exit 1
fi

echo "[+] Logueando en Vault con root token..."
docker exec -i $VAULT_CONTAINER sh -c "export VAULT_ADDR='$VAULT_ADDR_DOCKER' && vault login $ROOT_TOKEN"


# 3. Crear/actualizar policy y AppRole
cat <<EOF | docker exec -i $VAULT_CONTAINER sh -c "export VAULT_ADDR='$VAULT_ADDR_DOCKER' && vault policy write $PGADMIN_POLICY -"
path "$SECRET_PATH" {
  capabilities = ["read"]
}
EOF

docker exec -i $VAULT_CONTAINER sh -c "export VAULT_ADDR='$VAULT_ADDR_DOCKER' && vault auth enable approle || true"
docker exec -i $VAULT_CONTAINER sh -c "export VAULT_ADDR='$VAULT_ADDR_DOCKER' && vault delete auth/approle/role/$PGADMIN_ROLE || true"
docker exec -i $VAULT_CONTAINER sh -c "export VAULT_ADDR='$VAULT_ADDR_DOCKER' && vault write auth/approle/role/$PGADMIN_ROLE token_policies=\"$PGADMIN_POLICY\" secret_id_ttl=60m token_ttl=60m token_max_ttl=120m"

# 4. Obtener nuevos role_id y secret_id
echo "[+] Obteniendo role_id y secret_id nuevos..."
ROLE_ID=$(docker exec -i $VAULT_CONTAINER sh -c "export VAULT_ADDR='$VAULT_ADDR_DOCKER' && vault read -field=role_id auth/approle/role/$PGADMIN_ROLE/role-id")
SECRET_ID=$(docker exec -i $VAULT_CONTAINER sh -c "export VAULT_ADDR='$VAULT_ADDR_DOCKER' && vault write -f -field=secret_id auth/approle/role/$PGADMIN_ROLE/secret-id")

echo "[+] ROLE_ID: $ROLE_ID"
echo "[+] SECRET_ID: $SECRET_ID"

# 5. Actualizar .env (respetando formato Unix)
if [ ! -f "$ENV_FILE" ]; then
  echo "[!] No se encontró $ENV_FILE. Abortando."
  exit 1
fi

sed -i "/^VAULT_ROLE_ID=/d" "$ENV_FILE"
sed -i "/^VAULT_SECRET_ID=/d" "$ENV_FILE"
echo "VAULT_ROLE_ID=$ROLE_ID" >> "$ENV_FILE"
echo "VAULT_SECRET_ID=$SECRET_ID" >> "$ENV_FILE"
# Convertir a formato Unix
sed -i 's/\r$//' "$ENV_FILE"

echo "[+] .env actualizado con nuevos valores."


# 6. Eliminar y recrear el contenedor de pgAdmin para forzar la recarga del .env
cd "$(dirname "$ENV_FILE")"
docker-compose rm -f pgadmin
docker-compose up -d pgadmin

echo "[+] Proceso completado. Nuevos valores para pgAdmin listos."
echo "----------------------------------------"
echo "VAULT_ROLE_ID=$ROLE_ID"
echo "VAULT_SECRET_ID=$SECRET_ID"
echo "----------------------------------------"
# Mostrar Unseal Keys y Root Token en formato listo para pegar
echo ""
echo "[INFO] Comandos para desellar Vault (copia y pega):"
awk '/Unseal Key [0-9]+:/ {print $4}' "$CLAVES_FILE" | head -n 3 | while read key; do
  echo "docker exec -it technova_vault sh -c \"export VAULT_ADDR='http://127.0.0.1:8200' && vault operator unseal $key\""
done
echo "[INFO] Root Token: $ROOT_TOKEN"
echo "[INFO] ROLE_ID: $ROLE_ID"
echo "[INFO] SECRET_ID: $SECRET_ID"
