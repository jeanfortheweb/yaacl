import { Yaacl, SecurityIdentity, ObjectIdentity, Privileges } from '@yaacl/core';
import { unauthorized, forbidden } from 'boom';
import * as Joi from 'joi';

export interface Resolvers {
  securityIdentityResolver: (request: any) => SecurityIdentity | SecurityIdentity[];
  objectIdentityResolver: (request: any) => ObjectIdentity;
}

export interface PluginOptions {
  yaacl: Yaacl;
  resolvers: Resolvers;
}

class Plugin {
  public static register(server: any, options: PluginOptions) {
    if (Plugin.instance) {
      throw new Error(
        'Yaacl has already been registered. Multiple registrations are not supported.',
      );
    }

    Plugin.instance = new Plugin(
      server,
      Joi.attempt<PluginOptions>(options, Plugin.schema, 'Invalid options'),
    );
  }

  private static instance: Plugin;

  private static schema = Joi.object().keys({
    instance: Joi.required(),
    resolvers: {
      securityIdentityResolver: Joi.func().required(),
      objectIdentityResolver: Joi.func().required(),
    },
  });

  private static isIdentityArray(
    identity: SecurityIdentity | SecurityIdentity[],
  ): identity is SecurityIdentity[] {
    return Array.isArray(identity);
  }

  private server: any;
  private options: PluginOptions;

  private constructor(server: any, options: PluginOptions) {
    this.server = server;
    this.server.ext('onPostAuth', this.onPostAuth.bind(this));
    this.server.expose('api', this.options.yaacl);
    this.options = options;
  }

  private async getSecurityIdentityArray(request: any) {
    const securityIdentity = await this.options.resolvers.securityIdentityResolver(request);

    if (!securityIdentity) {
      throw unauthorized();
    }

    if (!Plugin.isIdentityArray(securityIdentity)) {
      return [securityIdentity];
    }

    return securityIdentity;
  }

  private async isGranted(
    securityIdentity: SecurityIdentity[],
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ) {
    let index = 0;
    let granted = false;

    while (granted === false && index < securityIdentity.length) {
      granted = await this.options.yaacl.granted(
        securityIdentity[index],
        objectIdentity,
        privileges,
      );

      index++;
    }

    return granted;
  }

  private async onPostAuth(request, h) {
    const options = request.route.settings.plugins.yaacl;

    if (options && options.privileges) {
      const securityIdentity = await this.getSecurityIdentityArray(request);
      const objectIdentity = await this.options.resolvers.objectIdentityResolver(request);

      if (!this.isGranted(securityIdentity, objectIdentity, options.privileges)) {
        throw forbidden();
      }
    }

    return h.continue;
  }
}

export default {
  name: 'yaacl',
  version: require('../package.json').version,
  register: Plugin.register,
};
