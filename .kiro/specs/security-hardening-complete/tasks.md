# Plan de Implementación - Hardening de Seguridad Completo

## Fase 1: Eliminar Secretos Hardcodeados

- [x] 1. Eliminar JWT_SECRET hardcodeado (5 archivos)






  - [x] 1.1 `domains/platform/api-gateway/config/index.ts` - Eliminar fallback, añadir validación obligatoria


  - [x] 1.2 `domains/customer/user-service/config/index.ts` - Eliminar fallback, añadir validación obligatoria

  - [x] 1.3 `domains/commerce/payment-service/config/index.ts` - Eliminar fallback, añadir validación obligatoria


  - [x] 1.4 `domains/commerce/auto-purchase-service/shared/middleware/auth.ts` - Eliminar fallback, añadir validación obligatoria



  - [x] 1.5 `shared/infrastructure/config/src/environment.ts` - Eliminar fallback, añadir validación obligatoria

  - _Requirements: 1.1-1.6_

- [x] 2. Eliminar POSTGRES_PASSWORD hardcodeado (6 archivos)





  - [x] 2.1 `domains/customer/user-service/config/index.ts` - Eliminar fallback 'postgres'


  - [x] 2.2 `domains/customer/notification-service/index.ts` - Eliminar fallback 'postgres'



  - [x] 2.3 `domains/commerce/payment-service/config/index.ts` - Eliminar fallback 'technovastore123'


  - [x] 2.4 `domains/commerce/campaign-manager-service/shared/utils/database.ts` - Eliminar fallback 'password'



  - [x] 2.5 `domains/commerce/campaign-manager-service/scripts/migrate-campaigns.ts` - Eliminar fallback 'password'

  - [x] 2.6 `shared/infrastructure/config/src/environment.ts` - Eliminar fallback 'password'


  - _Requirements: 2.1-2.6_

- [x] 3. Eliminar JWT_REFRESH_SECRET y REDIS_PASSWORD hardcodeados (2 archivos)





  - [x] 3.1 `shared/infrastructure/config/src/environment.ts` - Eliminar fallback de JWT_REFRESH_SECRET



  - [x] 3.2 `domains/platform/api-gateway/shared/utils/redis.ts` - Eliminar fallback 'password' de REDIS_PASSWORD

  - _Requirements: 4.1, 4.2, 5.1, 5.2_

## Fase 2: Reemplazar console.log en Middlewares de Autenticación (3 archivos)

- [x] 4. Migrar console.log a logger estructurado en middlewares de auth








  - [x] 4.1 `domains/catalog/product-service/shared/middleware/auth.ts` - 7 instancias

  - [x] 4.2 `domains/support/shipment-tracker/shared/middleware/auth.ts` - 2 instancias


  - [x] 4.3 `domains/commerce/campaign-manager-service/shared/middleware/auth.ts` - 2 instancias

  - _Requirements: 3.1-3.5_

## Fase 3: Reemplazar console.log en Backend - Servicios Principales

- [-] 5. Migrar console.log en chatbot-service (15 archivos, 100+ instancias)



  - [x] 5.1 `index.ts` - 15+ instancias



  - [x] 5.2 `api/ChatbotController.ts` - 7 instancias

  - [x] 5.3 `api/SocketServer.ts` - 5+ instancias



  - [x] 5.4 `process-message/ProcessMessage.ts` - 15+ instancias




  - [ ] 5.5 `generate-response/GenerateResponse.ts` - 4 instancias
  - [x] 5.6 `manage-session/ManageSession.ts` - 2 instancias


  - [x] 5.7 `use-simple-fallback/UseSimpleFallback.ts` - 10+ instancias

  - [x] 5.8 `process-with-gemini/ProcessWithGemini.ts` - 8 instancias



  - [x] 5.9 `retrieve-products-rag/RetrieveProductsRAG.ts` - 10+ instancias

  - [x] 5.10 `shared/knowledge/ProductKnowledgeBase.ts` - 6 instancias



  - [x] 5.11 `shared/clients/OllamaAdapter.ts` - 10+ instancias

  - [x] 5.12 `shared/clients/GeminiAdapter.ts` - 6 instancias



  - [x] 5.13 `shared/recognizers/SimpleFallbackRecognizer.ts` - 1 instancia


  - [x] 5.14 `shared/services/EscalationIntegration.ts` - 1 instancia


  - [x] 5.15 `shared/MetricsCollector.ts` - 2 instancias


  - _Requirements: 6.1_

