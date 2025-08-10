FROM postgres:latest

USER root

RUN apt-get update && apt-get install -y wget unzip curl && \
    wget https://releases.hashicorp.com/vault/1.13.2/vault_1.13.2_linux_amd64.zip && \
    unzip vault_1.13.2_linux_amd64.zip && \
    mv vault /usr/local/bin/ && \
    rm vault_1.13.2_linux_amd64.zip && \
    apt-get remove -y wget unzip && apt-get clean

COPY entrypoint-postgres.sh /custom-entrypoint.sh
RUN chmod +x /custom-entrypoint.sh

ENTRYPOINT ["/custom-entrypoint.sh"]
CMD ["postgres"]
