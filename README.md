# Catálogo de Cursos 2.0 — Arquitetura, Eventos e Segurança

API backend de uma plataforma de cursos (cursos, aulas, matrículas, progresso) construída com
**NestJS + TypeScript**, usando **Clean Architecture / DDD**, **JWT com roles**, **PostgreSQL**,
**MongoDB** para auditoria e **RabbitMQ** para eventos assíncronos. Sobe inteira com um
`docker compose up`.

> O código está em [`catalog-api/`](catalog-api). A versão Express do desafio do nível 1 virá depois.

## Arquitetura geral

```mermaid
flowchart LR
    C([Cliente]) -- "HTTP + JWT" --> API["API NestJS<br/>(controllers → use cases → domínio)"]
    API -- "SQL" --> PG[("PostgreSQL<br/>cursos, aulas, matrículas,<br/>progresso, usuários")]
    API -- "publica eventos" --> MQ{{"RabbitMQ<br/>exchange catalog.events"}}
    MQ -- "fila audit.events" --> W["Worker<br/>(consumer)"]
    W -- "grava" --> MG[("MongoDB<br/>audit_logs")]
    API -- "GET /audit-logs" --> MG
    MQ -. "falha → DLQ" .-> DLQ[/"audit.events.dlq"/]
```

A API é organizada em camadas, com dependências apontando para dentro
(veja [Arquitetura em camadas](#arquitetura-clean-architecture--ddd)):
`presentation → application → domain`, e a `infrastructure` implementa as portas do domínio
(repositórios, hash de senha, JWT, publicação de eventos, auditoria).

## Serviços que sobem com Docker

| Serviço    | Imagem                     | Função                                                | Porta no host |
| ---------- | -------------------------- | ----------------------------------------------------- | ------------- |
| `api`      | build deste repositório    | API REST + Swagger (`/docs`), `/health`, `/metrics`   | `3000` (`API_PORT`) |
| `worker`   | build deste repositório    | Consome `audit.events` e grava em `audit_logs`        | —             |
| `migrate`  | build deste repositório    | Roda migrations e seed (admin inicial) e termina      | —             |
| `postgres` | `postgres:16-alpine`       | Banco relacional                                      | —             |
| `mongo`    | `mongo:7`                  | Auditoria (`audit_logs`)                              | —             |
| `rabbitmq` | `rabbitmq:3.13-management` | Broker de eventos                                     | `15672` (painel, guest/guest) |

## Como rodar

### Com Docker (recomendado)

```bash
cd catalog-api
docker compose up --build
```

O Compose espera cada banco/broker ficar saudável, roda `migrate` (migrations + seed) e só então
sobe `api` e `worker`. Depois:

- API: http://localhost:3000 — Swagger: http://localhost:3000/docs — saúde: http://localhost:3000/health
- Admin inicial: `admin@example.com` / `Admin123!` (mude com `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- Variáveis úteis: `JWT_SECRET` (defina um valor próprio fora de testes) e `API_PORT` (se a 3000 estiver ocupada)

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' | jq -r .accessToken)
curl http://localhost:3000/api/courses -H "Authorization: Bearer $TOKEN"
```

O Compose lê o `.env` da pasta `catalog-api` (se você copiou o `.env.example`, ajuste o `JWT_SECRET`
de lá: o segredo de exemplo é recusado em produção). Migrations manuais: `docker compose run --rm migrate`. Para parar e apagar os dados:
`docker compose down -v`.

### Sem Docker (SQLite + serviços locais)

```bash
cd catalog-api
npm install
cp .env.example .env                       # SQLite por padrão; defina JWT_SECRET
docker run -d --name catalog-mongo -p 27017:27017 mongo:7        # auditoria
npm run migration:run                      # cria o schema do zero
npm run seed                               # 3 cursos, 2 estudantes e o admin
npm run start:dev                          # http://localhost:3000
```

Sem `RABBITMQ_URL`, a API grava a auditoria direto no Mongo. Para usar a fila, suba o RabbitMQ,
defina `RABBITMQ_URL` e rode o worker (veja [Mensageria](#mensageria-rabbitmq-e-worker)).
O Mongo é necessário em ambos os casos (a API lê `/audit-logs` dele).

`DATABASE_URL` aceita SQLite (`file:./data/catalog.db`) ou PostgreSQL
(`postgres://usuario:senha@host:5432/banco`); cada um tem seu conjunto de migrations.

## Fluxos principais

**Matrícula** — `POST /api/enrollments`

1. O JWT é validado; um `STUDENT` só pode matricular a si mesmo (`ADMIN` matricula qualquer um).
2. `EnrollStudentUseCase` confere que estudante e curso existem (404) e aplica a regra de domínio
   `EnrollmentPolicy`: matrícula duplicada → 409.
3. A matrícula é salva e o evento `student.enrolled` é publicado no RabbitMQ.

**Conclusão de aula** — `POST /api/lessons/:id/complete`

1. `CompleteLessonUseCase` valida estudante e aula (404) e a regra `LessonProgressPolicy`:
   só quem está matriculado no curso registra progresso (403).
2. `LessonProgress.complete()` marca `completed` e preenche `completedAt` (concluir de novo é
   idempotente e não duplica o evento).
3. `lesson.completed` é publicado. `GET /api/students/:id/courses/:id/progress` devolve o percentual.

**Auditoria** — assíncrona e desacoplada

1. Os eventos vão para a exchange `catalog.events` e para a fila durável `audit.events`.
2. O `worker` consome com *ack* manual, grava em `audit_logs` (idempotente por `eventId`) e loga
   `Evento processado`. Se ele estiver offline, as mensagens aguardam na fila; falhas vão para a DLQ.
3. `GET /api/audit-logs` (ADMIN) consulta o Mongo por `event`, `studentId` e período.

## Diferenciais técnicos

- **Clean Architecture + DDD:** domínio puro (entidades que se validam, value object `Email`,
  *policies* de domínio, erros sem HTTP), casos de uso orquestrando portas, infraestrutura plugável.
- **Segurança:** JWT + roles com guards globais, bcrypt, helmet, rate limiting, validação estrita de
  entrada, SQL parametrizado, filtros Mongo à prova de injeção de operadores, validação de `.env`,
  `npm audit` documentado.
- **Event-driven:** RabbitMQ com mensagens persistentes, publisher confirms, DLQ, consumer com
  reconexão e gravação idempotente; reprocessa tudo que ficou pendente com o worker offline.
- **Dois bancos, cada um no seu papel:** PostgreSQL (transacional) e MongoDB (auditoria), com
  migrations versionadas para SQLite e PostgreSQL e índices medidos.
- **Streams:** importação de CSV em lotes sem carregar o arquivo na memória (300 mil linhas com
  heap de 64 MB).
- **Observabilidade:** logs JSON com `requestId`, `/health` por componente (`ok`/`degraded`/`down`)
  e `/metrics` no formato Prometheus.
- **Qualidade:** 55 testes (unitários de domínio/casos de uso e e2e com `supertest`), executados
  também contra PostgreSQL real; Swagger e Docker Compose completos.

## Scripts (em `catalog-api/`)

| Script                         | Descrição                                                    |
| ------------------------------ | ------------------------------------------------------------ |
| `npm run start:dev`            | API com reload                                               |
| `npm run start:worker`         | Worker consumidor da fila (`start:worker:prod` após o build) |
| `npm run build` / `start:prod` | Compila / executa o build                                    |
| `npm run migration:run`        | Aplica migrations (`migration:run:prod` usa o `dist/`)       |
| `npm run migration:generate -- <caminho>` | Gera migration a partir das entidades     |
| `npm run seed`                 | Cursos, estudantes e admin iniciais (`seed:prod` no build)   |
| `npm run import:lessons -- <csv>` | Importa aulas de um CSV por streaming                     |
| `npm test`                     | Todos os testes (unitários + e2e)                            |

## Banco de dados

- ORM: TypeORM, com `DATABASE_URL` apontando para SQLite (dev/testes) ou PostgreSQL (Docker/produção).
- Entidades: `Course`, `Student` (e-mail único), `Enrollment` (`studentId` + `courseId` únicos),
  `Lesson` (`courseId` + `order` únicos), `LessonProgress` (`studentId` + `lessonId` únicos; status
  `not_started | in_progress | completed`) e `User` (e-mail único, role `STUDENT | ADMIN`).
- Migrations em `src/infrastructure/persistence/migrations/{sqlite,postgres}`; novas migrations
  devem ser registradas no `index.ts` do respectivo dialeto. Para gerar uma:
  `DATABASE_URL=<url> npm run migration:generate -- src/infrastructure/persistence/migrations/<dialeto>/<Nome>`
  (com o banco já migrado).

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

## Auditoria (MongoDB)

Eventos importantes ficam na coleção `audit_logs` do MongoDB, separada do banco relacional
(`MONGO_URL`, padrão `mongodb://localhost:27017/catalog`):

```json
{
  "event": "student.enrolled",
  "timestamp": "2026-01-01T12:00:00.000Z",
  "actorId": "3",
  "payload": { "studentId": "1", "courseId": "2", "enrollmentId": "7" }
}
```

| Evento             | Quando                                      | Payload                                  |
| ------------------ | ------------------------------------------- | ---------------------------------------- |
| `student.enrolled` | Ao criar uma matrícula                      | `studentId`, `courseId`, `enrollmentId`  |
| `lesson.completed` | Na primeira conclusão de uma aula (repetir não duplica) | `studentId`, `lessonId`, `courseId` |

`actorId` é o id do usuário autenticado que executou a ação.

- Os use cases dependem da porta `IAuditLog`; a implementação `AuditLogService`
  (`infrastructure/audit`) é a única que conhece o Mongo. Falha ao gravar auditoria é
  logada e **não derruba** a requisição.
- `GET /api/audit-logs` (ADMIN) filtra por `event`, `studentId` e período (`from`/`to`, ISO 8601),
  com paginação, do mais recente para o mais antigo. Os filtros são enviados ao Mongo como
  igualdade literal (`$eq`), o que bloqueia injeção de operadores.
- Os testes usam `mongodb-memory-server` (o binário é baixado na primeira execução).

## Mensageria (RabbitMQ) e worker

Com `RABBITMQ_URL` definida, a API **publica** os eventos no RabbitMQ em vez de gravar a
auditoria diretamente, e um **worker** separado consome a fila e persiste em `audit_logs`:

```
API (use cases) ──publish──▶ exchange "catalog.events" (topic)
                                   │ binding "#"
                                   ▼
                            fila "audit.events" (durável) ──▶ worker ──▶ MongoDB audit_logs
                                   │ (falha ao processar)
                                   ▼
                            "audit.events.dlq" (dead-letter)
```

```bash
docker run -d --name catalog-rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3.13-management
# no .env: RABBITMQ_URL=amqp://guest:guest@localhost:5672
npm run start:dev      # API
npm run start:worker   # worker (em outro terminal); em produção: npm run start:worker:prod
```

Painel do RabbitMQ: http://localhost:15672 (guest/guest). Sem `RABBITMQ_URL`, a API grava a
auditoria diretamente no Mongo (modo "inline", útil em desenvolvimento e nos testes).

Resiliência:

- Fila e exchange **duráveis**, mensagens **persistentes** e publicação com *publisher confirms*.
  A API cria a topologia ao publicar, então os eventos ficam enfileirados mesmo sem
  consumer: **se o worker estiver offline, as mensagens pendentes são processadas assim que ele voltar**.
- O worker usa *ack* manual com `prefetch`, reconecta sozinho se o RabbitMQ cair e registra
  `Evento processado: <evento> (<eventId>)` a cada mensagem.
- Cada evento tem um `eventId` (UUID) com índice único no Mongo: a reentrega de uma mensagem
  não gera registro duplicado (entrega *at-least-once* + gravação idempotente).
- Mensagem que não pode ser processada vai para a DLQ (`audit.events.dlq`) em vez de travar a fila.
- Se o RabbitMQ estiver fora ao publicar, o erro é logado e a requisição continua (best-effort);
  um *outbox* transacional seria o próximo passo para garantia total.

## Importação em massa (streams)

Importa aulas (`Lesson`) de um CSV sem carregar o arquivo na memória:
`fs.createReadStream` → `csv-parse` (stream) → lotes de 500 linhas → validação no domínio →
`INSERT` em lote.

```bash
cd catalog-api
npm run build
npm run import:lessons -- samples/lessons.csv
```

Formato (cabeçalho obrigatório): `courseId,title,order,contentUrl`. O exemplo
[`samples/lessons.csv`](catalog-api/samples/lessons.csv) traz 15 linhas válidas e 5 casos de erro
(duplicada, título curto, ordem inválida, URL inválida, curso inexistente). Saída:

```
20 registros processados (15 importados, 1 duplicados, 4 inválidos)
Concluído em 0.0s: 20 lidos, 15 importados, 1 duplicados, 4 inválidos
```

- **Streaming e lotes:** o `readCsvInBatches` é um gerador assíncrono; o use case
  (`ImportLessonsUseCase`) consome um lote por vez, então a memória não cresce com o arquivo.
- **Event loop:** cada lote devolve o controle com `setImmediate`, e o parser respeita
  *backpressure* (só lê o próximo trecho quando o lote anterior termina).
- **Progresso:** um log `x registros processados` por lote; linhas rejeitadas são logadas com
  o número da linha (até 20 avisos) e contadas no resumo.
- **Idempotente:** pares `(courseId, order)` já existentes são ignorados; rodar de novo não duplica.
- **Teste de volume:** `npm run import:generate -- samples/lessons-large.csv 300000 3` gera
  300 mil linhas (~19 MB). Importadas com `node --max-old-space-size=64 dist/cli/import-lessons.js ...`
  (heap de 64 MB), levaram ~17 s; a segunda execução reportou 300 mil duplicados e 0 inseridos.

## Segurança

| Medida | Como |
| ------ | ---- |
| Cabeçalhos HTTP | `helmet` (CSP, HSTS, `nosniff`, sem `X-Powered-By`); a CSP é relaxada só em `/docs` por causa do Swagger UI |
| Rate limiting | `@nestjs/throttler`: `THROTTLE_LIMIT` req/min por IP (padrão 120) e limite mais estrito em `/api/auth/*` (`THROTTLE_AUTH_LIMIT`, padrão 10) → **429** |
| CORS | Defina `CORS_ORIGINS` (lista separada por vírgula) para restringir origens; sem ela, aceita qualquer origem (apenas desenvolvimento) |
| SQL parametrizado | Todo acesso usa o TypeORM (`find`/`QueryBuilder` com `:parametros`); nenhuma query concatena entrada do usuário. Curingas do `LIKE` (`%`, `_`, `\`) são escapados |
| NoSQL | Filtros do Mongo usam `$eq` com valores literais (bloqueia injeção de operadores como `{"$ne": ...}`) |
| Validação | `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`): campo extra → 400; tamanhos máximos (título 200, descrição 2000, e-mail 254, senha 72, ...); `:id` não numérico → 400 |
| Corpo da requisição | Limite padrão de 100 kb → **413** |
| Senhas e tokens | bcrypt; JWT com expiração; mensagem única para credenciais inválidas; `passwordHash` nunca é serializado |
| Configuração | `.env` validado na subida (`class-validator`): `JWT_SECRET` ≥ 16 caracteres e obrigatório, URLs e portas com formato correto; em `NODE_ENV=production` o segredo de exemplo é recusado e a app **não sobe** |

Testes manuais/automatizados (`test/security.e2e-spec.ts`): `' OR 1=1 --` no login → 400;
`/api/courses/1;DROP TABLE courses` → 400; `category=x' OR '1'='1` → 0 resultados; campos acima
do limite → 400; corpo de 200 kb → 413; 5ª tentativa de login em sequência → 429.

**`npm audit`** (27/10/2026): **0 vulnerabilidades nas dependências de produção**
(`npm audit --omit=dev`). Com as de desenvolvimento são 5 (2 baixas, 1 moderada, 2 altas), todas
vindas de ferramentas do CLI do Nest, que não vão para a imagem final:

| Pacote | Severidade | Origem | Observação |
| ------ | ---------- | ------ | ---------- |
| `undici` ≤ 6.29 | alta | `@nestjs/mau` (devDependency do template) | afeta o cliente HTTP do Node; só usado por esse CLI |
| `tmp` ≤ 0.2.5 | alta | `inquirer` → `external-editor` (CLI do Nest) | escrita via symlink em diretório temporário; só em tempo de desenvolvimento |

A correção exige `npm audit fix --force` (muda versões maiores do CLI), então foi deixada para
uma atualização dedicada das ferramentas.

## Observabilidade

**Logs estruturados (JSON, `pino`)** — um por requisição, com contexto para depuração:

```json
{"level":40,"time":1793117228784,"req":{"id":"demo-1","method":"GET","url":"/api/courses/999"},
 "endpoint":"/api/courses/:id","userId":1,"role":"ADMIN","res":{"statusCode":404},
 "responseTime":2,"msg":"request completed"}
```

- **`requestId`**: usa o header `x-request-id` enviado (até 100 caracteres) ou gera um UUID. Ele volta
  no header `x-request-id` da resposta, aparece em `req.id` nos logs (inclusive nos logs emitidos
  dentro da requisição) e no campo `requestId` do corpo de erro. Para investigar um erro: pegue o
  `requestId` da resposta e filtre os logs, por exemplo `node dist/main | jq 'select(.req.id=="<id>")'`.
- **Contexto:** rota (`endpoint`), `userId` e `role` do usuário autenticado, status e tempo de resposta.
  O header `Authorization` é mascarado (`redact`); `/health` e `/metrics` não geram log.
- **Nível:** `LOG_LEVEL` (`info` por padrão; `debug`, `warn`, `error`, `silent`). Respostas 4xx
  saem como `warn` (nível 40) e 5xx como `error` (50). O worker usa o mesmo formato.

**`GET /health`** (público) verifica cada dependência (timeout de 2 s):

```json
{"status":"ok","timestamp":"...","uptimeSeconds":9,"components":{
  "database":{"status":"up","latencyMs":1},
  "mongo":{"status":"up","latencyMs":4},
  "broker":{"status":"up","latencyMs":0}}}
```

| `status` | Quando | HTTP |
| -------- | ------ | ---- |
| `ok` | Banco relacional, Mongo e broker respondem (broker `disabled` sem `RABBITMQ_URL` não conta como falha) | 200 |
| `degraded` | Mongo ou RabbitMQ fora: a API segue atendendo, mas auditoria/eventos ficam comprometidos | 200 |
| `down` | Banco relacional fora | 503 |

**`GET /metrics`** (formato Prometheus, sem prefixo `/api`): métricas do processo (CPU, memória,
event loop) mais `http_requests_total{method,route,status}` e `http_request_duration_seconds`.
Ele é público para facilitar o scraping; em produção restrinja por rede/proxy.

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
| 401    | Token ausente/inválido/expirado; credenciais inválidas no login |
| 403    | Role sem permissão; dados de outro estudante; estudante não matriculado ao registrar/consultar progresso |
| 404    | Curso, estudante, aula ou matrícula inexistente (inclusive `studentId`/`courseId` no POST de matrícula) |
| 409    | E-mail de estudante já cadastrado; estudante já matriculado no curso       |
| 503    | `GET /health` com o banco relacional fora do ar |
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
`src/infrastructure/persistence/migrations/<dialeto>/index.ts`.

Para rodar a mesma suíte contra um PostgreSQL real (o schema é recriado a cada arquivo de teste):

```bash
TEST_DATABASE_URL=postgres://catalog:catalog@localhost:5432/catalog npm test
```

## Autenticação e autorização (JWT + roles)

Todas as rotas exigem JWT, exceto `GET /health`, `POST /api/auth/register` e `POST /api/auth/login`.

1. **Registrar** (cria o usuário com role `STUDENT` e o perfil de estudante vinculado):

   ```bash
   curl -X POST http://localhost:3000/api/auth/register      -H "Content-Type: application/json"      -d '{"name":"Ana Souza","email":"ana@example.com","password":"senha-forte-123"}'
   ```

2. **Obter o token**:

   ```bash
   curl -X POST http://localhost:3000/api/auth/login      -H "Content-Type: application/json"      -d '{"email":"ana@example.com","password":"senha-forte-123"}'
   # {"accessToken":"eyJ...","tokenType":"Bearer"}
   ```

3. **Usar o token** no header `Authorization`:

   ```bash
   curl http://localhost:3000/api/courses -H "Authorization: Bearer <token>"
   ```

No Swagger (`/docs`), clique em **Authorize** e cole o token.

O primeiro **ADMIN** é criado por `npm run seed` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`,
padrão `admin@example.com` / `Admin123!` — troque em produção). Não é possível se
registrar como ADMIN pela API.

| Recurso                                   | STUDENT                  | ADMIN |
| ----------------------------------------- | ------------------------ | ----- |
| `GET /courses`, `GET /courses/:id`, aulas | ✅                       | ✅    |
| `POST/PUT/DELETE /courses`, criar aulas   | ❌ 403                   | ✅    |
| `/students` (CRUD), `/enrollments` (listar/buscar/cancelar) | ❌ 403 | ✅    |
| Matricular, ver matrículas, concluir aula, ver progresso | só do próprio perfil | qualquer um |

- Sem token / token inválido ou expirado → **401**.
- Role incorreta ou acesso a dados de outro estudante → **403**.
- Senhas são guardadas com hash bcrypt (nunca expostas); o login devolve a mesma
  resposta 401 para e-mail inexistente e senha errada.
- Variáveis: `JWT_SECRET` (obrigatória) e `JWT_EXPIRES_IN` (padrão `1h`).

## Endpoints (prefixo `/api`)

| Método | Rota                          | Descrição                                   | Sucesso |
| ------ | ----------------------------- | ------------------------------------------- | ------- |
| POST   | `/courses`                    | Cria curso                                  | 201     |
| GET    | `/courses?category=&search=&page=&limit=` | Lista (filtros e paginação)     | 200     |
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
| GET    | `/audit-logs?event=&studentId=&from=&to=` | Logs de auditoria (ADMIN)         | 200     |
| GET    | `/reports/courses/enrollments` | Matrículas por curso (ADMIN)               | 200     |
| GET    | `/students/:id/enrollments`   | Matrículas (com curso) do estudante         | 200     |
| GET    | `/courses/:id/lessons`        | Aulas do curso, por ordem                   | 200     |
| POST   | `/courses/:id/lessons`        | Cria aula (`title`, `order`, `contentUrl`)  | 201     |
| POST   | `/lessons/:id/complete`       | Conclui aula (`{ "studentId": 1 }`), idempotente | 200 |
| GET    | `/students/:sid/courses/:cid/progress` | Progresso (%) do estudante no curso | 200   |

Listagens retornam `{ "data": [...], "page": 1, "limit": 10, "total": 3 }`
(`limit` máx. 100). `GET /health` fica fora do prefixo.

## Consultas avançadas, relatórios e performance

`GET /api/courses` aceita (todos opcionais e combináveis):

| Parâmetro  | Descrição                                                        |
| ---------- | ---------------------------------------------------------------- |
| `category` | Categoria exata                                                  |
| `search`   | Texto contido no título ou na descrição (sem diferenciar maiúsculas; `%` e `_` são tratados como texto) |
| `page`     | Página, a partir de 1 (padrão 1)                                 |
| `limit`    | Itens por página, 1–100 (padrão 10)                              |

Resposta: `{ "data": [...], "page": 1, "limit": 10, "total": 42 }`.
Não há campo de nível no modelo, então não existe filtro por nível.

`GET /api/reports/courses/enrollments` (ADMIN) devolve `[{ courseId, title, enrollments }]`
ordenado por matrículas, incluindo cursos com 0, em **uma única query** (`LEFT JOIN` + `GROUP BY`).

**Índices** (migration `Indexes`): `courses.title`, `courses.category`,
`enrollments.courseId` e `lesson_progress.lessonId`. `students.email` e `users.email` já
têm índice pela constraint `UNIQUE`. As unicidades `(studentId, courseId)`,
`(courseId, order)` e `(studentId, lessonId)` também são indexadas.

**Sem N+1:** `GET /students/:id/enrollments` carrega matrículas e cursos em um `JOIN`;
o progresso do curso usa `COUNT` com `JOIN` (sem carregar linhas); a listagem de cursos
faz `COUNT` + página em uma só chamada.

Medição manual (SQLite, 100 mil cursos e 200 mil matrículas, média de 200 execuções):

| Consulta                                   | Sem índice | Com índice |
| ------------------------------------------ | ---------- | ---------- |
| cursos por `category` (`LIMIT 10`)         | 0,139 ms   | 0,008 ms   |
| matrículas de um curso (`COUNT` por `courseId`) | 5,257 ms | 0,001 ms   |

O `search` usa `LIKE '%termo%'`, que não aproveita índice de B-tree; para catálogos muito
grandes, o próximo passo seria busca full-text (FTS5 no SQLite ou `pg_trgm` no PostgreSQL).

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

## Licença

MIT — veja [LICENSE](LICENSE).
