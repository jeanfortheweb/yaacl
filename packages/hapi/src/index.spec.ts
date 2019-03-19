import * as Hapi from 'hapi';
import * as plugin from './';
import { Privileges, SecurityIdentity } from '@yaacl/core';
import { MemoryAdapter } from '@yaacl/memory-adapter';

const server: Hapi.Server = new Hapi.Server({
  port: 8080,
});

const securityIdentityResolver = jest.fn().mockReturnValue({
  getSecurityId: () => 'user-1',
});

const assertStatusCode = async (url: string, code: Number) => {
  const response = await server.inject({
    url,
  });

  expect(response.statusCode).toBe(code);
};

const assertGrant = async (url: string, route: any) => {
  const routeIdentity = (server.plugins as any).yaacl.getRouteIdentity(route);
  const securityIdentity = { getSecurityId: () => 'user-1' };

  securityIdentityResolver.mockReturnValue(securityIdentity);

  await (server.plugins as any).yaacl.api.deny(securityIdentity, routeIdentity, Privileges.READ);
  await assertStatusCode(url, 403);
  await (server.plugins as any).yaacl.api.grant(securityIdentity, routeIdentity, Privileges.READ);
  await assertStatusCode(url, 200);
};

const securedRoute = {
  path: '/secured',
  method: 'GET',
  options: {
    plugins: {
      yaacl: {
        privileges: Privileges.READ,
      },
    },
  },
  handler: () => 'ALL OK',
};

const groupedRoute = {
  path: '/grouped',
  method: 'GET',
  options: {
    plugins: {
      yaacl: {
        group: 'grouped-access',
        privileges: Privileges.READ,
      },
    },
  },
  handler: () => 'ALL OK',
};

const customRoute = {
  path: '/custom',
  method: 'GET',
  options: {
    plugins: {
      yaacl: {
        identity: {
          getObjectId: () => 'custom',
        },
        privileges: Privileges.READ,
      },
    },
  },
  handler: () => 'ALL OK',
};

const invalidRoute = {
  path: '/invalid',
  method: ['GET', 'POST'],
  handler: () => 'ALL OK',
};

const resolveRoute = {
  path: '/resolve',
  method: 'GET',
  options: {
    plugins: {
      yaacl: {
        identity: {
          getObjectId: () => 'resolve',
        },
        privileges: Privileges.READ,
      },
    },
  },
  handler: request => {
    expect(request.plugins.yaacl).toBeDefined();
    expect(request.plugins.yaacl.securityIdentity.getSecurityId()).toEqual('user-1');
    expect(request.plugins.yaacl.objectIdentity.getObjectId()).toEqual('resolve');

    return 'ALL OK';
  },
};

const publicRoute = {
  path: '/public',
  method: 'GET',
  handler: () => 'ALL OK',
};

server.route([securedRoute, groupedRoute, customRoute, resolveRoute, publicRoute]);

test('registers', async () => {
  await server.register({
    plugin,
    options: {
      adapter: new MemoryAdapter(),
      securityIdentityResolver,
    },
  });
});

test('throws unauthorized when no security identity is given', async () => {
  securityIdentityResolver.mockReturnValueOnce(null);

  await assertStatusCode('/secured', 401);
});

test('throws forbidden when privileges do not match', async () => {
  await assertStatusCode('/secured', 403);
});

test('handles multiple security identities properly', async () => {
  const securityIdentityArray: SecurityIdentity[] = [
    {
      getSecurityId: () => 'user-1',
    },
    {
      getSecurityId: () => 'user-2',
    },
  ];

  securityIdentityResolver.mockReset();
  securityIdentityResolver.mockReturnValue(securityIdentityArray);

  await (server.plugins as any).yaacl.api.grant(
    securityIdentityArray[1],
    (server.plugins as any).yaacl.getRouteIdentity(securedRoute),
    Privileges.READ,
  );

  await assertStatusCode('/secured', 200);
});

test('handles grouped routes properly', async () => {
  await assertGrant('/grouped', groupedRoute);
});

test('handles custom identities properly', async () => {
  await assertGrant('/custom', customRoute);
});

test('resolved identities are present', async () => {
  await assertGrant('/resolve', resolveRoute);
});

test('getRouteIdentity helper does work without any route options', async () => {
  const identity = (server.plugins as any).yaacl.getRouteIdentity(publicRoute);

  expect(typeof identity.getObjectId).toEqual('function');
  expect(identity.getObjectId()).toEqual(`${publicRoute.method.toUpperCase()}:${publicRoute.path}`);
});

test('ignores routes without configured privileges', async () => {
  await assertStatusCode('/public', 200);
});

test('should throw on routes with multiple methods assigned', async () => {
  expect(() => {
    (server.plugins as any).yaacl.getRouteIdentity(invalidRoute);
  }).toThrow();
});
