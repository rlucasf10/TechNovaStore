# Estructura de Carpetas del Proyecto

## Estructura Completa Después de la Implementación

```
technovastore/
├── ai-services/
│   └── chatbot/
│       ├── src/
│       │   ├── adapters/              # NUEVO
│       │   │   └── OllamaAdapter.ts
│       │   │
│       │   ├── fallback/              # NUEVO
│       │   │   └── SimpleFallbackRecognizer.ts
│       │   │
│       │   ├── prompts/               # NUEVO
│       │   │   └── SystemPrompt.ts
│       │   │
│       │   ├── metrics/               # NUEVO
│       │   │   └── MetricsCollector.ts
│       │   │
│       │   ├── knowledge/             # EXISTENTE (sin cambios)
│       │   │   └── ProductKnowledgeBase.ts
│       │   │
│       │   ├── services/              # EXISTENTE (sin cambios)
│       │   │   └── EscalationIntegration.ts
│       │   │
│       │   ├── tests/                 # MODIFICADO
│       │   │   ├── unit/              # NUEVO
│       │   │   │   ├── OllamaAdapter.test.ts
│       │   │   │   └── SimpleFallbackRecognizer.test.ts
│       │   │   │
│       │   │   ├── integration/       # NUEVO
│       │   │   │   └── ollama-integration.test.ts
│       │   │   │
│       │   │   ├── load/              # NUEVO
│       │   │   │   └── chatbot-load.test.ts
│       │   │   │
│       │   │   └── setup.ts           # EXISTENTE
│       │   │
│       │   ├── nlp/                   # ELIMINAR (obsoleto)
│       │   │   ├── spacyProcessor.py  # ELIMINAR
│       │   │   └── NLPProcessor.ts    # ELIMINAR
│       │   │
│       │   ├── intent/                # ELIMINAR (obsoleto)
│       │   │   └── IntentRecognizer.ts # ELIMINAR
│       │   │
│       │   ├── ChatbotService.ts      # MODIFICAR
│       │   ├── NLPEngine.ts           # MODIFICAR
│       │   └── index.ts               # MODIFICAR
│       │
│       ├── docs/                      # NUEVO
│       │   ├── SOCKET_API.md
│       │   ├── USER_GUIDE.md
│       │   └── PHI3_EXPECTATIONS.md
│       │
│       ├── dist/                      # EXISTENTE (generado)
│       ├── node_modules/              # EXISTENTE (generado)
│       ├── .env.example               # MODIFICAR
│       ├── Dockerfile                 # MODIFICAR (sin Python)
│       ├── Dockerfile.prod            # MODIFICAR (sin Python)
│       ├── package.json               # MODIFICAR
│       ├── tsconfig.json              # EXISTENTE
│       ├── jest.config.js             # EXISTENTE
│       └── README.md                  # MODIFICAR
│
├── infrastructure/
│   ├── ollama/                        # NUEVO
│   │   └── init-ollama.sh
│   │
│   ├── mongodb/                       # EXISTENTE
│   ├── postgresql/                    # EXISTENTE
│   ├── prometheus/                    # EXISTENTE
│   ├── grafana/                       # EXISTENTE
│   ├── logstash/                      # EXISTENTE
│   ├── kibana/                        # EXISTENTE
│   └── alertmanager/                  # EXISTENTE
│
├── .kiro/
│   └── specs/
│       └── ollama-phi3-conversational-chatbot/
│           ├── requirements.md
│           ├── design.md
│           ├── tasks.md
│           ├── CHANGELOG.md
│           └── FOLDER_STRUCTURE.md    # ESTE ARCHIVO
│
└── docker-compose.yml                 # MODIFICAR
```

## Carpetas Nuevas a Crear

### 1. `ai-services/chatbot/src/adapters/`
**Propósito:** Contiene adaptadores para servicios externos
**Archivos:**
- `OllamaAdapter.ts` - Comunicación con Ollama API

### 2. `ai-services/chatbot/src/fallback/`
**Propósito:** Sistema de fallback sin dependencias Python
**Archivos:**
- `SimpleFallbackRecognizer.ts` - Reconocimiento básico de intenciones

### 3. `ai-services/chatbot/src/prompts/`
**Propósito:** Templates de prompts para LLM
**Archivos:**
- `SystemPrompt.ts` - System prompt especializado en e-commerce

### 4. `ai-services/chatbot/src/metrics/`
**Propósito:** Sistema de métricas y monitoreo
**Archivos:**
- `MetricsCollector.ts` - Recolección de métricas de Ollama

### 5. `ai-services/chatbot/src/tests/unit/`
**Propósito:** Tests unitarios
**Archivos:**
- `OllamaAdapter.test.ts`
- `SimpleFallbackRecognizer.test.ts`

