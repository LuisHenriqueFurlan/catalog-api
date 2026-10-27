import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.config.js';

/** App completo sobre SQLite em memória; as migrations rodam no boot. */
export async function createTestApp(): Promise<INestApplication> {
  process.env.DATABASE_URL = ':memory:';
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}
