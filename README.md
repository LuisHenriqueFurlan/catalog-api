# API de Catálogo de Cursos — NestJS

API REST (Courses, Students, Enrollments) construída com NestJS + TypeScript.
O código fica em [`catalog-api/`](catalog-api); a versão Express virá depois.

## Como rodar

```bash
cd catalog-api
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

## Banco de dados

- ORM: TypeORM + SQLite (`better-sqlite3`), configurado por `DATABASE_URL` (ex.: `file:./data/catalog.db`).
- Entidades: `Course`, `Student` (email único), `Enrollment` (`studentId` + `courseId` únicos),
  `Lesson` (`courseId` + `order` únicos) e `LessonProgress` (`studentId` + `lessonId` únicos; status `not_started | in_progress | completed`).
- Migrations em `src/infrastructure/persistence/migrations`.

| Script                                        | Descrição                       |
| --------------------------------------------- | ------------------------------- |
| `npm run migration:run`                       | Aplica as migrations            |
| `npm run migration:generate -- src/infrastructure/persistence/migrations/Nome` | Gera migration a partir das entidades |
| `npm run migration:revert`                    | Desfaz a última migration       |
| `npm run seed`                                | Popula dados iniciais (idempotente) |

## Arquitetura (Clean Architecture + DDD)

As dependências apontam sempre para dentro: `presentation → application → domain`,
e `infrastructure` implementa as portas definidas pelo domínio.

```
catalog-api/src/
├── domain/                  # regras de negócio puras (sem Nest, sem ORM)
│   ├── entities/            # Course, Student, Enrollment (validam a si mesmas)
│   ├── value-objects/       # Email
│   ├── repositories/        # portas: ICourseRepository, IStudentRepository, IEnrollmentRepository
│   ├── services/            # EnrollmentPolicy (matrícula duplicada), StudentEmailPolicy
│   └── errors.ts            # NotFound / Conflict / Validation (sem conhecer HTTP)
├── application/
│   └── use-cases/           # um caso de uso por ação (create-course, enroll-student, ...)
├── infrastructure/
│   ├── persistence/         # TypeORM: entidades ORM, repositórios, migrations, seed
│   ├── http/                # app.config (prefixo, pipes, Swagger) e filtro global de erros
│   ├── messaging/           # (próximas tarefas)
│   └── auth/                # (próximas tarefas)
├── presentation/
│   ├── controllers/         # só HTTP: recebem DTO, chamam o use case
│   ├── dtos/                # validação (class-validator) e Swagger
│   └── modules/             # módulos Nest que ligam controllers + use cases
├── app.module.ts            # composition root
└── main.ts
```

Fluxo de uma requisição:

```
HTTP → Controller (DTO validado) → UseCase → Entidade/Policy de domínio
                                        └→ ICourseRepository (porta)
                                              ↑ implementada por TypeOrmCourseRepository
```

- **Regras no domínio:** título do curso ≥ 3 caracteres (`Course`), e-mail válido
  (`Email`), matrícula única por estudante+curso (`EnrollmentPolicy`), e-mail único
  (`StudentEmailPolicy`).
- **Repositórios por abstração:** os use cases recebem `ICourseRepository` etc. por
  injeção de dependência; o `PersistenceModule` liga cada porta à implementação TypeORM.
  Trocar o banco não toca em domínio nem em casos de uso.
- **Progresso:** só quem está matriculado no curso registra progresso
  (`LessonProgressPolicy` → 403 `NotEnrolledError`). `LessonProgress.complete()` preenche
  `completedAt` (concluir de novo não altera a data). O progresso do curso é
  `concluídas / total de aulas` (arredondado, 0 se o curso não tem aulas).
- **Erros:** o domínio lança `NotFoundError`/`ConflictError`/`ValidationError`; o
  `AllExceptionsFilter` os traduz em 404/409/400.

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
| 403    | Estudante não matriculado no curso ao registrar/consultar progresso |
| 404    | Curso, estudante, aula ou matrícula inexistente (inclusive `studentId`/`courseId` no POST de matrícula) |
| 409    | E-mail de estudante já cadastrado; estudante já matriculado no curso       |
| 500    | Falha inesperada (detalhes só no log do servidor, nunca na resposta)       |

A unicidade também é garantida pelo banco (`UNIQUE`); uma violação que escape
da checagem do service (corrida entre requisições) também vira `409`.

## Testes

```bash
cd catalog-api
npm test
```

Os testes e2e (`test/`) sobem o app completo com `@nestjs/testing` + supertest sobre
**SQLite em memória** (`DATABASE_URL=:memory:`); as migrations rodam no boot do app
(`migrationsRun`). Novas migrations devem ser registradas em
`src/infrastructure/persistence/migrations/index.ts`.

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
| GET    | `/courses/:id/lessons`        | Aulas do curso, por ordem                   | 200     |
| POST   | `/courses/:id/lessons`        | Cria aula (`title`, `order`, `contentUrl`)  | 201     |
| POST   | `/lessons/:id/complete`       | Conclui aula (`{ "studentId": 1 }`), idempotente | 200 |
| GET    | `/students/:sid/courses/:cid/progress` | Progresso (%) do estudante no curso | 200   |

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

## Docker

```bash
cd catalog-api
docker compose up --build   # API em http://localhost:3000 (Swagger em /docs)
```

O banco SQLite fica no volume `db-data` (`/app/data/catalog.db`) e as migrations
rodam sozinhas ao subir. Para popular dados de exemplo sem Docker: `npm run seed`.

## Licença

MIT — veja [LICENSE](LICENSE).