### 6. `ai-services/chatbot/src/tests/integration/`
**Propósito:** Tests de integración
**Archivos:**
- `ollama-integration.test.ts`

### 7. `ai-services/chatbot/src/tests/load/`
**Propósito:** Tests de carga
**Archivos:**
- `chatbot-load.test.ts`

### 8. `ai-services/chatbot/docs/`
**Propósito:** Documentación del chatbot
**Archivos:**
- `SOCKET_API.md` - Documentación de API Socket.IO
- `USER_GUIDE.md` - Guía de usuario
- `PHI3_EXPECTATIONS.md` - Expectativas de Phi-3 Mini

### 9. `infrastructure/ollama/`
**Propósito:** Scripts de inicialización de Ollama
**Archivos:**
- `init-ollama.sh` - Script para descargar modelo Phi-3 Mini

## Carpetas a Eliminar

### 1. `ai-services/chatbot/src/nlp/` (si queda vacía)
**Razón:** Ya no usamos spaCy (Python)
**Archivos a eliminar:**
- `spacyProcessor.py`
- `NLPProcessor.ts`

### 2. `ai-services/chatbot/src/intent/` (si queda vacía)
**Razón:** IntentRecognizer depende de spaCy
**Archivos a eliminar:**
- `IntentRecognizer.ts`

## Archivos a Modificar

### Archivos Core
- `ai-services/chatbot/src/ChatbotService.ts` - Agregar streaming Socket.IO
- `ai-services/chatbot/src/NLPEngine.ts` - Integrar Ollama y SimpleFallbackRecognizer
- `ai-services/chatbot/src/index.ts` - Actualizar imports

### Configuración
- `ai-services/chatbot/.env.example` - Agregar variables Ollama
- `ai-services/chatbot/package.json` - Actualizar dependencias
- `ai-services/chatbot/Dockerfile` - Remover Python/spaCy
- `ai-services/chatbot/Dockerfile.prod` - Remover Python/spaCy
- `docker-compose.yml` - Agregar servicio Ollama

### Documentación
- `ai-services/chatbot/README.md` - Actualizar con nueva arquitectura

## Archivos Sin Cambios

### Mantener Como Están
- `ai-services/chatbot/src/knowledge/ProductKnowledgeBase.ts` ✅
- `ai-services/chatbot/src/services/EscalationIntegration.ts` ✅
- `ai-services/chatbot/tsconfig.json` ✅
- `ai-services/chatbot/jest.config.js` ✅

## Convenciones de Nombres

### Archivos TypeScript
- **Clases:** PascalCase - `OllamaAdapter.ts`, `SimpleFallbackRecognizer.ts`
- **Tests:** PascalCase + `.test.ts` - `OllamaAdapter.test.ts`
- **Interfaces:** PascalCase en el mismo archivo de la clase

### Carpetas
- **Minúsculas:** `adapters/`, `fallback/`, `prompts/`, `metrics/`
- **Plural cuando contiene múltiples archivos:** `tests/`, `docs/`

### Scripts
- **Kebab-case:** `init-ollama.sh`
- **Extensión:** `.sh` para bash scripts

### Documentación
- **MAYÚSCULAS:** `README.md`, `CHANGELOG.md`, `SOCKET_API.md`
- **Snake_case para multi-palabra:** `USER_GUIDE.md`, `PHI3_EXPECTATIONS.md`

## Checklist de Organización

Antes de hacer commit, verificar:

- [ ] Todos los archivos nuevos están en sus carpetas correctas
- [ ] Carpetas obsoletas (`nlp/`, `intent/`) han sido eliminadas
- [ ] Tests están organizados en `unit/`, `integration/`, `load/`
- [ ] Documentación está en carpeta `docs/`
- [ ] Scripts están en `infrastructure/ollama/`
- [ ] No hay archivos sueltos en `src/` raíz
- [ ] Imports actualizados para reflejar nueva estructura
- [ ] `.gitignore` actualizado si es necesario

## Notas Importantes

1. **No crear carpetas vacías en Git:** Git no trackea carpetas vacías. Las carpetas se crearán automáticamente al crear el primer archivo.

2. **Mantener estructura plana en `src/`:** No crear sub-carpetas innecesarias. Solo crear carpetas cuando hay múltiples archivos relacionados.

3. **Tests junto al código:** Aunque los tests están en `src/tests/`, esto facilita el import de módulos internos.

4. **Documentación separada:** La carpeta `docs/` mantiene la documentación separada del código.

5. **Scripts de infraestructura:** Scripts de inicialización van en `infrastructure/` no en el código del servicio.
