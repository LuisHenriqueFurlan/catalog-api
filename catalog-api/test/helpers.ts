import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import pg from 'pg';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/infrastructure/http/app.config.js';
import { UserOrmEntity } from '../src/infrastructure/persistence/typeorm/entities/index.js';

let mongo: MongoMemoryServer | undefined;

async function resetPostgres(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url || !/^postgres(ql)?:\/\//.test(url)) return;
  const db = new pg.Client({ connectionString: url });
  await db.connect();
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await db.end();
}

export async function createTestApp(): Promise<INestApplication> {
  await resetPostgres();
  mongo ??= await MongoMemoryServer.create();
  process.env.MONGO_URL = mongo.getUri('catalog_test');
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

export async function closeTestApp(app: INestApplication) {
  await app.close();
  await mongo?.stop();
  mongo = undefined;
}

export function client(app: INestApplication, token?: string) {
  const server = app.getHttpServer();
  const auth = <T extends request.Test>(req: T) =>
    token ? (req.set('Authorization', `Bearer ${token}`) as T) : req;
  return {
    get: (url: string) => auth(request(server).get(url)),
    post: (url: string) => auth(request(server).post(url)),
    put: (url: string) => auth(request(server).put(url)),
    delete: (url: string) => auth(request(server).delete(url)),
  };
}

export const PASSWORD = 'senha-forte-123';

export async function signUp(
  app: INestApplication,
  email: string,
  role: 'STUDENT' | 'ADMIN' = 'STUDENT',
) {
  const registered = await client(app)
    .post('/api/auth/register')
    .send({ name: 'Usuário Teste', email, password: PASSWORD })
    .expect(201);
  if (role === 'ADMIN') {
    await app.get(DataSource).getRepository(UserOrmEntity).update({ email }, { role });
  }
  const login = await client(app)
    .post('/api/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return {
    token: login.body.accessToken as string,
    userId: registered.body.id as number,
    studentId: registered.body.studentId as number,
  };
}
