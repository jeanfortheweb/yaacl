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

    delete(securityIdentity?: SecurityIdentity, objectIdentity?: ObjectIdentity): Promise<any> {
      if (securityIdentity && objectIdentity) {
        delete data[securityIdentity.getSecurityId()][objectIdentity.getObjectId()];
      }

      if (securityIdentity && !objectIdentity) {
        delete data[securityIdentity.getSecurityId()];
      }

      if (objectIdentity && !securityIdentity) {
        Object.keys(data).forEach((securityId: string) => {
          data[securityId] = Object.keys(data[securityId])
            .filter((objectId: string) => objectId !== objectIdentity.getObjectId())
            .reduce(
              (nextData, objectId) => ({ ...nextData, [objectId]: data[securityId][objectId] }),
              {},
            );
        });
      }

      return Promise.resolve();
    },
  });
};
