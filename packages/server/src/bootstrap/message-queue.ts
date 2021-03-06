import { FastifyInstance, FastifyLoggerInstance } from 'fastify';
import { Logger } from 'pino';
import { MemoryMessageQueue, MessageQueue } from '../utils/MessageQueue';

declare module 'fastify' {
  interface FastifyInstance {
    messages: MessageQueue;
  }
  interface FastifyRequest {
    messages: MessageQueue;
  }
}

export async function setup(fastify: FastifyInstance, config: any) {
  const logger: FastifyLoggerInstance = fastify.log;
  const {} = config;
  logger.debug('Initializing authentication');
  const messageQueue = new MemoryMessageQueue(fastify.log as Logger);
  return fastify
    .decorate('messages', messageQueue)
    .decorateRequest('messages', messageQueue);
}
