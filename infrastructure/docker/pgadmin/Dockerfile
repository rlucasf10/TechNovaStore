FROM dpage/pgadmin4:latest

USER root

# Instala wget y unzip, descarga e instala Vault CLI (usando apk)
RUN apk add --no-cache wget unzip curl && \
    wget https://releases.hashicorp.com/vault/1.13.2/vault_1.13.2_linux_amd64.zip && \
    unzip vault_1.13.2_linux_amd64.zip && \
    mv vault /usr/local/bin/ && \
    rm vault_1.13.2_linux_amd64.zip && \
    apk del wget unzip

# Copia el entrypoint personalizado
COPY entrypoint.sh /custom-entrypoint.sh

# Usa el entrypoint personalizado para obtener credenciales de Vault
ENTRYPOINT ["/custom-entrypoint.sh"]

# El CMD original de la imagen oficial
CMD ["/entrypoint.sh"]
