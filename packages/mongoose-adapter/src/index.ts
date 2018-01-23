import { Adapter, Privileges, SecurityIdentity, ObjectIdentity } from '@yaacl/core';
import * as mongoose from 'mongoose';

interface EntryDocument extends mongoose.Document {
  securityIdentity: string;
  objectIdentity: string;
  privileges: number;
}

const EntrySchema = new mongoose.Schema({
  securityIdentity: String,
  objectIdentity: String,
  privileges: Number,
});

const EntryModel = mongoose.model<EntryDocument>('__GUARDIAN__', EntrySchema);

export const create = (): Adapter =>
  Object.freeze<Adapter>({
    store: async (
      securityIdentity: SecurityIdentity,
      objectIdentity: ObjectIdentity,
      privileges: Privileges,
    ): Promise<any> => {
      let entry = await EntryModel.findOne({
        securityIdentity: securityIdentity.getSecurityId(),
        objectIdentity: objectIdentity.getObjectId(),
      }).exec();

      if (!entry) {
        entry = new EntryModel({
          securityIdentity: securityIdentity.getSecurityId(),
          objectIdentity: objectIdentity.getObjectId(),
        });
      }

      entry.privileges = privileges;

      await entry.save();
    },

    retrieve: async (
      securityIdentity: SecurityIdentity,
      objectIdentity: ObjectIdentity,
    ): Promise<Privileges> => {
      const entry = await EntryModel.findOne({
        securityIdentity: securityIdentity.getSecurityId(),
        objectIdentity: objectIdentity.getObjectId(),
      }).exec();

      return (entry && entry.privileges) || Privileges.NONE;
    },

    delete: async (
      securityIdentity?: SecurityIdentity,
      objectIdentity?: ObjectIdentity,
    ): Promise<any> => {
      const conditions: any = {};

      if (securityIdentity) {
        conditions.securityIdentity = securityIdentity.getSecurityId();
      }

      if (objectIdentity) {
        conditions.objectIdentity = objectIdentity.getObjectId();
      }

      await EntryModel.remove(conditions).exec();
    },
  });
