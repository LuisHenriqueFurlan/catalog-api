import type { Channel } from 'amqplib';
import {
  AUDIT_DEAD_LETTER_QUEUE,
  AUDIT_QUEUE,
  DEAD_LETTER_EXCHANGE,
  EVENTS_EXCHANGE,
} from './messaging.constants.js';

export async function assertTopology(channel: Channel): Promise<void> {
  await channel.assertExchange(EVENTS_EXCHANGE, 'topic', { durable: true });
  await channel.assertExchange(DEAD_LETTER_EXCHANGE, 'fanout', { durable: true });
  await channel.assertQueue(AUDIT_DEAD_LETTER_QUEUE, { durable: true });
  await channel.bindQueue(AUDIT_DEAD_LETTER_QUEUE, DEAD_LETTER_EXCHANGE, '');
  await channel.assertQueue(AUDIT_QUEUE, {
    durable: true,
    deadLetterExchange: DEAD_LETTER_EXCHANGE,
  });
  await channel.bindQueue(AUDIT_QUEUE, EVENTS_EXCHANGE, '#');
}
