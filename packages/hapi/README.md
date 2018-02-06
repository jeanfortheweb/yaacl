# YAACL - Hapi Integration

Provides a plugin for [hapi](https://github.com/hapijs/hapi) to integrate [yaacl](https://github.com/jeanfortheweb/yaacl) on route and/or handler level.

Install `yarn add @yaacl/core @yaacl/hapi @yaacl/memory-adapter` or use `@yaacl/mongoose-adapter` instead.

```ts
import { Privileges } from '@yaacl/core';
import { MemoryAdapter } from '@yaacl/memory-adapter';
import * as Hapi from 'hapi';
import { forbidden } from 'boom';

// ...setup server

// normally these would come from the session for example.
const exampleIdentities = [
  {
    getSecurityId: () => 'user-1',
  },
  {
    getSecurityId: () => 'user-2',
  },
];

// register plugin on server
await server.register({
  plugin,
  options: {
    adapter: new MemoryAdapter(),
    securityIdentityResolver: request => {
      // return one or an array of SecurityIdentity objects
      // which you can generate from request data.
      return exampleIdentities;
    },
  },
});

// setting privileges on a route activates acl
// for the path/method of the route.
const securedRoute = server.route({
  path: '/secured',
  method: 'get',
  options: {
    plugins: {
      yaacl: {
        privileges: Privileges.READ,
      },
    },
  },
  handler: () => 'Seems like you have access to this site!',
});

// instead of using the path/method as identity,
// you can define groups.
const adminRoutes = [
  {
    path: '/admin/list',
    method: 'get',
    options: {
      plugins: {
        yaacl: {
          group: 'admins',
          privileges: Privileges.READ,
        },
      },
    },
    handler: () => 'Seems like you have access to this site!',
  },
  {
    path: '/admin/delete',
    method: 'get',
    options: {
      plugins: {
        yaacl: {
          group: 'admins',
          privileges: Privileges.READ | Privileges.REMOVE,
        },
      },
    },
    handler: request => {
      // for more fine grained checks, you have access to yaacl inside of handlers too!
      const granted = await request.server.plugins.yaacl.api.isGranted(
        exampleIdentities[0],
        someOtherObjectIdentity,
        Privileges.REMOVE,
      );

      if (granted) {
        return 'Deleted!';
      }

      throw forbidden();
    },
  },
];

// add the routes of course!
server.route([...adminRoutes, securedRoute]);

// to set privileges for routes, use the plugin helper to turn a route into an object identity.
await server.plugins.yaacl.api.grant(
  exampleIdentities[0],
  server.plugins.yaacl.getRouteIdentity(securedRoute),
);
```

For a more detailed documentation please visit our [Wiki](https://github.com/jeanfortheweb/yaacl/wiki).
