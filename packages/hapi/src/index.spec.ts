import * as Hapi from 'hapi';
import plugin from './';
import { Privileges, SecurityIdentity } from '@yaacl/core';
import { MemoryAdapter } from '@yaacl/memory-adapter';

describe('@yaacl/hapi', () => {
  const server: any = Hapi.server({
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

  const publicRoute = {
    path: '/public',
    method: 'GET',
    handler: () => 'ALL OK',
  };

  server.route([securedRoute, groupedRoute, publicRoute]);

  test('plugin registers', async () => {
    await server.register({
      plugin,
      options: {
        adapter: new MemoryAdapter(),
        securityIdentityResolver,
      },
    });
  });

  test('plugin throws unauthorized when no security identity is given', async () => {
    securityIdentityResolver.mockReturnValueOnce(null);

    await assertStatusCode('/secured', 401);
  });

  test('plugin throws forbidden when privileges do not match', async () => {
    await assertStatusCode('/secured', 403);
  });

  test('plugin handles multiple security identities properly', async () => {
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

    await server.plugins.yaacl.api.grant(
      securityIdentityArray[1],
      server.plugins.yaacl.getRouteIdentity(securedRoute),
      Privileges.READ,
    );

    await assertStatusCode('/secured', 200);
  });

  test('plugin handles grouped routes properly', async () => {
    securityIdentityResolver.mockReturnValueOnce({
      getSecurityId: () => 'user-1',
    });

    await assertStatusCode('/grouped', 403);

    console.log(server.plugins.yaacl.getRouteIdentity(groupedRoute).getObjectId());
    await server.plugins.yaacl.api.grant(
      { getSecurityId: () => 'user-1' },
      server.plugins.yaacl.getRouteIdentity(groupedRoute),
      Privileges.READ,
    );

    await assertStatusCode('/grouped', 200);
  });

  test('plugin ignores routes without configured privileges', async () => {
    await assertStatusCode('/public', 200);
  });
});
