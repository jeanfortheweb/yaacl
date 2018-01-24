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
  OWNER = 16,
  ALL = READ | WRITE | CREATE | REMOVE | OWNER,
}

export class Yaacl {
  public static isObjectIdentity(value: any): value is ObjectIdentity {
    return value && typeof (<ObjectIdentity>value).getObjectId === 'function';
  }

  public static isSecurityIdentity(value: any): value is SecurityIdentity {
    return value && typeof (<SecurityIdentity>value).getSecurityId === 'function';
  }

  private adapter: Adapter;

  constructor(adapter: Adapter) {
    this.adapter = adapter;
  }

  public async store(
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ): Promise<any> {
    await this.adapter.store(securityIdentity, objectIdentity, privileges);
  }

  public async retrieve(
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
  ): Promise<Privileges> {
    return (await this.adapter.retrieve(securityIdentity, objectIdentity)) || Privileges.NONE;
  }

  public async grant(
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ): Promise<any> {
    return this.store(
      securityIdentity,
      objectIdentity,
      (await this.retrieve(securityIdentity, objectIdentity)) | privileges,
    );
  }

  public async deny(
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ): Promise<any> {
    return this.store(
      securityIdentity,
      objectIdentity,
      (await this.retrieve(securityIdentity, objectIdentity)) & ~privileges,
    );
  }

  public async granted(
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ): Promise<boolean> {
    return ((await this.retrieve(securityIdentity, objectIdentity)) & privileges) === privileges;
  }

  public async delete(
    identityA: SecurityIdentity | ObjectIdentity,
    identityB?: SecurityIdentity | ObjectIdentity,
  ): Promise<any> {
    if (Yaacl.isSecurityIdentity(identityA) && !identityB) {
      return this.adapter.delete(identityA, identityB);
    }

    if (Yaacl.isObjectIdentity(identityA) && !identityB) {
      return this.adapter.delete(identityB, identityA);
    }

    if (Yaacl.isSecurityIdentity(identityA) && Yaacl.isObjectIdentity(identityB)) {
      return this.adapter.delete(identityA, identityB);
    }

    throw new Error(
      'Invalid combination of arguments. You can either pass a single SecurityIdentity, a single ObjectIdentity or a SecurityIdentity and an ObjectIdentity in order.',
    );
  }
}
