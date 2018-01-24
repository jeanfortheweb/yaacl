import { Yaacl, SecurityIdentity, ObjectIdentity } from '@yaacl/core';
import { unauthorized, forbidden } from 'boom';
import * as Joi from 'joi';

type Resolvers = {
  objectIdentityResolver: (request: any) => ObjectIdentity;
  securityIdentityResolver: (request: any) => SecurityIdentity | SecurityIdentity[];
};

type PluginOptions = {
  yaacl: Yaacl;
  resolvers: Resolvers;
};

class Plugin {
  private static instance: Plugin;

  private static schema = Joi.object().keys({
    instance: Joi.required(),
    identityResolver: Joi.func().required(),
    resourceResolver: Joi.func().required(),
  });

  private static isIdentityArray(
    identity: SecurityIdentity | SecurityIdentity[],
  ): identity is SecurityIdentity[] {
    return Array.isArray(identity);
  }

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

  private server: any;
  private options: PluginOptions;

  private constructor(server: any, options: PluginOptions) {
    this.server = server;
    this.server.ext('onPostAuth', this.onPostAuth.bind(this));
    this.server.expose('api', this.options.yaacl);
    this.options = options;
  }

  private async onPostAuth(request, h) {
    const options = request.route.settings.plugins.yaacl;
    let allowed = false;

    if (options && options.privileges) {
      const securityIdentity = this.options.resolvers.securityIdentityResolver(request);
      const objectIdentity = this.options.resolvers.objectIdentityResolver(request);

      if (!securityIdentity) {
        throw unauthorized();
      }

      if (Plugin.isIdentityArray(securityIdentity)) {
        let index = 0;

        while (allowed === false && index < securityIdentity.length) {
          allowed = await this.options.yaacl.granted(
            securityIdentity[index],
            objectIdentity,
            options.privileges,
          );
        }
      } else {
        allowed = await this.options.yaacl.granted(
          securityIdentity,
          objectIdentity,
          options.privileges,
        );
      }

      if (!allowed) {
        return forbidden();
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
