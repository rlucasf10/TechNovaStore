# Implementation Plan: Container Fixes

- [-] 1. Fix User Service - Missing express-validator Dependency
  - [x] 1.1 Add express-validator dependency to User Service
    - Navigate to `services/user/` directory
    - Add `express-validator` to package.json dependencies
    - Add `@types/express-validator` to devDependencies
    - Run npm install or rebuild container
    - _Requirements: 1.1, 1.2_

  - [-] 1.2 Verify User Service compilation and startup
    - Check that TypeScript compiles without TS2307 error
    - Verify service starts successfully
    - Run `docker ps` to confirm container is running (not restarting)
    - Run `docker logs technovastore-user-service` to check for errors
    - Test health check endpoint returns 200: `curl http://localhost:3003/health`
    - Verify no ERROR level logs in output
    - _Requirements: 1.1, 1.2_

- [-] 2. Fix Order Service - Missing AuthenticatedRequest Type
  - [-] 2.1 Add AuthenticatedRequest interface to shared types
    - Open `shared/types/index.ts`
    - Add AuthenticatedRequest interface extending Express Request
    - Include user property with id, email, and role fields
    - Export the interface
    - _Requirements: 1.1, 1.3_

  - [-] 2.2 Update Order Service to use shared AuthenticatedRequest
    - Verify import in `services/order/src/controllers/orderController.ts`
    - Ensure import path is correct: `@technovastore/shared-types`
    - Remove any local duplicate definitions if present
    - _Requirements: 1.1, 1.3_

  - [-] 2.3 Verify Order Service compilation and startup
    - Check that TypeScript compiles without TS2305 error
    - Verify service starts successfully
    - Run `docker ps` to confirm container is running (not restarting)
    - Run `docker logs technovastore-order-service` to check for errors
    - Test health check endpoint returns 200: `curl http://localhost:3002/health`
    - Verify no ERROR level logs in output
    - _Requirements: 1.1, 1.3_

- [-] 3. Fix Payment Service - Missing Build Configuration
  - [-] 3.1 Update Payment Service package.json scripts
    - Add or update "dev" script to use ts-node-dev
    - Ensure "build" script uses tsc
    - Verify "start" script points to dist/index.js
    - _Requirements: 1.1, 1.4_

  - [-] 3.2 Update Payment Service Dockerfile for development
    - Change CMD to use npm run dev instead of npm start
    - Ensure ts-node-dev is installed in dependencies
    - Add nodemon for auto-reload if needed
    - _Requirements: 1.1, 1.4_

  - [-] 3.3 Verify Payment Service startup
    - Check that service starts without "Cannot find module" error
    - Verify service runs in development mode with ts-node
    - Run `docker ps` to confirm container is running (not restarting)
    - Run `docker logs technovastore-payment-service` to check for errors
    - Test health check endpoint returns 200: `curl http://localhost:3004/health`
    - Verify no ERROR level logs in output
    - _Requirements: 1.1, 1.4_

- [-] 4. Fix Sync Engine - Incorrect Redis Import
  - [-] 4.1 Search and identify all incorrect Redis imports in Sync Engine
    - Search for `import Redis from 'redis'` pattern
    - Search for `Redis.createClient` usage
    - List all files that need correction
    - _Requirements: 1.1, 1.4_

  - [-] 4.2 Update Redis imports to use named import
    - Change `import Redis from 'redis'` to `import { createClient } from 'redis'`
    - Update `Redis.createClient()` to `createClient()`
    - Ensure connection configuration includes URL with password
    - Apply changes to all identified files
    - _Requirements: 1.1, 1.4_

  - [-] 4.3 Verify Sync Engine startup and Redis connection
    - Check that service starts without TypeError
    - Verify Redis connection is established
    - Run `docker ps` to confirm container is running (not restarting)
    - Run `docker logs technovastore-sync-engine` to check for errors
    - Test health check endpoint returns 200: `curl http://localhost:3006/health`
    - Verify PriceCache initializes correctly in logs
    - Verify no ERROR level logs in output
    - _Requirements: 1.1, 1.4_

