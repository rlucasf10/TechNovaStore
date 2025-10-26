# Contributing to TechNovaStore

## GitFlow Workflow

Este proyecto utiliza GitFlow como estrategia de branching. Por favor, sigue estas convenciones:

### Branches

- **master/main**: Rama de producción. Solo contiene código estable y listo para producción.
- **develop**: Rama de desarrollo principal. Integra todas las features completadas.
- **feature/**: Ramas para nuevas funcionalidades. Se crean desde `develop` y se fusionan de vuelta.
- **release/**: Ramas para preparar releases. Se crean desde `develop` cuando está listo para release.
- **hotfix/**: Ramas para fixes urgentes en producción. Se crean desde `master` y se fusionan a `master` y `develop`.

### Naming Conventions

#### Feature Branches
```
feature/product-sync-engine
feature/user-authentication
feature/payment-processing
```

#### Release Branches
```
release/1.0.0
release/1.1.0
```

#### Hotfix Branches
```
hotfix/critical-security-fix
hotfix/payment-gateway-error
```

### Workflow Steps

#### Desarrollar una nueva feature

1. Crear branch desde develop:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/nombre-de-la-feature
```

2. Desarrollar la feature:
```bash
# Hacer commits regulares
git add .
git commit -m "feat: implement product sync engine"
```

3. Finalizar la feature:
```bash
git checkout develop
git pull origin develop
git merge feature/nombre-de-la-feature
git branch -d feature/nombre-de-la-feature
git push origin develop
```

#### Crear un release

1. Crear branch de release:
```bash
git checkout develop
git pull origin develop
git checkout -b release/1.0.0
```

2. Preparar el release (actualizar versiones, documentación):
```bash
git add .
git commit -m "chore: prepare release 1.0.0"
```

3. Finalizar el release:
```bash
git checkout master
git merge release/1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git checkout develop
git merge release/1.0.0
git branch -d release/1.0.0
git push origin master develop --tags
```

#### Hotfix urgente

1. Crear branch de hotfix:
```bash
git checkout master
git pull origin master
git checkout -b hotfix/critical-fix
```

2. Aplicar el fix:
```bash
git add .
git commit -m "fix: resolve critical security vulnerability"
```

3. Finalizar el hotfix:
```bash
git checkout master
git merge hotfix/critical-fix
git tag -a v1.0.1 -m "Hotfix version 1.0.1"
git checkout develop
git merge hotfix/critical-fix
git branch -d hotfix/critical-fix
git push origin master develop --tags
```

## Commit Message Convention

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/) para mensajes de commit:

### Formato
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- **feat**: Nueva funcionalidad
- **fix**: Corrección de bug
- **docs**: Cambios en documentación
- **style**: Cambios de formato (espacios, comas, etc.)
- **refactor**: Refactoring de código
- **perf**: Mejoras de performance
- **test**: Agregar o modificar tests
- **chore**: Cambios en build process, herramientas auxiliares, etc.

### Ejemplos
```bash
feat(product): add product sync engine
fix(auth): resolve JWT token validation issue
docs(api): update API documentation
style(frontend): fix linting issues
refactor(order): simplify order processing logic
perf(database): optimize product queries
test(user): add user service unit tests
chore(deps): update dependencies
```

## Code Style

### ESLint y Prettier

El proyecto está configurado con ESLint y Prettier. Antes de hacer commit:

```bash
# Verificar linting
npm run lint

# Corregir automáticamente
npm run lint:fix

# Formatear código
npm run format
```

### TypeScript

- Usar TypeScript estricto
- Definir tipos explícitos cuando sea necesario
- Evitar `any` cuando sea posible
- Usar interfaces para objetos complejos

## Testing

### Ejecutar tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test -- --coverage
```

### Escribir tests

- Escribir tests para toda nueva funcionalidad
- Mantener cobertura mínima del 80%
- Usar nombres descriptivos para tests
- Seguir patrón AAA (Arrange, Act, Assert)

## Pull Requests

### Antes de crear un PR

1. Asegurarse de que todos los tests pasan
2. Verificar que el código cumple con el style guide
3. Actualizar documentación si es necesario
4. Rebase con la rama base si es necesario

### Template de PR

```markdown
## Descripción
Breve descripción de los cambios realizados.

## Tipo de cambio
- [ ] Bug fix (cambio que corrige un issue)
- [ ] Nueva feature (cambio que agrega funcionalidad)
- [ ] Breaking change (fix o feature que causa que funcionalidad existente no funcione como se esperaba)
- [ ] Cambio de documentación

## ¿Cómo se ha probado?
Describe las pruebas que ejecutaste para verificar tus cambios.

## Checklist:
- [ ] Mi código sigue el style guide del proyecto
- [ ] He realizado una auto-revisión de mi código
- [ ] He comentado mi código, particularmente en áreas difíciles de entender
- [ ] He realizado los cambios correspondientes a la documentación
- [ ] Mis cambios no generan nuevos warnings
- [ ] He agregado tests que prueban que mi fix es efectivo o que mi feature funciona
- [ ] Los tests unitarios nuevos y existentes pasan localmente con mis cambios
```

## Estructura de Commits

### Commits atómicos
- Cada commit debe representar un cambio lógico único
- Evitar commits que mezclen múltiples cambios no relacionados
- Usar commits pequeños y frecuentes

### Mensajes descriptivos
- Primera línea: resumen conciso (máximo 50 caracteres)
- Línea en blanco
- Descripción detallada si es necesario (máximo 72 caracteres por línea)

## Configuración del Entorno

### Prerrequisitos
- Node.js 18+
- Docker y Docker Compose
- Git

### Setup inicial
```bash
# Clonar el repositorio
git clone <repository-url>
cd technovastore

# Instalar dependencias
npm install

# Configurar entorno
cp .env.example .env

# Iniciar servicios
docker-compose up -d

# Ejecutar en modo desarrollo
npm run dev
```