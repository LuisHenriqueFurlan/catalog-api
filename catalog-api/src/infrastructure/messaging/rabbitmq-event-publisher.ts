import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import amqp, { type ChannelModel, type ConfirmChannel } from 'amqplib';
import { BrokerState, IBrokerStatus } from './broker-status.js';
import { DomainEventMessage, IEventPublisher } from '../../application/ports/event-publisher.js';
import { EVENTS_EXCHANGE, EventEnvelope } from './messaging.constants.js';
import { assertTopology } from './rabbitmq-topology.js';

@Injectable()
export class RabbitMqEventPublisher implements IEventPublisher, IBrokerStatus, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqEventPublisher.name);
  private connection?: ChannelModel;
  private channel?: ConfirmChannel;
  private connecting?: Promise<ConfirmChannel>;
  private closing = false;

  constructor(private readonly url: string) {}

  onModuleInit(): void {
    void this.ensureChannel().catch((error: Error) =>
      this.logger.warn(`RabbitMQ indisponível no boot: ${error.message}`),
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.closing = true;
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  async publish(message: DomainEventMessage): Promise<void> {
    const envelope: EventEnvelope = {
      eventId: randomUUID(),
      event: message.event,
      occurredAt: new Date().toISOString(),
      actorId: message.actorId === null ? null : String(message.actorId),
      payload: message.payload,
    };
    try {
      const channel = await this.ensureChannel();
      channel.publish(EVENTS_EXCHANGE, envelope.event, Buffer.from(JSON.stringify(envelope)), {
        persistent: true,
        contentType: 'application/json',
        messageId: envelope.eventId,
      });
      await channel.waitForConfirms();
    } catch (error) {
      this.logger.error(`Falha ao publicar ${envelope.event}`, error as Error);
    }
  }

  async check(): Promise<BrokerState> {
    try {
      await this.ensureChannel();
      return 'up';
    } catch {
      return 'down';
    }
  }

  private ensureChannel(): Promise<ConfirmChannel> {
    if (this.channel) return Promise.resolve(this.channel);
    this.connecting ??= this.connect().finally(() => {
      this.connecting = undefined;
    });
    return this.connecting;
  }

  private async connect(): Promise<ConfirmChannel> {
    const connection = await amqp.connect(this.url);
    const channel = await connection.createConfirmChannel();
    await assertTopology(channel);
    const reset = () => {
      this.channel = undefined;
      this.connection = undefined;
    };
    connection.on('error', (error: Error) => this.logger.warn(`Conexão RabbitMQ: ${error.message}`));
    connection.on('close', () => {
      if (!this.closing) this.logger.warn('Conexão RabbitMQ encerrada; reconecta na próxima publicação');
      reset();
    });
    this.connection = connection;
    this.channel = channel;
    this.logger.log('Publisher conectado ao RabbitMQ');
    return channel;
  }
}
