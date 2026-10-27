import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ormEntities } from './typeorm/entities/index.js';

// Usado pela CLI do TypeORM (migrations) e pelo seed.
export default new DataSource({
  type: 'better-sqlite3',
  database: (process.env.DATABASE_URL ?? 'file:./data/catalog.db').replace(
    /^file:/,
    '',
  ),
  entities: ormEntities,
  migrations: ['src/infrastructure/persistence/migrations/[0-9]*-*.ts'],
});
