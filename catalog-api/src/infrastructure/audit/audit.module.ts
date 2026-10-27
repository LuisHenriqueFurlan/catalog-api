import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository.js';
import { AuditLogService } from './audit-log.service.js';
import { AuditLogDocument, AuditLogSchema } from './audit-log.schema.js';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URL', 'mongodb://localhost:27017/catalog'),
        serverSelectionTimeoutMS: 5000,
      }),
    }),
    MongooseModule.forFeature([{ name: AuditLogDocument.name, schema: AuditLogSchema }]),
  ],
  providers: [
    AuditLogService,
    { provide: IAuditLogRepository, useExisting: AuditLogService },
  ],
  exports: [AuditLogService, IAuditLogRepository],
})
export class AuditModule {}
