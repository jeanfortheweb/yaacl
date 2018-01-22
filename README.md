# YAACL - Yet another ACL

YAACL is a quiet simple and easy to learn ACL interface for node. With the possibility for custom adapters and an abstract but yet simple API it can be integrated in any service that needs a little more than just roles to manage access.

## How to use

1. Install the yaacl core and an adapter of your choice

```
yarn install @yaacl/core @yaacl/memory-adapter
```

2. Create a yaacl and use it.

```
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

## API

The Yaacl API build on three things:

* Security identities: Things like users, roles...
* Object identities: Things like blog posts, pages...
* Privileges: A bitmask that stores access information.

So basicly it just binds a bitmask of privigeles to a security<->object identity relation. That's it.

To make an object a security identity, it has to fulfill the `SecurityIdentity` interface:

```
interface SecurityIdentity {
  getSecurityId: () => string;
}
```

As soon as an object fulfills this interface, it can be used as security identity. `getSecurityId` should be implemented to return a unique identifier for each identity. If you implement `SecurityIdentity` an an user class for example, that could be the ID of that user.

Same thing for the `ObjectIdentity` interface:

```
interface ObjectIdentity {
  getObjectId: () => string;
}
```

An object/class could even be a `SecurityIdentity` and an `ObjectIdentity` at the same time. Imagine that you have a role entity which can act as `SecurityIdentity`, you could also make it an `ObjectIdentity` to determine who is allowed to manipulate that role entity.

Privileges are represented as bitmask, but don't worry, you don't have to learn them all. They are already predefined by the `Privileges` enumeration:

```
export enum Privileges {
  NONE = 0,
  READ = 1,
  WRITE = 2,
  CREATE = 4,
  REMOVE = 8,
  UPDATE = 16,
  ALL = READ | WRITE | CREATE | REMOVE | UPDATE,
}
```

These are the defaults which should work for most use cases, but you can define your own at any time. As long as they are represented as bitmask, everything is fine!

Once you have at least one `SecurityIdentity` and one `ObjectIdentity`, you can use them on the guarian methods:

```
async store(securityIdentity: SecurityIdentity, objectIdentity: ObjectIdentity, privileges: Privileges) => Promise<any>
```

Takes the given identities and stores the given privileges for them. Exisiting privileges are overwritten.

```
async retrieve(securityIdentity: SecurityIdentity, objectIdentity: ObjectIdentity) => Promise<Privileges = Privileges.NONE>
```

Retrieves the currently stored privileges for the given identity relation. If none is stored, the function returns `Privileges.NONE` (0).

```
async grant(securityIdentity: SecurityIdentity, objectIdentity: ObjectIdentity, privileges: Privileges) => Promise<any>
```

Does the same as `store`, but it will combine existing privileges with the given privileges without discarding them.

```
async deny(securityIdentity: SecurityIdentity, objectIdentity: ObjectIdentity, privileges: Privileges) => Promise<any>
```

Does the same as `store`, but it will substract the given privileges from the existing privileges without discarding them.

```
async granted(securityIdentity: SecurityIdentity, objectIdentity: ObjectIdentity, privileges: Privileges) => Promise<boolean>
```

Takes the given privileges for the given identity relation and compares them to the stored privileges.
If they match, the method returns true, otherwise false.

```
async delete(securityIdentity: SecurityIdentity, objectIdentity?: ObjectIdentity = null) => Promise<any>
```

Takes the given security identity and deletes the privileges for the given object identity. If no object identity is given, all privileges for all known object identities are deleted.

## Writing Adapters

Coming soon...
