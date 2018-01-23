# YAACL - Memmory Adapter

The memory adapter can mainly used for prototyping or tests, since it does not persist any ACL information.

## How to use

1. Install the yaacl core and the adapter:

```sh
yarn install @yaacl/core @yaacl/memory-adapter
```

2. Create a yaacl and use it:

```js
import { create as createYaacl, Privileges } from '@yaacl/core';
import { create as createAdapter } from '@yaacl/memory-adapter';

const yaacl = createYaacl(createAdapter());

// a security identity could be a user
const securityIdentity = {
	getSecurityId: () => 'user-242',
};

// an object identity could be anything, like a blog post.
const objectIdentity = {
	getObjectId: () => 'object-4664';
};

yaacl.grant(securityIdentity, objectIdentity, Privileges.READ);

yaacl.granted(securityIdentity, objectIdentity, Privileges.READ); // true

yaacl.granted(securityIdentity, objectIdentity, Privileges.WRITE) // false
```