- [x] 6. Migrar console.log en shipment-tracker (12 archivos, 40+ instancias)






  - [x] 6.1 `index.ts` - 8 instancias



  - [x] 6.2 `update-tracking-info/UpdateTrackingInfo.ts` - 5 instancias


  - [x] 6.3 `update-all-active-shipments/UpdateAllActiveShipments.ts` - 5 instancias

  - [x] 6.4 `shared/utils/DelayChecker.ts` - 1 instancia




  - [x] 6.5 `shared/providers/AliExpressTrackingProvider.ts` - 1 instancia


  - [x] 6.6 `shared/providers/BanggoodTrackingProvider.ts` - 1 instancia


  - [x] 6.7 `shared/providers/BaseTrackingProvider.ts` - 1 instancia


  - [x] 6.8 `shared/providers/eBayTrackingProvider.ts` - 1 instancia


  - [x] 6.9 `shared/providers/NeweggTrackingProvider.ts` - 1 instancia




  - [x] 6.10 `shared/providers/AmazonTrackingProvider.ts` - 1 instancia

  - [x] 6.11 `shared/clients/UserNotificationClient.ts` - 2 instancias


  - [x] 6.12 `shared/clients/NotificationService.ts` - 6 instancias



  - [x] 6.13 `shared/middleware/errorHandler.ts` - 1 instancia

  - _Requirements: 6.2_

- [x] 7. Migrar console.log en campaign-manager-service (5 archivos, 25+ instancias)






  - [x] 7.1 `index.ts` - 5 instancias




  - [x] 7.2 `config/index.ts` - 7 instancias


  - [x] 7.3 `shared/clients/ProductServiceClient.ts` - 1 instancia


  - [x] 7.4 `shared/clients/NotificationServiceClient.ts` - 8 instancias
  - [x] 7.5 `scripts/migrate-campaigns.ts` - 12 instancias (script de migración)

  - _Requirements: 6.3_

- [x] 8. Migrar console.log en notification-service (10 archivos, 30+ instancias)




  - [x] 8.1 `index.ts` - 10 instancias


  - [x] 8.2 `shared/email/EmailService.ts` - 4 instancias



  - [x] 8.3 `send-shipment-status/SendShipmentStatus.ts` - 2 instancias
  - [x] 8.4 `send-order-confirmation/SendOrderConfirmation.ts` - 2 instancias





  - [x] 8.5 `send-order-cancellation/SendOrderCancellation.ts` - 2 instancias
  - [x] 8.6 `send-payment-confirmation/SendPaymentConfirmation.ts` - 2 instancias


  - [x] 8.7 `send-invoice-generated/SendInvoiceGenerated.ts` - 2 instancias


  - [x] 8.8 `send-delay-alert/SendDelayAlert.ts` - 2 instancias


  - [x] 8.9 `check-delivery-delays/DelayScheduler.ts` - 5 instancias



  - [x] 8.10 `check-delivery-delays/CheckDeliveryDelays.ts` - 4 instancias

  - _Requirements: 6.4_

- [x] 9. Migrar console.log en sync-engine (5 archivos, 50+ instancias)

  - [x] 9.1 `index.ts` - 20+ instancias





  - [x] 9.2 `update-dynamic-price/UpdateDynamicPrice.ts` - 3 instancias
  - [x] 9.3 `health-check/HealthCheck.ts` - 3 instancias


  - [x] 9.4 `trigger-price-update/TriggerPriceUpdate.ts` - 3 instancias

  - [x] 9.5 `shared/workers/SyncWorker.ts` - 25+ instancias



  - [x] 9.6 `shared/scheduler/SyncScheduler.ts` - 15+ instancias



  - _Requirements: 6.5_

