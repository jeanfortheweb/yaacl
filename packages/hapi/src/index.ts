import { Yaacl, Adapter, SecurityIdentity, ObjectIdentity, Privileges } from '@yaacl/core';
import { unauthorized, forbidden } from 'boom';
import * as Joi from 'joi';

export interface PluginOptions {
  adapter: Adapter;
  securityIdentityResolver: (request: any) => SecurityIdentity | SecurityIdentity[];
}

export class Plugin {
  public static register(server: any, options: PluginOptions) {
    return new Plugin(
      server,
      Joi.attempt<PluginOptions>(options, Plugin.schema, 'Invalid options'),
    );
  }

  private static schema = Joi.object().keys({
    adapter: Joi.object().required(),
    securityIdentityResolver: Joi.func().required(),
  });

  private static isIdentityArray(
    identity: SecurityIdentity | SecurityIdentity[],
  ): identity is SecurityIdentity[] {
    return Array.isArray(identity);
  }

  private server: any;
  private options: PluginOptions;
  private yaacl: Yaacl;

  private constructor(server: any, options: PluginOptions) {
    this.options = options;
    this.yaacl = new Yaacl(this.options.adapter);

    this.server = server;
    this.server.ext('onPostAuth', this.onPostAuth.bind(this));
    this.server.expose('api', this.yaacl);
  }

  private async getSecurityIdentityArray(request: any) {
    const securityIdentity = await this.options.securityIdentityResolver(request);

    if (!securityIdentity) {
      throw unauthorized();
    }

    if (!Plugin.isIdentityArray(securityIdentity)) {
      return [securityIdentity];
    }

    return securityIdentity;
  }

  private getObjectIdentity(request: any) {
    const options = request.route.settings.plugins.yaacl;
    let objectIdentity: ObjectIdentity;

    if (options && options.group) {
      objectIdentity = {
        getObjectId: () => options.group,
      };
    } else {
      objectIdentity = {
        getObjectId: () => `${request.route.method}:${request.route.path}`,
      };
    }

    return objectIdentity;
  }

  private async isGranted(
    securityIdentity: SecurityIdentity[],
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ) {
    let index = 0;
    let granted = false;

    while (granted === false && index < securityIdentity.length) {
      granted = await this.yaacl.granted(securityIdentity[index], objectIdentity, privileges);
      index++;
    }

    return granted;
  }

  private async onPostAuth(request, h) {
    const options = request.route.settings.plugins.yaacl;

    if (options && options.privileges) {
      const securityIdentity = await this.getSecurityIdentityArray(request);
      const objectIdentity = this.getObjectIdentity(request);

      if (!await this.isGranted(securityIdentity, objectIdentity, options.privileges)) {
        throw forbidden();
      }
    }

    return h.continue;
  }
}

export default {
  name: 'yaacl',
  // tslint:disable-next-line: no-require-imports
  version: require('../package.json').version,
  register: Plugin.register,
};
