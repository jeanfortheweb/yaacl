import { Adapter, Privileges, SecurityIdentity, ObjectIdentity } from '@yaacl/core';
import * as mongoose from 'mongoose';

export interface EntryDocument extends mongoose.Document {
  securityIdentity: string;
  objectIdentity: string;
  privileges: number;
}

export const EntrySchema = new mongoose.Schema({
  securityIdentity: String,
  objectIdentity: String,
  privileges: Number,
});

export const EntryModel = mongoose.model<EntryDocument>('__YACCL__', EntrySchema);

export class MongooseAdapter implements Adapter {
  public async store(
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ): Promise<any> {
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
  }

  public async retrieve(
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
  ): Promise<Privileges> {
    const entry = await EntryModel.findOne({
      securityIdentity: securityIdentity.getSecurityId(),
      objectIdentity: objectIdentity.getObjectId(),
    }).exec();

    return (entry && entry.privileges) || Privileges.NONE;
  }

  public async delete(
    securityIdentity?: SecurityIdentity,
    objectIdentity?: ObjectIdentity,
  ): Promise<any> {
    const conditions: any = {};

    if (securityIdentity) {
      conditions.securityIdentity = securityIdentity.getSecurityId();
    }

    if (objectIdentity) {
      conditions.objectIdentity = objectIdentity.getObjectId();
    }

    await EntryModel.remove(conditions).exec();
  }
}
