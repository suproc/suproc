import { FastifyReply, FastifyRequest } from 'fastify';

import { digestMessage } from '../../utils/crypto';
import { IUser, User, userFactory } from '../../model/User';

async function registerUser(request: FastifyRequest, reply: FastifyReply) {
  const { log, body, messages } = request;
  const confirm = await digestMessage(new Date().toISOString());
  const newUser = {
    ...(body as any),
    confirm,
    registeredAt: new Date(),
  };
  if (!newUser.password || newUser.password !== newUser.passwordConfirm) {
    reply.status(400);
    return { code: 'BadPassword' };
  }
  newUser.password = await digestMessage(newUser.password);
  log.debug(`Register user "${newUser.id}"`);
  const user = new User(newUser);
  try {
    const result = (await user.save()).toObject() as IUser;
    await messages.push('email', {
      to: result.email,
      template: 'registerUser',
      scope: { user: result, confirm },
    });
    reply.status(201);
    log.debug(`User "${result.id}" is registered.`);
    return { code: 'UserRegistered' };
  } catch (err) {
    if (err.code === 11000) {
      reply.status(409);
      return { code: 'UserAlreadyExists' };
    }
    console.error(err);
    throw err;
  }
}

async function confirm(request: FastifyRequest, reply: FastifyReply) {
  const { log, body, messages } = request;
  const { id, password: passwordSource, confirm } = body as any;
  const password = await digestMessage(passwordSource);
  const userObject = await User.findOne({ id, password });
  if (!userObject) {
    reply.status(404);
    return { code: 'UserNotFound' };
  }
  const userConfirm = userObject.get('confirm');
  const user = userObject.toObject();
  if (!userConfirm || userConfirm !== confirm) {
    reply.status(403);
    return { code: 'BadConfirmation' };
  }
  log.debug(`Confirmed registration of user "${user.id}"`);
  userObject.set('registeredAt', undefined);
  await userObject.save();
  await messages.push('email', {
    to: user.email,
    template: 'registerUserSuccess',
    scope: { user },
  });
  return { code: 'RegistrationSucceeded' };
}

const loginTimeout = 60 * 1000 * 60 * 24;

async function login(request: FastifyRequest, reply: FastifyReply) {
  const { log, body } = request;
  const { id, password: passwordSource, refresh } = body as any;
  const password = refresh
    ? passwordSource
    : await digestMessage(passwordSource);
  const userObject = await User.findOne({ id, password });
  if (!userObject) {
    reply.status(404);
    return { code: 'UserNotFound' };
  }
  const lastLogin = new Date();
  const token = Buffer.from(
    `${userObject.get('id')}:${password}:${lastLogin.getTime()}`
  ).toString('base64');
  if (
    refresh &&
    Date.now() - userObject.get('lastLogin').getTime() < loginTimeout
  ) {
    return { code: 'RefreshSuccess', token };
  } else if (refresh) {
    reply.status(403);
    return { code: 'MustRelogin' };
  }
  userObject.set('lastLogin', lastLogin);
  userObject.set('loggedOut', false);
  await userObject.save();
  log.debug({ user: userObject.get('id') }, 'User logged in');
  return { code: 'LoginSuccess', token };
}

async function logout(request: FastifyRequest, reply: FastifyReply) {
  const { log, user } = request;
  const { id } = user;
  const userObject = await User.findOne({ id });
  if (!userObject) {
    reply.status(404);
    return { code: 'UserNotFound' };
  }
  userObject.set('loggedOut', true);
  await userObject.save();
  log.debug({ user: userObject.get('id') }, 'User logged out');
  return { code: 'LogoutSuccess' };
}

async function getMe(request: FastifyRequest, _reply: FastifyReply) {
  const { log, user } = request;
  log.debug(`Get me as user object for "${user.id}"`);
  return userFactory(user);
}

export const AuthenticationController = {
  registerUser,
  confirm,
  login,
  logout,
  getMe,
};
