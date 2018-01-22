import { Adapter, Privileges, SecurityIdentity, ObjectIdentity } from '@yaacl/core';
import * as mongoose from 'mongoose';

interface EntryDocument extends mongoose.Document {
  identity: string;
  resource: string;
  privileges: number;
}

const EntrySchema = new mongoose.Schema({
  identity: String,
  resource: String,
  privileges: Number,
});

const EntryModel = mongoose.model<EntryDocument>('__GUARDIAN__', EntrySchema);

export const create = (): Adapter =>
  Object.freeze<Adapter>({
    async store(
      identity: SecurityIdentity,
      resource: ObjectIdentity,
      privileges: Privileges,
    ): Promise<any> {
      let entry = await EntryModel.findOne({
        identity: identity.getSecurityId(),
        resource: resource.getObjectId(),
      }).exec();

      if (!entry) {
        entry = new EntryModel({
          identity: identity.getSecurityId(),
          resource: resource.getObjectId(),
        });
      }

      entry.privileges = privileges;

      await entry.save();
    },

    async retrieve(identity: SecurityIdentity, resource: ObjectIdentity): Promise<Privileges> {
      const entry = await EntryModel.findOne({
        identity: identity.getSecurityId(),
        resource: resource.getObjectId(),
      }).exec();

      return (entry && entry.privileges) || Privileges.NONE;
    },

    delete(identity: SecurityIdentity, resource?: ObjectIdentity): Promise<any> {
      const conditions: any = {
        identity: identity.getSecurityId(),
      };

      if (resource) {
        conditions.resource = resource.getObjectId();
      }

      return EntryModel.remove(conditions).exec();
    },
  });
