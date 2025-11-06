# 🚀 Poblar Base de Datos con Productos Gratuitos

## ⚡ Ejecución Rápida (1 minuto)

```bash
# Desde la raíz del proyecto
node scripts/populate-free-products.js
```

**¡Eso es todo!** En 30-60 segundos tendrás ~50 productos en tu base de datos.

---

## 📋 Requisitos

- ✅ MongoDB corriendo (puerto 27017)
- ✅ Node.js instalado
- ✅ Conexión a internet

**NO necesitas:**
- ❌ API keys
- ❌ Registros
- ❌ Tarjetas de crédito
- ❌ Configuración compleja

---

## 🎯 ¿Qué hace este script?

1. **Conecta a MongoDB** (localhost:27017)
2. **Descarga productos** de APIs gratuitas:
   - FakeStore API → Electrónica (~6 productos)
   - DummyJSON → Laptops (~5 productos)
   - DummyJSON → Smartphones (~5 productos)
   - DummyJSON → Tablets (~5 productos)
3. **Guarda en MongoDB** con toda la información
4. **Listo!** Ya puedes ver productos en tu frontend

---

## 📦 Productos Incluidos

### Electrónica (FakeStore)
- Discos duros externos
- Tarjetas SSD
- Cables y accesorios
- ~6 productos

### Laptops (DummyJSON)
- MacBook Pro
- Dell XPS
- HP Pavilion
- Lenovo ThinkPad
- ~5 productos

### Smartphones (DummyJSON)
- iPhone
- Samsung Galaxy
- Google Pixel
- OnePlus
- ~5 productos

### Tablets (DummyJSON)
- iPad
- Samsung Tab
- Amazon Fire
- ~5 productos

**Total: ~20-25 productos reales con imágenes**

---

## 🔧 Configuración Avanzada

### Cambiar MongoDB URI

```bash
# Por defecto usa: mongodb://localhost:27017/technovastore

# Para usar otra URI:
MONGODB_URI=mongodb://usuario:password@host:puerto/database node scripts/populate-free-products.js
```

### Usar con Docker

```bash
# Si MongoDB está en Docker
docker-compose -f docker-compose.optimized.yml up -d mongodb

# Esperar 5 segundos y ejecutar
node scripts/populate-free-products.js
```

---

## 📊 Salida Esperada

```
🚀 Iniciando población de base de datos con productos gratuitos...

📡 APIs utilizadas:
   - FakeStore API (https://fakestoreapi.com)
   - DummyJSON (https://dummyjson.com)
   - 100% GRATIS, sin API keys necesarias

🔌 Conectando a MongoDB...
✅ Conectado a MongoDB

📦 Obteniendo productos de FakeStore API...
✅ 6 productos de FakeStore obtenidos

💻 Obteniendo laptops de DummyJSON...
✅ 5 laptops obtenidos

📱 Obteniendo smartphones de DummyJSON...
✅ 5 smartphones obtenidos

📱 Obteniendo tablets de DummyJSON...
✅ 5 tablets obtenidos

💾 Guardando 21 productos en MongoDB...

==================================================
🎉 ¡Población completada exitosamente!
==================================================
📊 Estadísticas:
   - Productos nuevos: 21
   - Productos actualizados: 0
   - Errores: 0
   - Total en base de datos: 21
==================================================

📦 Ejemplos de productos agregados:

1. WD 2TB Elements Portable External Hard Drive
   SKU: FS-9
   Precio: €73.6
   Marca: WD
   Categoría: electronica

2. MacBook Pro
   SKU: DJ-LAPTOPS-6
   Precio: €2098.8
   Marca: Apple
   Categoría: portatiles

3. iPhone 9
   SKU: DJ-SMARTPHONES-1
   Precio: €659.88
   Marca: Apple
   Categoría: smartphones

✅ ¡Listo! Tu tienda ya tiene productos para mostrar.
🌐 Visita http://localhost:3011/productos para verlos

👋 Desconectado de MongoDB
```

---

## 🔄 Ejecutar Múltiples Veces

El script es **idempotente**:
- Si ejecutas varias veces, **actualiza** productos existentes
- No crea duplicados
- Puedes ejecutarlo cuando quieras para refrescar datos

```bash
# Primera vez: Crea 21 productos
node scripts/populate-free-products.js

# Segunda vez: Actualiza los 21 productos
node scripts/populate-free-products.js
```

---

## 🐛 Solución de Problemas

### Error: Cannot connect to MongoDB

```bash
# Verificar que MongoDB esté corriendo
docker ps | grep mongodb

# O iniciar MongoDB
docker-compose -f docker-compose.optimized.yml up -d mongodb
```

### Error: Module not found

```bash
# Instalar dependencias
npm install mongoose axios
```

### Error: Network timeout

```bash
# Las APIs gratuitas a veces son lentas
# Simplemente ejecuta de nuevo el script
node scripts/populate-free-products.js
```

---

## 🎨 Ver los Productos

Una vez ejecutado el script:

1. **Frontend:** http://localhost:3011/productos
2. **API:** http://localhost:3001/api/products
3. **MongoDB:** Conectar con MongoDB Compass a `mongodb://localhost:27017`

---

## 🚀 Próximos Pasos

Después de poblar la base de datos:

1. ✅ Ver productos en el frontend
2. ✅ Probar búsqueda y filtros
3. ✅ Agregar productos al carrito
4. ✅ Probar el checkout

**¡Tu tienda ya está lista para demostrar!** 🎉

---

## 📝 Notas

- **APIs usadas son 100% gratuitas**
- **No requieren registro ni API keys**
- **Límites:** Ilimitados para FakeStore y DummyJSON
- **Imágenes:** Incluidas en las respuestas de las APIs
- **Datos:** Productos reales con descripciones y especificaciones

---

## 🆘 Ayuda

Si tienes problemas:

1. Verifica que MongoDB esté corriendo
2. Verifica conexión a internet
3. Revisa los logs del script
4. Ejecuta de nuevo (es seguro)

**¿Necesitas más productos?**

Edita el script y agrega más categorías de DummyJSON:
```javascript
const furniture = await fetchFromDummyJSON('furniture');
const beauty = await fetchFromDummyJSON('beauty');
// etc.
```

Ver categorías disponibles: https://dummyjson.com/products/categories
