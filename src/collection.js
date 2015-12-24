import cuid from './cuid.js';

import {CHANGES_DB_STORE_NAME} from './constants.js';
import * as IndexedDB from './indexeddb_connector.js';
import {createUpdateChangeObject, createRemoveChangeObject} from './change_object_helpers.js';

export default class Collection {
  constructor(collectionName, dbName, dbCollectionNames) {
    const containsCollectionName = dbCollectionNames.indexOf(collectionName);
    const containsChangeCollectionName = dbCollectionNames.indexOf(CHANGES_DB_STORE_NAME);

    if (containsCollectionName === -1) {
      throw Error('Collection name is not in the collections list');
    } else if (containsChangeCollectionName === -1) {
      throw Error('Change collection is not in the collections list');
    } else {
      this.collectionName = collectionName;
      this.dbName = dbName;
      this.dbCollectionNames = dbCollectionNames;
    }
  }

  save(data) {
    return new Promise((resolve, reject) => {
      if (data === undefined) {
        reject(new TypeError('Data is undefined'));
      } else {
        IndexedDB.open(this.dbName, this.dbCollectionNames).then((openDB) => {
          function onTransactionError(e) {
            openDB.close();
            reject(e);
          }

          function onTransactionComplete() {
            openDB.close();
            resolve(data._id);
          }

          const transaction = IndexedDB.createReadWriteTransaction(openDB, [CHANGES_DB_STORE_NAME, this.collectionName], onTransactionComplete, onTransactionError);

          const changeObjectsStore = transaction.objectStore(CHANGES_DB_STORE_NAME);
          const objectStore = transaction.objectStore(this.collectionName);

          if (!data._id) {
            data._id = cuid();
          }
          const changeObject = createUpdateChangeObject(this.collectionName, data);

          IndexedDB.save(objectStore, data).then(() => {
            return IndexedDB.save(changeObjectsStore, changeObject);
          }).catch((e) => {
            reject(e);
          });
        }).catch(function(e) {
          reject(e);
        });
      }
    });
  }

  remove(id) {
    return new Promise((resolve, reject) => {
      IndexedDB.open(this.dbName, this.dbCollectionNames).then((openDB) => {
        function onTransactionError(e) {
          openDB.close();
          reject(e);
        }

        function onTransactionComplete() {
          openDB.close();
          resolve();
        }

        const transaction = IndexedDB.createReadWriteTransaction(openDB, [CHANGES_DB_STORE_NAME, this.collectionName], onTransactionComplete, onTransactionError);

        const changeObjectsStore = transaction.objectStore(CHANGES_DB_STORE_NAME);
        const objectStore = transaction.objectStore(this.collectionName);

        const changeObject = createRemoveChangeObject(this.collectionName, id);

        IndexedDB.remove(objectStore, id).then(() => {
          return IndexedDB.save(changeObjectsStore, changeObject);
        }).catch((e) => {
          reject(e);
        });
      }).catch((e) => {
        reject(e);
      });
    });
  }

  getAll() {
    return IndexedDB.open(this.dbName, this.dbCollectionNames).then((openDB) => {
      const transaction = IndexedDB.createReadTransaction(openDB, [this.collectionName]);
      const objectStore = transaction.objectStore(this.collectionName);
      return IndexedDB.getAll(objectStore).then((data) => {
        openDB.close();
        return data;
      }).catch((err) => {
        openDB.close();
        return Promise.reject(err);
      });
    });
  }

  getOne(id) {
    return IndexedDB.open(this.dbName, this.dbCollectionNames).then((openDB) => {
      const transaction = IndexedDB.createReadTransaction(openDB, [this.collectionName]);
      const objectStore = transaction.objectStore(this.collectionName);
      return IndexedDB.getOne(objectStore, id).then((data) => {
        openDB.close();
        return data;
      }).catch((err) => {
        openDB.close();
        return Promise.reject(err);
      });
    });
  }
}
