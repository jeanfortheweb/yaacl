import { ObjectIdentity, SecurityIdentity, Privileges } from '@yaacl/core';
import { connect, connection } from 'mongoose';
import { create } from './';

const securityIdentity: SecurityIdentity = {
  getSecurityId: () => `identity-user-1`,
};

const objectIdentity: ObjectIdentity = {
  getObjectId: () => `resource-empty-1`,
};

const adapter = create();

describe('@yaacl/mongoose-adapter', () => {
  beforeAll(async () => {
    await connect('mongodb://localhost/mongoose-adapter-test');
    await connection.db.dropDatabase();
  });

  afterAll(async () => {});

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
  });
});
