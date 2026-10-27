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

📖 Documentação interativa (Swagger/OpenAPI): **http://localhost:3000/docs**

## Scripts

| Script               | Descrição                    |
| -------------------- | ---------------------------- |
| `npm run start:dev`  | Servidor com reload          |
| `npm run build`      | Compila para `dist/`         |
| `npm run start:prod` | Executa o build              |
| `npm test`           | Todos os testes (unitário + e2e) |
| `npm run test:e2e`   | Apenas e2e (supertest)       |

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

## Erros

Todo erro tem o mesmo formato (`AllExceptionsFilter`):

```json
{
  "message": "Curso não encontrado",
  "path": "/api/courses/999",
  "timestamp": "2026-10-27T15:22:14.885Z"
}
```

Erros de validação trazem também `details` (lista de problemas por campo).

| Status | Quando acontece                                                            |
| ------ | -------------------------------------------------------------------------- |
| 400    | Payload/query inválido (título < 3 caracteres, e-mail inválido, campo extra, `:id` não numérico) |
| 404    | Curso, estudante ou matrícula inexistente (inclusive `studentId`/`courseId` no POST de matrícula) |
| 409    | E-mail de estudante já cadastrado; estudante já matriculado no curso       |
| 500    | Falha inesperada (detalhes só no log do servidor, nunca na resposta)       |

A unicidade também é garantida pelo banco (`UNIQUE`); uma violação que escape
da checagem do service (corrida entre requisições) também vira `409`.

## Testes

```bash
npm test
```

Os testes e2e (`test/`) sobem o app completo com `@nestjs/testing` + supertest sobre
**SQLite em memória** (`DATABASE_URL=:memory:`); as migrations rodam no boot do app
(`migrationsRun`). Novas migrations devem ser registradas em
`src/database/migrations/index.ts`.

## Endpoints (prefixo `/api`)

| Método | Rota                          | Descrição                                   | Sucesso |
| ------ | ----------------------------- | ------------------------------------------- | ------- |
| POST   | `/courses`                    | Cria curso                                  | 201     |
| GET    | `/courses?category=&page=&limit=` | Lista (filtro e paginação)              | 200     |
| GET    | `/courses/:id`                | Busca curso                                 | 200     |
| PUT    | `/courses/:id`                | Atualiza curso                              | 200     |
| DELETE | `/courses/:id`                | Remove curso                                | 204     |
| POST   | `/students`                   | Cria estudante (e-mail único)               | 201     |
| GET    | `/students?page=&limit=`      | Lista estudantes                            | 200     |
| GET    | `/students/:id`               | Busca estudante                             | 200     |
| PUT    | `/students/:id`               | Atualiza estudante                          | 200     |
| DELETE | `/students/:id`               | Remove estudante                            | 204     |
| POST   | `/enrollments`                | Matricula (`studentId`, `courseId`)         | 201     |
| GET    | `/enrollments?page=&limit=`   | Lista matrículas                            | 200     |
| GET    | `/enrollments/:id`            | Busca matrícula                             | 200     |
| DELETE | `/enrollments/:id`            | Cancela matrícula                           | 204     |
| GET    | `/students/:id/enrollments`   | Matrículas (com curso) do estudante         | 200     |

Listagens retornam `{ "data": [...], "page": 1, "limit": 10, "total": 3 }`
(`limit` máx. 100). `GET /health` fica fora do prefixo.

## Exemplos (curl)

```bash
# criar curso
curl -X POST http://localhost:3000/api/courses   -H "Content-Type: application/json"   -d '{"title":"NestJS na prática","category":"Backend"}'

# listar cursos de uma categoria
curl "http://localhost:3000/api/courses?category=Backend&page=1&limit=5"

# criar estudante
curl -X POST http://localhost:3000/api/students   -H "Content-Type: application/json"   -d '{"name":"Ana Souza","email":"ana@example.com"}'

# matricular
curl -X POST http://localhost:3000/api/enrollments   -H "Content-Type: application/json"   -d '{"studentId":1,"courseId":1}'

# cursos do estudante
curl http://localhost:3000/api/students/1/enrollments
```