- [-] 5. Fix Shipment Tracker - PostgreSQL Connection Configuration
  - [-] 5.1 Update Shipment Tracker environment variables in docker-compose.optimized.yml
    - Set POSTGRES_HOST to "postgresql" (not "localhost")
    - Set POSTGRES_PORT to 5432
    - Set POSTGRES_DB to "technovastore"
    - Set POSTGRES_USER to "admin"
    - Set POSTGRES_PASSWORD to "password"
    - _Requirements: 2.1, 2.2_

  - [-] 5.2 Update Shipment Tracker environment variables in docker-compose.prod.yml
    - Apply same PostgreSQL configuration as optimized.yml
    - Ensure consistency between environments
    - Use environment variables for production credentials
    - _Requirements: 2.1, 2.2, 3.3_

  - [-] 5.3 Verify Shipment Tracker database configuration code
    - Check `automation/shipment-tracker/src/config/database.ts`
    - Ensure it reads POSTGRES_HOST from environment
    - Verify connection string uses correct hostname
    - _Requirements: 2.1, 2.2, 2.3_

  - [-] 5.4 Verify Shipment Tracker startup and PostgreSQL connection
    - Check that service starts without ECONNREFUSED error
    - Verify PostgreSQL connection is established
    - Run `docker ps` to confirm container is running (not restarting)
    - Run `docker logs technovastore-shipment-tracker` to check for errors
    - Test health check endpoint returns 200: `curl http://localhost:3008/health`
    - Verify "Connected to PostgreSQL" or similar message in logs
    - Verify no ERROR level logs in output
    - _Requirements: 2.1, 2.2_

- [-] 6. Fix Recommender Service - Insufficient Memory
  - [-] 6.1 Update Recommender memory limits in docker-compose.optimized.yml
    - Change memory limit from 256M to 1G
    - Change CPU limit to 0.75
    - Set memory reservation to 512M
    - Set CPU reservation to 0.5
    - _Requirements: 3.1, 3.2_

  - [-] 6.2 Add NODE_OPTIONS environment variable to Recommender
    - Add NODE_OPTIONS with value "--max-old-space-size=896"
    - Apply to docker-compose.optimized.yml
    - _Requirements: 3.1, 3.2_

  - [-] 6.3 Update Recommender memory limits in docker-compose.prod.yml
    - Apply same memory configuration as optimized.yml
    - Ensure consistency between environments
    - _Requirements: 3.1, 3.3_

  - [-] 6.4 Verify Recommender Service startup
    - Check that service starts without heap out of memory error
    - Run `docker ps` to confirm container is running (not restarting)
    - Run `docker logs technovastore-recommender` to check for errors
    - Test health check endpoint returns 200: `curl http://localhost:3010/health`
    - Monitor memory usage with `docker stats technovastore-recommender` (should be ~800MB)
    - Verify service remains stable for 5 minutes without crashes
    - Verify no ERROR level logs in output
    - _Requirements: 3.1, 3.2, 3.4_

- [-] 7. Fix Product Service Health Check
  - [-] 7.1 Review Product Service health check implementation
    - Open `services/product/src/routes/health.ts`
    - Identify why it returns 503 when dependencies are connected
    - Check MongoDB and Redis connection status checks
    - _Requirements: 4.1, 4.2_

  - [-] 7.2 Update health check to return 200 when healthy
    - Verify mongoose.connection.readyState === 1 for MongoDB
    - Verify redisClient.isReady for Redis
    - Return 200 status when both are connected
    - Return 503 only when dependencies are actually down
    - _Requirements: 4.1, 4.2_

  - [-] 7.3 Ensure health check route is registered
    - Check `services/product/src/index.ts`
    - Verify health router is imported and used
    - Test endpoint responds correctly
    - _Requirements: 4.1, 4.2, 4.3_

  - [-] 7.4 Verify Product Service health check
    - Test /health endpoint returns 200: `curl http://localhost:3001/health`
    - Run `docker ps` and verify status shows "healthy" (not "unhealthy")
    - Run `docker logs technovastore-product-service` to check for errors
    - Verify MongoDB and Redis connections are reported as "connected"
    - Verify no ERROR level logs in output
    - _Requirements: 4.1, 4.2, 4.3_

- [-] 8. Verify Auto Purchase Service Connection to Order Service
  - [-] 8.1 Check Auto Purchase Order Service URL configuration
    - Open `automation/auto-purchase/src/services/orderService.ts`
    - Verify ORDER_SERVICE_URL uses correct hostname
    - Should be "http://order-service:3000" not "localhost"
    - _Requirements: 5.1, 5.2_

  - [-] 8.2 Add ORDER_SERVICE_URL environment variable if missing
    - Update docker-compose.optimized.yml
    - Add ORDER_SERVICE_URL: "http://order-service:3000"
    - Apply to docker-compose.prod.yml as well
    - _Requirements: 5.1, 5.2_

  - [-] 8.3 Test Auto Purchase to Order Service communication
    - Verify Auto Purchase can reach Order Service
    - Run `docker logs technovastore-auto-purchase` to check for errors
    - Verify no "Order Service API Response Error" messages in logs
    - Test creating a test order through Auto Purchase if endpoint available
    - Run `docker ps` to confirm both containers are running
    - Verify no ERROR level logs in output
    - _Requirements: 5.1, 5.2, 5.3_

