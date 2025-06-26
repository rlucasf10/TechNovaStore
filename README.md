# TechNovaStore

Tienda online automatizada de productos tecnológicos e informáticos

## Descripción
TechNovaStore es una tienda online pensada para generar ingresos pasivos sin necesidad de local físico. El objetivo es ofrecer productos de tecnología e informática (accesorios, componentes, gadgets, ciberseguridad, etc.) comprados automáticamente en proveedores como Amazon, AliExpress, Banggood, eBay, Newegg y tiendas locales, para luego enviarlos directamente al cliente final. Todo el proceso está automatizado mediante scripts, APIs y herramientas open-source.

## Características principales
- **Sincronización automática de productos y precios** con los proveedores.
- **Compra automática** en el proveedor tras la venta en la tienda.
- **Comparador de precios** y actualización automática en la web.
- **Seguimiento de envíos y alertas** para el cliente.
- **Chatbot IA y recomendador de productos**.
- **Generación automática de facturas y sistema de tickets**.
- **Interfaz web moderna, profesional y escalable**.
- **100% open-source y sin dependencias de APIs de pago**.

## Nicho de productos
- Accesorios de ordenador (ratones, teclados, hubs...)
- Componentes (RAM, SSD, CPUs...)
- Gadgets electrónicos (smartwatches, cámaras, gadgets para casa...)
- Seguridad cibernética (USB Rubber Ducky, Firewalls, tarjetas Yubikey...)

## Proveedores objetivo
- Amazon (afiliados)
- AliExpress
- Banggood
- eBay
- Newegg
- Tiendas locales (PcComponentes, Coolmod...)

## Roadmap técnico por fases
1. **v1:** Sincronización de productos y precios
2. **v2:** Compra automática al proveedor
3. **v3:** Seguimiento de envíos y alertas
4. **v4:** Chatbot IA + recomendador

## Stack tecnológico
- **Backend:** Node.js, Express, MongoDB, PostgreSQL
- **Frontend:** React (o Next.js), diseño moderno y responsive
- **Automatización:** Scraping, APIs públicas, scripts personalizados
- **Contenedores:** Docker, docker-compose
- **Gestión de datos:** MongoDB Compass, PgAdmin

## Instalación y uso local
1. Clona el repositorio:
   ```bash
   git clone https://github.com/tuusuario/TechNovaStore.git
   cd TechNovaStore
   ```
2. Levanta los servicios con Docker Compose:
   ```bash
   cd infrastructure/docker
   docker-compose up --build
   ```
3. Accede a las GUIs de MongoDB y PostgreSQL para gestionar los datos.
4. Accede a la web en `http://localhost:3000` (o el puerto configurado).

## Contribución
- Pull requests y sugerencias son bienvenidas.
- Todo el código es open-source.

## Licencia
MIT

## Notas
- El proyecto está en desarrollo y se irá ampliando por fases.
- No requiere hosting ni dominio propio en la primera fase (funciona en local).
- Las APIs y scripts son gratuitos y open-source.

---

**¿Por qué TechNovaStore?**
- Automatiza tu tienda online y genera ingresos pasivos.
- Escalable, profesional y fácil de mantener.
- Sin costes ocultos ni dependencias de servicios de pago.

---

> _"TechNovaStore: tu tienda tecnológica automatizada, sin límites."_