- [x] 10. Migrar console.log en otros servicios backend (6 archivos)









  - [x] 10.1 `domains/support/ticket-service/shared/utils/logger.ts` - 1 instancia

  - [x] 10.2 `domains/support/ticket-service/shared/repositories/migrationRunner.ts` - 10 instancias


  - [x] 10.3 `domains/support/ticket-service/create-satisfaction-survey/CreateSatisfactionSurvey.ts` - 1 instancia



  - [x] 10.4 `domains/commerce/payment-service/shared/clients/UserNotificationClient.ts` - 2 instancias


  - [x] 10.5 `domains/commerce/order-service/shared/clients/UserNotificationClient.ts` - 2 instancias


  - [x] 10.6 `domains/commerce/auto-purchase-service/select-provider/SelectProvider.ts` - 1 instancia

  - _Requirements: 6.5_

- [x] 11. Migrar console.log en recommender-service (8 archivos, 15+ instancias)





  - [x] 11.1 `update-models/UpdateModels.ts` - 3 instancias



  - [x] 11.2 `record-interaction/RecordInteraction.ts` - 2 instancias


  - [x] 11.3 `shared/middleware/errorHandler.ts` - 1 instancia


  - [x] 11.4 `get-user-recommendations/GetUserRecommendations.ts` - 1 instancia


  - [x] 11.5 `get-session-recommendations/GetSessionRecommendations.ts` - 1 instancia


  - [x] 11.6 `get-trending-products/GetTrendingProducts.ts` - 1 instancia


  - [x] 11.7 `get-similar-products/GetSimilarProducts.ts` - 1 instancia


  - [x] 11.8 `api/RecommendationController.ts` - 6 instancias

  - _Requirements: 6.5_

- [x] 12. Migrar console.log en shared/domain/models (1 archivo)




  - [x] 12.1 `shared/domain/models/src/migrations/index.ts` - 4 instancias


  - _Requirements: 6.5_

## Fase 4: Crear Logger Condicional para Frontend

- [ ] 13. Crear logger condicional para el frontend
  - [ ] 13.1 Crear `domains/platform/frontend/src/shared/lib/logger.ts`
    - Logger que solo loguea en desarrollo (NODE_ENV !== 'production')
    - Exportar funciones: log, error, warn, debug, info
    - Mantener compatibilidad con secureLogger existente
  - _Requirements: 8.1_

## Fase 5: Migrar console.log en Frontend

- [ ] 14. Migrar console.log en servicios del frontend (2 archivos)
  - [ ] 14.1 `src/shared/services/chatService.ts` - 10+ instancias
  - [ ] 14.2 `src/shared/services/automationService.ts` - 5 instancias
  - _Requirements: 8.2_

- [ ] 15. Migrar console.log en API routes del frontend (11 archivos)
  - [ ] 15.1 `src/app/api/admin/[...path]/route.ts` - 12 instancias
  - [ ] 15.2 `src/app/api/products/[id]/route.ts` - 7 instancias
  - [ ] 15.3 `src/app/api/products/route.ts` - 1 instancia
  - [ ] 15.4 `src/app/api/products/featured/route.ts` - 1 instancia
  - [ ] 15.5 `src/app/api/products/search/route.ts` - 1 instancia
  - [ ] 15.6 `src/app/api/products/sku/[sku]/route.ts` - 1 instancia
  - [ ] 15.7 `src/app/api/categories/route.ts` - 1 instancia
  - [ ] 15.8 `src/app/api/campaigns/[...path]/route.ts` - 1 instancia
  - [ ] 15.9 `src/app/api/proxy/[...path]/route.ts` - 1 instancia
  - [ ] 15.10 `src/app/api/recommendations/[...path]/route.ts` - 2 instancias
  - [ ] 15.11 `src/app/api/recommender/[...path]/route.ts` - 4 instancias
  - _Requirements: 8.3_


