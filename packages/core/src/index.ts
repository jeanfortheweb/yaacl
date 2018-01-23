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

  delete: (securityIdentity?: SecurityIdentity, objectIdentity?: ObjectIdentity) => Promise<any>;
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

  delete: (
    identityA: SecurityIdentity | ObjectIdentity,
    identityB?: SecurityIdentity | ObjectIdentity,
  ) => Promise<any>;

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

export const isObjectIdentity = (value: any): value is ObjectIdentity =>
  value && typeof (<ObjectIdentity>value).getObjectId === 'function';

export const isSecurityIdentity = (value: any): value is SecurityIdentity =>
  value && typeof (<SecurityIdentity>value).getSecurityId === 'function';

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
    identityA: SecurityIdentity | ObjectIdentity,
    identityB?: SecurityIdentity | ObjectIdentity,
  ): Promise<any> => {
    if (isSecurityIdentity(identityA) && !identityB) {
      return adapter.delete(identityA, identityB);
    }

    if (isObjectIdentity(identityA) && !identityB) {
      return adapter.delete(identityB, identityA);
    }

    if (isSecurityIdentity(identityA) && isObjectIdentity(identityB)) {
      return adapter.delete(identityA, identityB);
    }

    throw new Error(
      'Invalid combination of arguments. You can either pass a single SecurityIdentity, a single ObjectIdentity or a SecurityIdentity and an ObjectIdentity in order.',
    );
  };

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
