import { ObjectIdentity, SecurityIdentity, Privileges } from '@yaacl/core';
import { create } from './';

const securityIdentity: SecurityIdentity = {
  getSecurityId: () => `identity-user-1`,
};

const objectIdentity: ObjectIdentity = {
  getObjectId: () => `resource-empty-1`,
};

const objectIdentity2: ObjectIdentity = {
  getObjectId: () => `resource-empty-2`,
};

const adapter = create();

describe('@yaacl/memory-storage', () => {
  test('privileges to be initially undefined', async () => {
    expect(await adapter.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.NONE);
  });

  test('privileges stored and retrieved as expected', async () => {
    await adapter.store(securityIdentity, objectIdentity, Privileges.CREATE);

    expect(await adapter.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.CREATE);
  });

  test('privileges deleted as expected', async () => {
    await adapter.delete(securityIdentity, objectIdentity);

    expect(await adapter.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.NONE);

    await adapter.store(securityIdentity, objectIdentity, Privileges.CREATE);

    expect(await adapter.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.CREATE);

    await adapter.delete(securityIdentity);

    expect(await adapter.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.NONE);

    await adapter.store(securityIdentity, objectIdentity, Privileges.CREATE);
    await adapter.store(securityIdentity, objectIdentity2, Privileges.CREATE);

    expect(await adapter.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.CREATE);
    expect(await adapter.retrieve(securityIdentity, objectIdentity2)).toEqual(Privileges.CREATE);

    await adapter.delete(undefined, objectIdentity);

    expect(await adapter.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.NONE);
    expect(await adapter.retrieve(securityIdentity, objectIdentity2)).toEqual(Privileges.CREATE);
  });
});
