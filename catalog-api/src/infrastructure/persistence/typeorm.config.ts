import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DEFAULT_DATABASE_URL, databaseOptions } from './database-options.js';

export function typeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  return databaseOptions(config.get<string>('DATABASE_URL', DEFAULT_DATABASE_URL));
}
