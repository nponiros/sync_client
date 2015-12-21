import Collection from './collection.js';
import {CHANGES_DB_STORE_NAME} from './constants.js';
import uploadFn from './upload.js';
import downloadFn from './download.js';

export default class SyncClient {
  constructor(dbName, collectionNames) {
    this.collections = new Map();
    this.dbName = dbName;
    collectionNames.forEach((collectionName) => {
      this.collections.set(collectionName, new Collection(collectionName, dbName, collectionNames));
    });
    collectionNames.push(CHANGES_DB_STORE_NAME);
    this.collectionNames = collectionNames;
  }

  getCollection(collectionName) {
    return this.collections.get(collectionName);
  }

  sync() {
    return new Promise((resolve, reject) => {
      return downloadFn(this.dbName, this.collectionNames).then(() => {
        return uploadFn(this.dbName, this.collectionNames);
      }).then(() => {
        resolve();
      }).catch(() => {
        reject();
      });
    });
  }

  isOnline() {
  }
}
