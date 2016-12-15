import Collection from './collection.js';
import { upload } from './upload.js';
import { download } from './download.js';

export default class SyncClient {
  constructor(dbName, collectionNames, serverUrl) {
    this.collections = new Map();
    this.serverUrl = serverUrl;
    this.dbName = dbName;
    collectionNames.forEach((collectionName) => {
      this.collections.set(collectionName, new Collection(collectionName, dbName, collectionNames));
    });
    this.collectionNames = collectionNames;
  }

  getCollection(collectionName) {
    return this.collections.get(collectionName);
  }

  sync() {
    return download(this.dbName, this.collectionNames, this.serverUrl).then(() => {
      return upload(this.dbName, this.collectionNames, this.serverUrl);
    });
  }
}
