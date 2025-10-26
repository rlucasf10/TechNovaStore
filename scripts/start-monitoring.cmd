@echo off
echo 🚀 Iniciando monitoreo TechNovaStore...

docker-compose up -d prometheus grafana alertmanager mongodb-exporter postgres-exporter redis-exporter node-exporter

echo ⏳ Esperando servicios...
timeout /t 15 /nobreak >nul

echo 📈 Acceso:
echo    Grafana: http://localhost:3013 (admin/REDACTED_GRAFANA_PASSWORD)
echo    Prometheus: http://localhost:9090

echo.
echo 🔍 Verificando servicios...
node scripts/monitor-services.js

pause