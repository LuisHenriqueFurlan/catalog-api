import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository.js';
import { AuditLogService } from './audit-log.service.js';
import { DEFAULT_MONGO_URL } from './mongo.constants.js';
import { MongoReconnector } from './mongo-reconnector.js';
import { AuditLogDocument, AuditLogSchema } from './audit-log.schema.js';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URL', DEFAULT_MONGO_URL),
        serverSelectionTimeoutMS: 5000,
        lazyConnection: true,
      }),
    }),
    MongooseModule.forFeature([{ name: AuditLogDocument.name, schema: AuditLogSchema }]),
  ],
  providers: [
    AuditLogService,
    MongoReconnector,
    { provide: IAuditLogRepository, useExisting: AuditLogService },
  ],
  exports: [AuditLogService, IAuditLogRepository],
})
export class AuditModule {}
