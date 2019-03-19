import { Yaacl, Adapter, SecurityIdentity, ObjectIdentity, Privileges } from '@yaacl/core';
import { unauthorized, forbidden } from 'boom';
import * as Joi from 'joi';
import { Server, Request, ResponseToolkit, RequestRoute, ServerRoute } from 'hapi';

export interface PluginOptions {
  adapter: Adapter;
  securityIdentityResolver: (
    request: Request,
  ) =>
    | Promise<SecurityIdentity | SecurityIdentity[]>
    | SecurityIdentity
    | SecurityIdentity[]
    | undefined;
}

export interface PluginSpecificRouteSettings {
  privileges?: number;
  identity?: ObjectIdentity;
  group?: string;
}

export interface PluginState {
  yaacl: {
    securityIdentity: SecurityIdentity;
    objectIdentity: ObjectIdentity;
  };
}

function isServerRoute(route: RequestRoute | ServerRoute): route is ServerRoute {
  return typeof (route as any).handler === 'function';
}

function getRoutePluginOptions(route: RequestRoute | ServerRoute): PluginSpecificRouteSettings {
  let candidate: any = null;

  // if passed from user/pure configuration.
  if (isServerRoute(route)) {
    if (route.options && typeof route.options !== 'function') {
      candidate = route.options && route.options.plugins && (route.options.plugins as any).yaacl;
    }
  } else {
    // if passed from request.
    candidate =
      route.settings &&
      route.settings.plugins &&
      route.settings.plugins &&
      (route.settings.plugins as any).yaacl;
  }

  if (candidate) {
    return candidate as PluginSpecificRouteSettings;
  }

  return {};
}

export const getRouteIdentity = (route: RequestRoute | ServerRoute): ObjectIdentity => {
  const options = getRoutePluginOptions(route);

  if (options.identity) {
    return options.identity;
  }

  if (options.group) {
    return {
      getObjectId: () => options.group as string,
    };
  }

  if (Array.isArray(route.method)) {
    throw new Error(
      `Routes with multiple methods are currently not supported by getRouteIdentity()`,
    );
  }

  return {
    getObjectId: () => `${route.method.toString().toUpperCase()}:${route.path}`,
  };
};

const schema = Joi.object().keys({
  adapter: Joi.required(),
  securityIdentityResolver: Joi.func().required(),
});

async function getSecurityIdentityArray(
  options: PluginOptions,
  request: Request,
): Promise<SecurityIdentity[]> {
  const securityIdentity = await options.securityIdentityResolver(request);

  if (securityIdentity === undefined || securityIdentity === null) {
    throw unauthorized();
  }

  if (Array.isArray(securityIdentity)) {
    return securityIdentity;
  }

  return [securityIdentity];
}

async function isGranted(
  yaacl: Yaacl,
  securityIdentityArray: SecurityIdentity[],
  objectIdentity: ObjectIdentity,
  privileges: Privileges,
): Promise<[SecurityIdentity, ObjectIdentity] | false> {
  let index = 0;
  let granted = false;
  let securityIdentity: SecurityIdentity | undefined;

  while (granted === false && index < securityIdentityArray.length) {
    securityIdentity = securityIdentityArray[index];
    granted = await yaacl.granted(securityIdentity, objectIdentity, privileges);
    index++;
  }

  return granted ? [securityIdentity as SecurityIdentity, objectIdentity] : false;
}

function onPostAuth(yaacl: Yaacl, pluginOptions: PluginOptions) {
  return async (request: Request, h: ResponseToolkit) => {
    const options = getRoutePluginOptions(request.route);

    if (options.privileges) {
      const securityIdentity = await getSecurityIdentityArray(pluginOptions, request);
      const objectIdentity = getRouteIdentity(request.route);
      const granted = await isGranted(yaacl, securityIdentity, objectIdentity, options.privileges);

      if (granted === false) {
        throw forbidden();
      } else {
        (request.plugins as PluginState).yaacl = {
          securityIdentity: granted[0],
          objectIdentity: granted[1],
        };
      }
    }

    return h.continue;
  };
}

export const name = 'yaacl';
// tslint:disable-next-line:no-var-requires no-require-imports
export const version = require('../package.json').version;

export function register(server: Server, rawOptions: PluginOptions) {
  const options = Joi.attempt<PluginOptions>(rawOptions, schema, 'Invalid options');
  const yaacl = new Yaacl(options.adapter);

  server.ext('onPostAuth', onPostAuth(yaacl, options));
  server.expose('api', yaacl);
  server.expose('getRouteIdentity', getRouteIdentity);
}