- [ ] 16. Migrar console.log en componentes del frontend - Tickets (2 archivos)
  - [ ] 16.1 `src/features/tickets/TicketDetail.tsx` - 6 instancias
  - [ ] 16.2 `src/features/tickets/CreateTicketModal.tsx` - 1 instancia
  - _Requirements: 8.2_

- [ ] 17. Migrar console.log en componentes del frontend - Commerce (3 archivos)
  - [ ] 17.1 `src/features/commerce/components/cart/CartItem.tsx` - 2 instancias
  - [ ] 17.2 `src/features/commerce/components/cart/AddToCartButton.tsx` - 1 instancia
  - [ ] 17.3 `src/features/commerce/components/checkout/ShippingForm.tsx` - 1 instancia
  - _Requirements: 8.2_

- [ ] 18. Migrar console.log en componentes del frontend - Dashboard Usuario (12 archivos)
  - [ ] 18.1 `src/features/customer/components/dashboard/WishlistView.tsx` - 1 instancia
  - [ ] 18.2 `src/features/customer/components/dashboard/AuthMethodsManagement.tsx` - 2 instancias
  - [ ] 18.3 `src/features/customer/components/dashboard/AddressManagement.tsx` - 2 instancias
  - [ ] 18.4 `src/features/customer/components/dashboard/UserDashboard.tsx` - 5 instancias
  - [ ] 18.5 `src/features/customer/components/dashboard/SecuritySettings.tsx` - 3 instancias
  - [ ] 18.6 `src/features/customer/components/dashboard/ProfileInformation.tsx` - 2 instancias
  - [ ] 18.7 `src/features/customer/components/dashboard/PreferencesSettings.tsx` - 1 instancia
  - [ ] 18.8 `src/features/customer/components/dashboard/PaymentMethodManagement.tsx` - 3 instancias
  - [ ] 18.9 `src/features/customer/components/dashboard/RecommendationsCard.tsx` - 1 instancia
  - [ ] 18.10 `src/features/customer/components/dashboard/OrderCard.tsx` - 3 instancias
  - [ ] 18.11 `src/features/customer/components/dashboard/NotificationCenter.tsx` - 2 instancias
  - [ ] 18.12 `src/features/customer/components/dashboard/GdprDashboard.tsx` - 1 instancia
  - _Requirements: 8.2_

- [ ] 19. Migrar console.log en componentes del frontend - Auth (1 archivo)
  - [ ] 19.1 `src/features/customer/components/auth/SocialLoginButtons.tsx` - 3 instancias
  - _Requirements: 8.2_

- [ ] 20. Migrar console.log en componentes del frontend - Admin (1 archivo)
  - [ ] 20.1 `src/features/admin/components/admin/RateLimitDashboard.tsx` - 3 instancias
  - _Requirements: 8.2_

- [ ] 21. Migrar console.log en páginas del frontend - Admin Dashboard (7 archivos)
  - [ ] 21.1 `src/app/dashboard/admin/automation/page.tsx` - 2 instancias
  - [ ] 21.2 `src/app/dashboard/admin/campaigns/page.tsx` - 4 instancias
  - [ ] 21.3 `src/app/dashboard/admin/campaigns/[id]/page.tsx` - 2 instancias
  - [ ] 21.4 `src/app/dashboard/admin/campaigns/[id]/analytics/page.tsx` - 2 instancias
  - [ ] 21.5 `src/app/dashboard/admin/campaigns/[id]/edit/page.tsx` - 2 instancias
  - [ ] 21.6 `src/app/dashboard/admin/campaigns/new/page.tsx` - 1 instancia
  - [ ] 21.7 `src/app/dashboard/admin/ai-services/page.tsx` - 1 instancia
  - _Requirements: 8.2_

- [ ] 22. Migrar console.log en páginas del frontend - Otras (4 archivos)
  - [ ] 22.1 `src/app/wishlist/page.tsx` - 1 instancia
  - [ ] 22.2 `src/app/pedidos/[id]/page.tsx` - 5 instancias
  - [ ] 22.3 `src/app/productos/[id]/page.tsx` - 3 instancias
  - [ ] 22.4 `src/app/login/page.tsx` - 3 instancias
  - _Requirements: 8.2_

