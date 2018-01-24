import * as Hapi from 'hapi';
import plugin from './';
import { Privileges, SecurityIdentity } from '@yaacl/core';
import { MemoryAdapter } from '@yaacl/memory-adapter';

describe('@yaacl/hapi', () => {
  const server: any = Hapi.server({
    port: 8080,
  });

  const securityIdentityResolver = jest.fn();

  const assertStatusCode = async (url: string, code: Number) => {
    const response = await server.inject({
      url,
    });

    expect(response.statusCode).toBe(code);
  };

  server.route({
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
  });

  server.route({
    path: '/public',
    method: 'GET',
    handler: () => 'ALL OK',
  });

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
    await assertStatusCode('/secured', 401);
  });

  test('plugin throws forbidden when privileges do not match', async () => {
    securityIdentityResolver.mockReturnValueOnce({
      getSecurityId: () => 'user-1',
    });

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

    securityIdentityResolver.mockReturnValueOnce(securityIdentityArray);

    await server.plugins.yaacl.api.grant(
      securityIdentityArray[1],
      { getObjectId: () => 'GET:/secured' },
      Privileges.READ,
    );

    assertStatusCode('/secured', 200);
  });

  test('plugin ignores routes without configured privileges', async () => {
    assertStatusCode('/public', 200);
  });
});
