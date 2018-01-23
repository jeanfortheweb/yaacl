import { create, ObjectIdentity, SecurityIdentity, Privileges, Adapter } from './index';

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
  },
};

const securityIdentity: SecurityIdentity = {
  getSecurityId: () => 'user-1',
};

const objectIdentity: ObjectIdentity = {
  getObjectId: () => 'object-1',
};

const guardian = create(mockAdapter);

describe('guardian', () => {
  test('privileges to be initially NONE', async () => {
    expect(await guardian.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.NONE);
  });

  test('privileges stored as expected', async () => {
    await guardian.store(securityIdentity, objectIdentity, Privileges.CREATE);

    expect(await guardian.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.CREATE);
  });

  test('privileges granted as expected', async () => {
    await guardian.grant(securityIdentity, objectIdentity, Privileges.CREATE);

    expect(await guardian.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.CREATE);

    await guardian.grant(securityIdentity, objectIdentity, Privileges.READ);

    expect(await guardian.retrieve(securityIdentity, objectIdentity)).toEqual(
      Privileges.CREATE | Privileges.READ,
    );
  });

  test('privileges denied as expected', async () => {
    await guardian.deny(securityIdentity, objectIdentity, Privileges.CREATE);

    expect(await guardian.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.READ);

    await guardian.deny(securityIdentity, objectIdentity, Privileges.READ);

    expect(await guardian.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.NONE);
  });

  test('privileges compared as expected', async () => {
    await guardian.store(securityIdentity, objectIdentity, Privileges.NONE);
    await guardian.grant(securityIdentity, objectIdentity, Privileges.CREATE);
    await guardian.deny(securityIdentity, objectIdentity, Privileges.REMOVE);

    expect(
      await guardian.granted(securityIdentity, objectIdentity, Privileges.CREATE),
    ).toBeTruthy();

    expect(await guardian.granted(securityIdentity, objectIdentity, Privileges.REMOVE)).toBeFalsy();
  });

  test('privileges deleted as expected', async () => {
    await guardian.delete(securityIdentity, objectIdentity);

    expect(await guardian.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.NONE);

    await guardian.store(securityIdentity, objectIdentity, Privileges.CREATE);

    expect(await guardian.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.CREATE);

    await guardian.delete(securityIdentity);

    expect(await guardian.retrieve(securityIdentity, objectIdentity)).toEqual(Privileges.NONE);
  });
});
