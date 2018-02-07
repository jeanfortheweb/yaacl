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

export class MongooseAdapter implements Adapter {
  private _entryModel: mongoose.Model<EntryDocument>;

  constructor(connection: mongoose.Connection, collection: string = '__YAACL__') {
    this._entryModel = connection.model<EntryDocument>(collection, EntrySchema);
  }

  public async store(
    securityIdentity: SecurityIdentity,
    objectIdentity: ObjectIdentity,
    privileges: Privileges,
  ): Promise<any> {
    let entry = await this._entryModel
      .findOne({
        securityIdentity: securityIdentity.getSecurityId(),
        objectIdentity: objectIdentity.getObjectId(),
      })
      .exec();

    if (!entry) {
      entry = new this._entryModel({
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
    const entry = await this._entryModel
      .findOne({
        securityIdentity: securityIdentity.getSecurityId(),
        objectIdentity: objectIdentity.getObjectId(),
      })
      .exec();

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

    await this._entryModel.remove(conditions).exec();
  }
}
