import { Adapter, Privileges, SecurityIdentity, ObjectIdentity } from '@yaacl/core';

type DataStore = {
  [identity: string]: {
    [resource: string]: Privileges;
  };
};

export class MemoryAdapter implements Adapter {
  private data: DataStore = {};

  public async store(
    identity: SecurityIdentity,
    resource: ObjectIdentity,
    privileges: Privileges,
  ): Promise<any> {
    if (!this.data[identity.getSecurityId()]) {
      this.data[identity.getSecurityId()] = {};
    }

    this.data[identity.getSecurityId()][resource.getObjectId()] = privileges;

    return Promise.resolve();
  }

  public async retrieve(identity: SecurityIdentity, resource: ObjectIdentity): Promise<Privileges> {
    if (!this.data[identity.getSecurityId()]) {
      return Promise.resolve(Privileges.NONE);
    }

    return Promise.resolve(
      this.data[identity.getSecurityId()][resource.getObjectId()] || Privileges.NONE,
    );
  }

  public async delete(
    securityIdentity?: SecurityIdentity,
    objectIdentity?: ObjectIdentity,
  ): Promise<any> {
    if (securityIdentity && objectIdentity) {
      delete this.data[securityIdentity.getSecurityId()][objectIdentity.getObjectId()];
    }

    if (securityIdentity && !objectIdentity) {
      delete this.data[securityIdentity.getSecurityId()];
    }

    if (objectIdentity && !securityIdentity) {
      Object.keys(this.data).forEach((securityId: string) => {
        this.data[securityId] = Object.keys(this.data[securityId])
          .filter((objectId: string) => objectId !== objectIdentity.getObjectId())
          .reduce(
            (nextData, objectId) => ({ ...nextData, [objectId]: this.data[securityId][objectId] }),
            {},
          );
      });
    }

    return Promise.resolve();
  }
}
