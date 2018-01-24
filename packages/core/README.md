# YAACL - Yet another ACL

[![Build Status](https://travis-ci.org/jeanfortheweb/yaacl.svg?branch=master)](https://travis-ci.org/jeanfortheweb/yaacl)
[![codecov](https://codecov.io/gh/jeanfortheweb/yaacl/branch/master/graph/badge.svg)](https://codecov.io/gh/jeanfortheweb/yaacl)
[![Maintainability](https://api.codeclimate.com/v1/badges/ad51f3d8bbfa8ae53026/maintainability)](https://codeclimate.com/github/jeanfortheweb/yaacl/maintainability)

YAACL is a quiet simple and easy to learn ACL interface for node. With the possibility for custom adapters and an abstract but yet simple API it can be integrated in any service that needs a little more than just roles to manage access.

YAACL is written in TypeScript and therefore it makes heavy use of its advantages. All examples and documentation are also written in TypeScript.

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
