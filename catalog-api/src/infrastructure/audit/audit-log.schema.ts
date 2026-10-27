import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'audit_logs', versionKey: false })
export class AuditLogDocument {
  @Prop({ required: true, index: true })
  event: string;

  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({ type: String, default: null })
  actorId: string | null;

  @Prop({ type: Object, default: {} })
  payload: Record<string, unknown>;
}

export type AuditLogHydrated = HydratedDocument<AuditLogDocument>;
export const AuditLogSchema = SchemaFactory.createForClass(AuditLogDocument);
AuditLogSchema.index({ 'payload.studentId': 1, timestamp: -1 });
