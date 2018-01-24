import { Yaacl, ObjectIdentity, SecurityIdentity, Privileges, Adapter } from './index';

const mockData: {
  [securityIdentity: string]: {
    [objectIdentity: string]: Privileges;
  };
} = {};

const mockAdapter: Adapter = {
  store(
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ): Promise<any> {
    if (!mockData[securityIdentity.getSecurityId()]) {
      mockData[securityIdentity.getSecurityId()] = {};
    }

    mockData[securityIdentity.getSecurityId()][objectIdentity.getObjectId()] = privileges;

    return Promise.resolve();
  },

  retrieve(
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
  ): Promise<Privileges> {
    if (!mockData[securityIdentity.getSecurityId()]) {
      return Promise.resolve(Privileges.NONE);
    }

    return Promise.resolve(
      mockData[securityIdentity.getSecurityId()][objectIdentity.getObjectId()],
    );
  },

  delete(securityIdentity?: SecurityIdentity, objectIdentity?: ObjectIdentity): Promise<any> {
    if (securityIdentity && objectIdentity) {
      delete mockData[securityIdentity.getSecurityId()][objectIdentity.getObjectId()];
    }

    if (securityIdentity && !objectIdentity) {
      delete mockData[securityIdentity.getSecurityId()];
    }

    if (objectIdentity && !securityIdentity) {
      Object.keys(mockData).forEach((securityId: string) => {
        mockData[securityId] = Object.keys(mockData[securityId])
          .filter((objectId: string) => objectId !== objectIdentity.getObjectId())
          .reduce(
            (nextData, objectId) => ({ ...nextData, [objectId]: mockData[securityId][objectId] }),
            {},
          );
      });
    }

    return Promise.resolve();
  },
};

const securityIdentity: SecurityIdentity = {
  getSecurityId: () => 'user-1',
};

const objectIdentity: ObjectIdentity = {
  getObjectId: () => 'object-1',
};

const yaacl = new Yaacl(mockAdapter);

describe('yaacl', () => {
  test('privileges to be initially NONE', async () => {
    expect(await yaacl.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.NONE);
  });

  test('privileges stored as expected', async () => {
    await yaacl.store(securityIdentity, objectIdentity, Privileges.CREATE);

    expect(await yaacl.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.CREATE);
  });

  test('privileges granted as expected', async () => {
    await yaacl.grant(securityIdentity, objectIdentity, Privileges.CREATE);

    expect(await yaacl.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.CREATE);

    await yaacl.grant(securityIdentity, objectIdentity, Privileges.READ);

    expect(await yaacl.retrieve(securityIdentity, objectIdentity)).toEqual(
      Privileges.CREATE | Privileges.READ,
    );
  });

  test('privileges denied as expected', async () => {
    await yaacl.deny(securityIdentity, objectIdentity, Privileges.CREATE);

    expect(await yaacl.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.READ);

    await yaacl.deny(securityIdentity, objectIdentity, Privileges.READ);

    expect(await yaacl.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.NONE);
  });

  test('privileges compared as expected', async () => {
    await yaacl.store(securityIdentity, objectIdentity, Privileges.NONE);
    await yaacl.grant(securityIdentity, objectIdentity, Privileges.CREATE);
    await yaacl.deny(securityIdentity, objectIdentity, Privileges.REMOVE);

    expect(await yaacl.granted(securityIdentity, objectIdentity, Privileges.CREATE)).toBeTruthy();

    expect(await yaacl.granted(securityIdentity, objectIdentity, Privileges.REMOVE)).toBeFalsy();
  });

  test('privileges deleted as expected', async () => {
    await yaacl.delete(securityIdentity, objectIdentity);

    expect(await yaacl.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.NONE);

    await yaacl.store(securityIdentity, objectIdentity, Privileges.CREATE);

    expect(await yaacl.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.CREATE);

    await yaacl.delete(securityIdentity);

    expect(await yaacl.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.NONE);

    await yaacl.store(securityIdentity, objectIdentity, Privileges.CREATE);

    expect(await yaacl.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.CREATE);

    await yaacl.delete(objectIdentity);

    expect(await yaacl.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.NONE);
  });

  test('privileges are not deleted with invalid arguments', async () => {
    expect(yaacl.delete(objectIdentity, securityIdentity)).rejects.toBeTruthy();
    expect(yaacl.delete(securityIdentity, securityIdentity)).rejects.toBeTruthy();
    expect(yaacl.delete(objectIdentity, objectIdentity)).rejects.toBeTruthy();
  });
});
