# API de Catálogo de Cursos — NestJS

API REST (Courses, Students, Enrollments) construída com NestJS + TypeScript.

## Como rodar

```bash
npm install
npm run start:dev   # http://localhost:3000
```

A porta pode ser alterada com a variável `PORT`.

Verifique: `curl http://localhost:3000/health` → `{"status":"ok"}`

## Scripts

| Script               | Descrição                    |
| -------------------- | ---------------------------- |
| `npm run start:dev`  | Servidor com reload          |
| `npm run build`      | Compila para `dist/`         |
| `npm run start:prod` | Executa o build              |
| `npm test`           | Testes unitários (Vitest)    |
| `npm run test:e2e`   | Testes e2e (supertest)       |

## Estrutura

```
src/
├── main.ts            # bootstrap + CORS
├── app.module.ts      # módulo raiz
└── app.controller.ts  # GET /health
```
