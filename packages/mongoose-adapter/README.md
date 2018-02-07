# YAACL - Mongoose Adapter

This YAACL adapter utilizes mongoose and mondodb to persist ACL information.
There is no configuration required, but the adapter assumes that you open your mongoose/mongodb
connection yourself before using it.

## How to use

1. Install the yaacl core and an adapter of your choice:

```sh
yarn install @yaacl/core @yaacl/mongoose-adapter
```

2. Create a yaacl and use it:

```ts
import { Yaacl, Privileges, SecurityIdentity, ObjectIdentity } from '@yaacl/core';
import { MongooseAdapter } from '@yaacl/mongoose-adapter';
import { createConnection } from 'mongoose';

const example = async () => {
  const connection = await createConnection('mongodb://localhost/mongoose-adapter-test');
  const yaacl = new Yaacl(new MongooseAdapter(connection));

  // a security identity could be a user, a role...
  const securityIdentity: SecurityIdentity = {
    getSecurityId: () => 'user-242',
  };

  // an object identity could be anything, like a blog post, a page...
  const objectIdentity: ObjectIdentity = {
    getObjectId: () => 'object-4664',
  };

  await yaacl.grant(securityIdentity, objectIdentity, Privileges.READ);
  await yaacl.granted(securityIdentity, objectIdentity, Privileges.READ); // true
  await yaacl.granted(securityIdentity, objectIdentity, Privileges.WRITE); // false
};

example();
```

For a full documentation of YAACL, please visit our [Wiki](https://github.com/jeanfortheweb/yaacl/wiki)

```

```
