import { promises } from 'fs';
import { resolve } from 'path';
import Mustache from 'mustache';
import { Logger } from 'pino';
import { NullArgumentException } from '../exceptions';

const { readdir, readFile } = promises;

export interface Translation {
  language: string;
  name: string;
  content: string;
  clobId: string;
  isClob: boolean;
}

export interface TemplateConfig {
  name: string;
  config: any;
  scope: any;
  locales: Translation[];
}

export interface TemplatePersistence {
  getConfig(name: string): Promise<TemplateConfig | undefined>;
  getClob(id: string): Promise<string>;
}

export class TemplateFileSystemPersistence implements TemplatePersistence {
  private path: string;
  private logger: Logger;

  private configs: Map<string, TemplateConfig> | undefined;

  constructor(path: string, logger: Logger) {
    this.path = resolve(path);
    this.logger = logger;
  }

  async getConfig(name: string): Promise<TemplateConfig | undefined> {
    return (await this.getTemplateConfigs()).get(name);
  }

  async getClob(id: string): Promise<string> {
    return (await readFile(resolve(this.path, id))).toString();
  }

  async getTemplateConfigs(): Promise<Map<string, TemplateConfig>> {
    this.logger.trace('Get configs');
    if (!this.configs) {
      this.logger.debug({ path: this.path }, 'Initialize configs');
      const files = (await readdir(this.path)).filter((file) =>
        file.toLowerCase().endsWith('.json')
      );
      this.logger.debug({ files }, 'Available files');
      const configs = new Map();
      files
        .map((file) => require(resolve(this.path, file)))
        .forEach((config: TemplateConfig) => {
          this.logger.debug(
            { template: config.name },
            'Template config loaded'
          );
          configs.set(config.name, config);
        });
      this.configs = configs;
    }
    return this.configs;
  }
}

export class TemplateFactory {
  private persistence: TemplatePersistence;
  constructor(persistence: TemplatePersistence) {
    this.persistence = persistence;
  }
  async getTemplate(name: string): Promise<Template> {
    const templateConfig = await this.persistence.getConfig(name);
    if (!templateConfig) {
      throw new NullArgumentException(
        'name',
        `No template is found by the name "${name}"`
      );
    }
    const template = new Template(templateConfig, this.persistence);
    await template.init();
    return template;
  }
}

export class Template {
  private config: TemplateConfig;
  private persistence: TemplatePersistence;

  private scope: any;
  private data: Map<string, Map<string, string>>;

  constructor(config: TemplateConfig, persistence: TemplatePersistence) {
    this.config = config;
    this.persistence = persistence;
    this.data = new Map();
  }

  async init(): Promise<void> {
    const { scope, locales } = this.config;
    this.scope = scope;
    await Promise.all(
      locales
        .filter((entry: Translation) => entry.isClob)
        .map(async (entry: Translation) => {
          const { language, name, clobId } = entry;
          const content = await this.persistence.getClob(clobId);
          let bucket = this.data.get(language);
          if (!bucket) {
            bucket = new Map();
            this.data.set(language, bucket);
          }
          bucket.set(name, content);
        })
    );
    locales
      .filter((entry: Translation) => !entry.isClob)
      .forEach((entry: Translation) => {
        const { language, name, content } = entry;
        let bucket = this.data.get(language);
        if (!bucket) {
          bucket = new Map();
          this.data.set(language, bucket);
        }
        bucket.set(name, content);
      });
  }

  async apply(scope: any, language: string): Promise<any | null> {
    if (!scope) {
      throw new NullArgumentException('scope');
    }
    if (!language) {
      throw new NullArgumentException('language');
    }
    const renderScope: any = { ...this.scope, ...scope };
    const data = this.data.get(language);
    if (data) {
      const context: any = {};
      for (const key of data.keys()) {
        const content = data.get(key);
        if (content) {
          context[key] = Mustache.render(content, renderScope);
        }
      }
      return context;
    }
    return null;
  }
}
