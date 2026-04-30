# Oficios

Monorepo JavaScript para el MVP definido en `AGENTS.md`.

## Apps

- `apps/api`: REST API con Express + Sequelize + PostgreSQL
- `apps/mobile`: app mobile con Expo + React Native

## Packages

- `packages/domain`: enums y helpers de dominio
- `packages/contracts`: contratos Zod compartidos
- `packages/config`: validación de variables de entorno

## Puesta en marcha

1. `npm install`
2. Copiar y completar:
   - `apps/api/.env.example` -> `apps/api/.env`
   - `apps/mobile/.env.example` -> `apps/mobile/.env`
3. Ejecutar API: `npm run dev:api`
4. Seed inicial: `npm run db:seed`
5. Ejecutar mobile: `npm run dev:mobile`
