# API de Catálogo de Cursos — NestJS

API REST (Courses, Students, Enrollments) construída com NestJS + TypeScript.

## Como rodar

```bash
npm install
cp .env.example .env     # DATABASE_URL (SQLite por padrão)
npm run migration:run    # cria o schema do zero
npm run seed             # 3 cursos e 2 estudantes
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

## Banco de dados

- ORM: TypeORM + SQLite (`better-sqlite3`), configurado por `DATABASE_URL` (ex.: `file:./data/catalog.db`).
- Entidades: `Course`, `Student` (email único), `Enrollment` (`studentId` + `courseId` únicos).
- Migrations em `src/database/migrations`.

| Script                                        | Descrição                       |
| --------------------------------------------- | ------------------------------- |
| `npm run migration:run`                       | Aplica as migrations            |
| `npm run migration:generate -- src/database/migrations/Nome` | Gera migration a partir das entidades |
| `npm run migration:revert`                    | Desfaz a última migration       |
| `npm run seed`                                | Popula dados iniciais (idempotente) |

## Arquitetura em camadas

Cada domínio é um módulo Nest com as camadas abaixo:

```
Controller  →  Service  →  Repository  →  TypeORM (entidade)
 (HTTP/DTO)   (regras)     (acesso a dados)
```

```
src/
├── main.ts / app.config.ts   # bootstrap, prefixo /api, ValidationPipe e filtro globais
├── app.module.ts             # módulo raiz (ConfigModule, TypeOrmModule)
├── common/filters/           # AllExceptionsFilter (formato único de erro)
├── courses/                  # CoursesModule: controller, service, repository, dto, entity
├── students/                 # StudentsModule
├── enrollments/              # EnrollmentsModule (usa Courses e Students)
└── database/                 # data-source (CLI), migrations, seed
```

Configuração global (`src/app.config.ts`):

- Prefixo `/api` (exceto `/health`).
- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
- `AllExceptionsFilter`: todo erro sai como `{ message, details?, path, timestamp }`.