- [ ] 23. Migrar console.log en componentes shared del frontend (8 archivos)
  - [ ] 23.1 `src/shared/components/ui/CookieConsent.tsx` - 1 instancia
  - [ ] 23.2 `src/shared/components/layout/Sidebar.tsx` - 1 instancia
  - [ ] 23.3 `src/shared/components/layout/UserProfileDropdown.tsx` - 1 instancia
  - [ ] 23.4 `src/shared/components/home/ProductRecommenderWidget.tsx` - 2 instancias
  - [ ] 23.5 `src/shared/components/home/DealsSection.tsx` - 1 instancia (ya condicional)
  - [ ] 23.6 `src/shared/components/checkout/StreetAutocomplete.tsx` - 1 instancia
  - [ ] 23.7 `src/shared/components/checkout/ProvinceSelector.tsx` - 1 instancia
  - [ ] 23.8 `src/shared/components/checkout/MunicipalitySelector.tsx` - 2 instancias
  - _Requirements: 8.2_

- [ ] 24. Migrar console.log en servicios de features del frontend (6 archivos)
  - [ ] 24.1 `src/features/customer/services/payment-method.service.ts` - 1 instancia
  - [ ] 24.2 `src/features/customer/services/notification.service.ts` - 2 instancias
  - [ ] 24.3 `src/features/customer/services/address.service.ts` - 1 instancia
  - [ ] 24.4 `src/features/customer/lib/oauth.config.ts` - 8 instancias
  - [ ] 24.5 `src/features/catalog/services/search.service.ts` - 2 instancias
  - [ ] 24.6 `src/features/commerce/services/cart.service.ts` - 8 instancias
  - _Requirements: 8.2_

- [ ] 25. Migrar console.log en hooks de features del frontend (4 archivos)
  - [ ] 25.1 `src/features/customer/hooks/useNotifications.ts` - 3 instancias
  - [ ] 25.2 `src/features/customer/hooks/useAuth.ts` - 3 instancias
  - [ ] 25.3 `src/features/support/hooks/useTrackingUpdates.ts` - 1 instancia
  - [ ] 25.4 `src/features/support/hooks/useChatbot.ts` - 12 instancias
  - [ ] 25.5 `src/features/catalog/hooks/useSearch.ts` - 1 instancia
  - _Requirements: 8.2_

## Fase 6: Verificación Final

- [ ] 26. Verificar que todos los servicios inician correctamente
  - [ ] 26.1 Reconstruir y probar todos los servicios backend con las nuevas validaciones
  - [ ] 26.2 Verificar que el frontend funciona correctamente con el nuevo logger
  - [ ] 26.3 Verificar que no hay console.log en producción
  - _Requirements: 7.1-7.4_

- [ ] 27. Actualizar documentación de seguridad
  - [ ] 27.1 Actualizar `docs/security/SECURITY_REVIEW_FINAL.md` con todos los cambios
  - _Requirements: 7.1_

---

## Resumen de Archivos a Modificar

### Backend (80+ archivos)
- **Secretos hardcodeados**: 13 archivos
- **Middlewares de auth**: 3 archivos
- **chatbot-service**: 15 archivos
- **shipment-tracker**: 13 archivos
- **campaign-manager-service**: 5 archivos
- **notification-service**: 10 archivos
- **sync-engine**: 6 archivos
- **recommender-service**: 8 archivos
- **Otros servicios**: 7 archivos

### Frontend (70+ archivos)
- **Logger nuevo**: 1 archivo
- **Servicios shared**: 2 archivos
- **API routes**: 11 archivos
- **Componentes tickets**: 2 archivos
- **Componentes commerce**: 3 archivos
- **Componentes dashboard usuario**: 12 archivos
- **Componentes auth**: 1 archivo
- **Componentes admin**: 1 archivo
- **Páginas admin**: 7 archivos
- **Otras páginas**: 4 archivos
- **Componentes shared**: 8 archivos
- **Servicios de features**: 6 archivos
- **Hooks de features**: 5 archivos

### Total: ~150 archivos a modificar
