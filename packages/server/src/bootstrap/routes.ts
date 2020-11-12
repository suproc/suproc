import { FastifyInstance } from 'fastify';
import getRoutes from '../api/routes';

export default async function (fastify: FastifyInstance, _config: any) {
  getRoutes(fastify).map((route: any) => fastify.route(route));
}
