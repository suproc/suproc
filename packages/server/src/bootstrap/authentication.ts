import {
  FastifyInstance,
  FastifyLoggerInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import fastifyAuthentication from 'fastify-auth';

import { IUser, User } from '../model/User';

declare module 'fastify' {
  interface FastifyRequest {
    user: IUser;
  }
  // interface FastifyReply {
  //   myPluginProp: number
  // }
}

const loginTimeout = 60 * 1000 * 60 * 2;

function createUserAndPasswordVerifier(_config: any) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { authorization } = request.headers;
    if (authorization && (authorization as string).startsWith('Basic ')) {
      const tokens = Buffer.from(authorization.substr(6), 'base64')
        .toString('utf-8')
        .split(':');
      const user = await User.findOne({
        id: tokens[0],
        password: tokens[1],
      });
      console.log(
        'Auth',
        user ? JSON.stringify(user.get('loggedOut')) : 'unknown'
      );
      if (user != null && !user.get('loggedOut')) {
        if (
          !request.url.endsWith('/logout') &&
          Date.now() - parseInt(tokens[2]) > loginTimeout
        ) {
          reply.status(403);
          reply.send({ code: 'LoginTimeout' });
          return;
        }
        request.user = user.toObject();
        return;
      }
    }
    throw new Error('Trespassers will be shot, survivers will be shot again.');
  };
}

export async function setup(fastify: FastifyInstance, config: any) {
  const logger: FastifyLoggerInstance = fastify.log;
  const {} = config;
  logger.debug('Initializing authentication');
  return fastify
    .decorate('verifyUserAndPassword', createUserAndPasswordVerifier(config))
    .register(fastifyAuthentication);
}
