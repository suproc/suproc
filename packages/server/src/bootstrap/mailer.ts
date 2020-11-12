import { FastifyInstance } from 'fastify';
import nodemailer from 'nodemailer';
import { Logger } from 'pino';
import {
  Template,
  TemplateFactory,
  TemplateFileSystemPersistence,
} from '../utils/Template';

export async function setup(fastify: FastifyInstance, config: any) {
  const { log, messages } = fastify;
  const { host, port } = config.mailer;
  const { mailerUser, mailerPassword } = process.env;
  log.debug('Setup mailer.');
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: {
      user: mailerUser,
      pass: mailerPassword,
    },
  });

  const templatePersistence = new TemplateFileSystemPersistence(
    './templates/email',
    log as Logger
  );
  const templates = new TemplateFactory(templatePersistence);
  templates.getTemplate('registerUser');
  messages.subscribe('email', async (message: any) => {
    const { template: templateName, to, scope, language } = message;
    const template: Template = await templates.getTemplate(templateName);
    if (template) {
      const context = await template.apply(scope, language || 'de');
      const { from, subject, text, html } = context;
      transport.sendMail({
        to,
        from,
        subject,
        text,
        html,
      });
      log.debug('Email sent to ' + to);
      return true;
    }
    return false;
  });
  log.debug('Mailer is set up.');
  return Promise.resolve();
}