- [-] 9. Add OpenAPI Documentation to API Gateway
  - [-] 9.1 Create basic OpenAPI specification file
    - Create `docs/api/openapi.yaml`
    - Add basic structure with info, servers, and paths
    - Include health check endpoint definition
    - Add placeholder paths for main services
    - _Requirements: 8.1, 8.2_

  - [-] 9.2 Verify API Gateway loads OpenAPI file
    - Run `docker logs technovastore-api-gateway` to check for file loading
    - Ensure no warnings about missing openapi.yaml in logs
    - Test /api-docs endpoint if Swagger UI is enabled: `curl http://localhost:3000/api-docs`
    - Run `docker ps` to confirm container is running
    - Verify no ERROR level logs in output
    - _Requirements: 8.1, 8.2, 8.3_

  - [-] 9.3 Expand OpenAPI documentation with service endpoints
    - Document Order Service endpoints
    - Document User Service endpoints
    - Document Payment Service endpoints
    - Document Product Service endpoints
    - _Requirements: 8.1, 8.2_

- [-] 10. Fix Alertmanager Configuration
  - [-] 10.1 Update Alertmanager YAML configuration
    - Open `infrastructure/alertmanager/alertmanager.yml`
    - Locate lines 29-30 and 43-44 with invalid fields
    - Replace "subject" and "body" fields with valid Alertmanager 0.26 format
    - Use "headers.Subject" and "text" instead
    - _Requirements: 6.1, 6.2_

  - [-] 10.2 Verify Alertmanager configuration syntax
    - Validate YAML syntax
    - Check against Alertmanager 0.26 schema
    - Ensure no unmarshal errors
    - _Requirements: 6.1, 6.2_

  - [-] 10.3 Verify Alertmanager startup
    - Run `docker ps` and check Alertmanager is "running" (not "restarting")
    - Run `docker logs technovastore-alertmanager` to check for errors
    - Verify "Loading configuration file" succeeds without unmarshal errors
    - Wait 2 minutes and verify container stays in "running" state
    - Test Alertmanager UI: `curl http://localhost:9093`
    - Verify no ERROR level logs in output
    - _Requirements: 6.1, 6.2, 6.3_

- [-] 11. Fix Node Exporter for Windows
  - [-] 11.1 Comment out Node Exporter volumes in docker-compose.optimized.yml
    - Locate node-exporter service definition
    - Comment out /proc, /sys, and /rootfs volume mounts
    - Comment out related command arguments
    - Keep service definition for potential future use
    - _Requirements: 7.1, 7.2_

  - [-] 11.2 Verify Node Exporter configuration in docker-compose.prod.yml
    - Ensure volumes remain active in prod.yml (Linux environment)
    - Keep full configuration for production deployment
    - Document difference between dev and prod configs
    - _Requirements: 7.1, 7.2_

  - [-] 11.3 Verify Node Exporter behavior
    - Run `docker ps` and check Node Exporter status (should not be restarting)
    - Run `docker logs technovastore-node-exporter` to check for volume errors
    - Verify other exporters (MongoDB, PostgreSQL, Redis) are still running
    - Test Prometheus can still scrape metrics from other exporters
    - Confirm monitoring system remains functional
    - _Requirements: 7.1, 7.2, 7.3_

- [-] 12. Clean Up Obsolete Docker Compose Files
  - [-] 12.1 Remove docker-compose.yml
    - Delete docker-compose.yml from root directory
    - This file is replaced by docker-compose.optimized.yml
    - _Requirements: 10.1, 10.2_

  - [-] 12.2 Remove docker-compose.dev.yml
    - Delete docker-compose.dev.yml from root directory
    - This file is empty and unused
    - _Requirements: 10.1, 10.3_

  - [-] 12.3 Update documentation references
    - Search for references to docker-compose.yml in README.md
    - Update to reference docker-compose.optimized.yml
    - Check DEPLOYMENT.md for outdated references
    - Update docker-optimization-guide.md if needed
    - _Requirements: 10.1, 10.4_

  - [-] 12.4 Update scripts that reference old docker-compose files
    - Check scripts/ directory for docker-compose.yml references
    - Update to use docker-compose.optimized.yml
    - Test scripts still work after changes
    - _Requirements: 10.1, 10.4_

- [-] 13. Implement Frontend Missing Routes
  - [-] 13.1 Create /registro page in Frontend
    - Create `frontend/src/app/registro/page.tsx`
    - Implement basic registration form
    - Add routing configuration if needed
    - _Requirements: 9.1_

  - [-] 13.2 Create /categorias page in Frontend
    - Create `frontend/src/app/categorias/page.tsx`
    - Implement basic categories listing
    - Add routing configuration if needed
    - _Requirements: 9.1_

  - [-] 13.3 Add /api/metrics endpoint to Frontend
    - Create `frontend/src/app/api/metrics/route.ts`
    - Implement basic Prometheus metrics export
    - Or document that this endpoint is intentionally not implemented
    - _Requirements: 9.1, 9.3_

