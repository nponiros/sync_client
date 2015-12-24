import Collection from './collection.js';
import {CHANGES_DB_STORE_NAME} from './constants.js';
import uploadFn from './upload.js';
import downloadFn from './download.js';

export default class SyncClient {
  constructor(dbName, collectionNames, serverUrl) {
    this.collections = new Map();
    this.serverUrl = serverUrl;
    this.dbName = dbName;
    collectionNames.push(CHANGES_DB_STORE_NAME);
    collectionNames.forEach((collectionName) => {
      if (collectionName !== CHANGES_DB_STORE_NAME) {
        this.collections.set(collectionName, new Collection(collectionName, dbName, collectionNames));
      }
    });
    this.collectionNames = collectionNames;
  }

  getCollection(collectionName) {
    return this.collections.get(collectionName);
  }

  sync() {
    return new Promise((resolve, reject) => {
      return downloadFn(this.dbName, this.collectionNames, this.serverUrl).then(() => {
        return uploadFn(this.dbName, this.collectionNames, this.serverUrl);
      }).then(() => {
        resolve();
      }).catch(() => {
        reject();
      });
    });
  }
}
