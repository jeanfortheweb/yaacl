import { ObjectIdentity, SecurityIdentity, Privileges } from '@yaacl/core';
import { createConnection } from 'mongoose';
import { MongooseAdapter } from './';

const securityIdentity: SecurityIdentity = {
  getSecurityId: () => `identity-user-1`,
};

const objectIdentity: ObjectIdentity = {
  getObjectId: () => `resource-empty-1`,
};

let adapter: MongooseAdapter;

describe('@yaacl/mongoose-adapter', () => {
  beforeAll(async () => {
    const connection = await createConnection('mongodb://localhost/mongoose-adapter-test');
    await connection.db.dropDatabase();

    adapter = new MongooseAdapter(connection);
  });

  test('privileges to be initially undefined', async () => {
    expect(await adapter.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.NONE);
  });

  test('privileges stored and retrieved as expected', async () => {
    await adapter.store(securityIdentity, objectIdentity, Privileges.CREATE);

    expect(await adapter.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.CREATE);

    // double call for find entry branch
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

    expect(await adapter.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.CREATE);

    await adapter.delete(undefined, objectIdentity);

    expect(await adapter.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.NONE);
  });
});