- [-] 14. Validate Docker Compose Files
  - [-] 14.1 Create docker-compose validation script
    - Create `scripts/validate-docker-compose.ps1`
    - Add validation for docker-compose.optimized.yml
    - Add validation for docker-compose.prod.yml
    - Add validation for docker-compose.staging.yml
    - _Requirements: 11.1, 11.2_

  - [-] 14.2 Run validation on all docker-compose files
    - Execute validation script
    - Fix any syntax errors found
    - Ensure all files pass docker-compose config check
    - _Requirements: 11.1, 11.2_

- [-] 15. Test Service Health Checks
  - [-] 15.1 Create service health check test script
    - Create `scripts/test-all-health-checks.ps1`
    - Add checks for all critical services
    - Include timeout and retry logic
    - _Requirements: 11.1, 11.4_

  - [-] 15.2 Start all services with docker-compose.optimized.yml
    - Run `docker-compose -f docker-compose.optimized.yml up -d`
    - Wait 30 seconds for services to initialize
    - _Requirements: 11.1, 11.2_

  - [-] 15.3 Execute health check tests on all services
    - Test Order Service health endpoint
    - Test User Service health endpoint
    - Test Payment Service health endpoint
    - Test Product Service health endpoint
    - Test Sync Engine health endpoint
    - Test Shipment Tracker health endpoint
    - Test Recommender Service health endpoint
    - _Requirements: 11.1, 11.4_

  - [-] 15.4 Verify service stability over time
    - Monitor services for 5 minutes
    - Check for any restart loops
    - Verify no containers crash
    - Check docker stats for memory usage
    - _Requirements: 11.1, 11.6_

- [-] 16. Test Service Communication
  - [-] 16.1 Test API Gateway routing to backend services
    - Send request to /api/order/health through API Gateway
    - Send request to /api/user/health through API Gateway
    - Send request to /api/payment/health through API Gateway
    - Send request to /api/product/health through API Gateway
    - Verify all return 200 status
    - _Requirements: 11.1, 11.3_

  - [-] 16.2 Test Auto Purchase to Order Service communication
    - Check Auto Purchase logs for successful Order Service calls
    - Verify no "Order Service API Response Error" messages
    - Test creating a test order if endpoint available
    - _Requirements: 5.1, 5.2, 5.3_

  - [-] 16.3 Test Frontend to API Gateway communication
    - Access Frontend at http://localhost:3011
    - Verify pages load correctly
    - Check browser console for API errors
    - Test basic navigation
    - _Requirements: 11.1, 11.3_

- [-] 17. Verify Monitoring Stack
  - [-] 17.1 Verify Prometheus is scraping metrics
    - Access Prometheus at http://localhost:9090
    - Check targets page shows all services as "UP"
    - Verify metrics are being collected
    - _Requirements: 11.1, 11.4_

  - [-] 17.2 Verify Grafana dashboards
    - Access Grafana at http://localhost:3013
    - Login with admin/REDACTED_GRAFANA_PASSWORD
    - Check that dashboards load
    - Verify data is displayed
    - _Requirements: 11.1, 11.4_

  - [-] 17.3 Verify exporters are working
    - Check MongoDB exporter metrics
    - Check PostgreSQL exporter metrics
    - Check Redis exporter metrics
    - Verify Alertmanager is running (not restarting)
    - _Requirements: 6.1, 6.2, 6.3, 11.1_

- [-] 18. Final System Validation
  - [-] 18.1 Run complete system health check
    - Execute `docker-compose -f docker-compose.optimized.yml ps`
    - Verify at least 15 of 18 services show "healthy" or "running"
    - Document any services still having issues
    - _Requirements: 11.1, 11.2_

  - [-] 18.2 Check logs for critical errors
    - Review logs of all critical services
    - Ensure no ERROR level messages for startup
    - Document any remaining warnings
    - _Requirements: 11.1, 11.4_

  - [-] 18.3 Verify resource usage is within limits
    - Run `docker stats` to check memory usage
    - Ensure no service exceeds memory limits
    - Verify CPU usage is reasonable
    - Check that Recommender uses ~800MB (not exceeding 1GB)
    - _Requirements: 3.1, 3.2, 3.4, 11.1_

  - [-] 18.4 Create final validation report
    - Document number of services healthy vs total
    - List any remaining issues with severity
    - Provide recommendations for future improvements
    - Update DIAGNOSTICO-CONTENEDORES.md with new status
    - _Requirements: 11.1, 11.2, 11.4, 11.5, 11.6_
