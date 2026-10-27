import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { migrations } from './migrations/index.js';
import { ormEntities } from './typeorm/entities/index.js';

export function typeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'better-sqlite3',
    database: config
      .get<string>('DATABASE_URL', 'file:./data/catalog.db')
      .replace(/^file:/, ''),
    entities: ormEntities,
    migrations,
    migrationsRun: true,
    synchronize: false,
  };
}
