import { FastifyInstance, FastifyLoggerInstance } from 'fastify';
import { connect } from 'mongoose';

export async function setup(fastify: FastifyInstance, config: any) {
  const logger: FastifyLoggerInstance = fastify.log;
  const { database } = config;
  const { name, authSource } = database;
  return connect(`mongodb://mongo/${name}`, {
    authSource,
    auth: {
      user: process.env.DATABASE_USER as string,
      password: process.env.DATABASE_PASSWORD as string,
    },
  })
    .then(() => logger.info('MongoDB connected…'))
    .catch((err) => console.log(err));
}
