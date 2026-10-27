import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';
import { AuditLogService } from '../audit/audit-log.service.js';
import { AUDIT_QUEUE, EventEnvelope } from './messaging.constants.js';
import { assertTopology } from './rabbitmq-topology.js';

const RECONNECT_DELAY_MS = 3000;
const PREFETCH = 10;

@Injectable()
export class AuditEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditEventsConsumer.name);
  private connection?: ChannelModel;
  private channel?: Channel;
  private stopped = false;

  constructor(
    private readonly config: ConfigService,
    @Inject(AuditLogService) private readonly audit: AuditLogService,
  ) {}

  onModuleInit(): void {
    void this.start();
  }

  async onModuleDestroy(): Promise<void> {
    this.stopped = true;
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private async start(): Promise<void> {
    const url = this.config.getOrThrow<string>('RABBITMQ_URL');
    while (!this.stopped) {
      try {
        const connection = await amqp.connect(url);
        const channel = await connection.createChannel();
        await assertTopology(channel);
        await channel.prefetch(PREFETCH);
        await channel.consume(AUDIT_QUEUE, (msg) => void this.handle(channel, msg));
        this.connection = connection;
        this.channel = channel;
        this.logger.log(`Consumer aguardando mensagens em "${AUDIT_QUEUE}"`);
        await new Promise<void>((resolve) => connection.once('close', () => resolve()));
        if (!this.stopped) this.logger.warn('Conexão com RabbitMQ perdida; reconectando');
      } catch (error) {
        this.logger.warn(`RabbitMQ indisponível (${(error as Error).message}); nova tentativa em ${RECONNECT_DELAY_MS}ms`);
      }
      if (!this.stopped) await new Promise((r) => setTimeout(r, RECONNECT_DELAY_MS));
    }
  }

  private async handle(channel: Channel, msg: ConsumeMessage | null): Promise<void> {
    if (!msg) return;
    try {
      const envelope = JSON.parse(msg.content.toString()) as EventEnvelope;
      await this.audit.append({
        eventId: envelope.eventId,
        event: envelope.event,
        timestamp: new Date(envelope.occurredAt),
        actorId: envelope.actorId,
        payload: envelope.payload,
      });
      channel.ack(msg);
      this.logger.log(`Evento processado: ${envelope.event} (${envelope.eventId})`);
    } catch (error) {
      this.logger.error(`Falha ao processar mensagem; enviada à DLQ: ${(error as Error).message}`);
      channel.nack(msg, false, false);
    }
  }
}
