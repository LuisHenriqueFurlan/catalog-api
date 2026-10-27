import type { DataSourceOptions } from 'typeorm';
import { sqliteMigrations } from './migrations/sqlite/index.js';
import { postgresMigrations } from './migrations/postgres/index.js';
import { ormEntities } from './typeorm/entities/index.js';

export const DEFAULT_DATABASE_URL = 'file:./data/catalog.db';

export function isPostgres(url: string): boolean {
  return /^postgres(ql)?:\/\//.test(url);
}

export function databaseOptions(url: string = DEFAULT_DATABASE_URL): DataSourceOptions {
  if (isPostgres(url)) {
    return {
      type: 'postgres',
      url,
      entities: ormEntities,
      migrations: postgresMigrations,
      migrationsRun: true,
      synchronize: false,
    };
  }
  return {
    type: 'better-sqlite3',
    database: url.replace(/^file:/, ''),
    entities: ormEntities,
    migrations: sqliteMigrations,
    migrationsRun: true,
    synchronize: false,
  };
}
