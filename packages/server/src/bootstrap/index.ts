import { FastifyInstance } from 'fastify';

import routes from './routes';

import * as authentication from './authentication';
import * as database from './database';
import * as mailer from './mailer';
import * as messageQueue from './message-queue';

export default async function (fastify: FastifyInstance, config: any) {
  return Promise.all([
    messageQueue.setup(fastify, config),
    authentication.setup(fastify, config),
    database.setup(fastify, config),
    mailer.setup(fastify, config),
  ]).then(() => routes(fastify, config));
}
