import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseOptions } from './database-options.js';

export default new DataSource({
  ...databaseOptions(process.env.DATABASE_URL),
  migrationsRun: false,
});
