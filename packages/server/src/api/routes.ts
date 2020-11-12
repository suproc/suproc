import { FastifyInstance } from 'fastify';
import { AuthenticationController } from './authentication/AuthenticationController';

export default function getRoutes(instance: FastifyInstance) {
  const verifyUserAndPassword = (instance as any).verifyUserAndPassword;
  return [
    {
      method: 'POST',
      url: '/register',
      handler: AuthenticationController.registerUser,
    },
    {
      method: 'POST',
      url: '/confirm',
      handler: AuthenticationController.confirm,
    },
    {
      method: 'POST',
      url: '/login',
      handler: AuthenticationController.login,
    },
    {
      method: 'POST',
      url: '/logout',
      preValidation: verifyUserAndPassword,
      handler: AuthenticationController.logout,
    },
    {
      method: 'GET',
      url: '/me',
      preValidation: verifyUserAndPassword,
      handler: AuthenticationController.getMe,
    },
  ];
}
