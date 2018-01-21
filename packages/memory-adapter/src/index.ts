import { Adapter, Privileges, SecurityIdentity, ObjectIdentity } from '@yaacl/core';

export const create = (): Adapter => {
  const data: {
    [identity: string]: {
      [resource: string]: Privileges;
    };
  } = {};

  return Object.freeze<Adapter>({
    store: (
      identity: SecurityIdentity,
      resource: ObjectIdentity,
      privileges: Privileges,
    ): Promise<any> => {
      if (!data[identity.getSecurityId()]) {
        data[identity.getSecurityId()] = {};
      }

      data[identity.getSecurityId()][resource.getObjectId()] = privileges;

      return Promise.resolve();
    },

    retrieve(identity: SecurityIdentity, resource: ObjectIdentity): Promise<Privileges> {
      if (!data[identity.getSecurityId()]) {
        return Promise.resolve(Privileges.NONE);
      }

      return Promise.resolve(
        data[identity.getSecurityId()][resource.getObjectId()] || Privileges.NONE,
      );
    },

    delete(identity: SecurityIdentity, resource?: ObjectIdentity): Promise<any> {
      if (resource) {
        delete data[identity.getSecurityId()][resource.getObjectId()];
      } else {
        delete data[identity.getSecurityId()];
      }

      return Promise.resolve();
    },
  });
};
