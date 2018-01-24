# YAACL - Memmory Adapter

The memory adapter can mainly used for prototyping or tests, since it does not persist any ACL information.

## How to use

1. Install the yaacl core and an adapter of your choice:

```sh
yarn install @yaacl/core @yaacl/memory-adapter
```

2. Create a yaacl and use it:

```ts
import { Yaacl, Privileges, SecurityIdentity, ObjectIdentity } from '@yaacl/core';
import { MemoryAdapter } from '@yaacl/memory-adapter';

const yaacl = new Yaacl(new MemoryAdapter());

// a security identity could be a user, a role...
const securityIdentity: SecurityIdentity = {
	getSecurityId: () => 'user-242',
};

// an object identity could be anything, like a blog post, a page...
const objectIdentity: ObjectIdentity = {
	getObjectId: () => 'object-4664';
};

const example = async () => {
  await yaacl.grant(securityIdentity, objectIdentity, Privileges.READ);
  await yaacl.granted(securityIdentity, objectIdentity, Privileges.READ); // true
  await yaacl.granted(securityIdentity, objectIdentity, Privileges.WRITE) // false
}

example();
```

For a full documentation of YAACL, please visit our [Wiki](https://github.com/jeanfortheweb/yaacl/wiki)
