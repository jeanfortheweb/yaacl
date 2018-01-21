export interface Adapter {
  store: (
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ) => Promise<any>;

  retrieve: (
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
  ) => Promise<Privileges>;

  delete: (securityIdentity: SecurityIdentity, objectIdentity?: ObjectIdentity) => Promise<any>;
}

export interface Instance {
  store: (
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ) => Promise<any>;

  retrieve: (
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
  ) => Promise<Privileges>;

  grant: (
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ) => Promise<any>;

  deny: (
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ) => Promise<any>;

  delete: (securityIdentity: SecurityIdentity, objectIdentity?: ObjectIdentity) => Promise<any>;

  granted: (
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ) => Promise<boolean>;
}

export interface ObjectIdentity {
  getObjectId: () => string;
}

export interface SecurityIdentity {
  getSecurityId: () => string;
}

export enum Privileges {
  NONE = 0,
  READ = 1,
  WRITE = 2,
  CREATE = 4,
  REMOVE = 8,
  UPDATE = 16,
  ALL = READ | WRITE | CREATE | REMOVE | UPDATE,
}

export const create = (adapter: Adapter): Instance => {
  const store = async (
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ): Promise<any> => await adapter.store(securityIdentity, objectIdentity, privileges);

  const retrieve = async (
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
  ): Promise<Privileges> =>
    (await adapter.retrieve(securityIdentity, objectIdentity)) || Privileges.NONE;

  const grant = async (
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ): Promise<any> =>
    store(
      securityIdentity,
      objectIdentity,
      (await retrieve(securityIdentity, objectIdentity)) | privileges,
    );

  const _delete = async (
    securityIdentity: SecurityIdentity,
    objectIdentity?: ObjectIdentity,
  ): Promise<any> => adapter.delete(securityIdentity, objectIdentity);

  const deny = async (
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ): Promise<any> =>
    store(
      securityIdentity,
      objectIdentity,
      (await retrieve(securityIdentity, objectIdentity)) & ~privileges,
    );

  const granted = async (
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ): Promise<boolean> =>
    ((await retrieve(securityIdentity, objectIdentity)) & privileges) === privileges;

  return {
    store,
    retrieve,
    delete: _delete,
    grant,
    deny,
    granted,
  };
};
