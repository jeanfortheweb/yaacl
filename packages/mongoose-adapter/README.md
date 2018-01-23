# YAACL - Mongoose Adapter

This YAACL adapter utilizes mongoose and mondodb to persist ACL information.
There is no configuration required, but the adapter assumes that you open your mongoose/mongodb
connection yourself before using it.

## How to use

1. Install the yaacl core and the adapter:

```sh
yarn install @yaacl/core @yaacl/mongoose-adapter
```

2. Create a yaacl and use it:

```js
import { create as createYaacl, Privileges } from '@yaacl/core';
import { create as createAdapter } from '@yaacl/mongoose-adapter';
import mongoose from 'mongoose';

mongoose.connect('mongodb://locahost/yourdb');

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
