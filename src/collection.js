import cuid from './cuid.js';

import {CHANGES_DB_STORE_NAME} from './constants.js';
import * as IndexedDB from './indexeddb_connector.js';
import {createUpdateChangeObject, createRemoveChangeObject} from './change_object_helpers.js';

export default class Collection {
  constructor(collectionName, dbName, dbCollections) {
    this.collectionName = collectionName;
    this.dbName = dbName;
    this.dbCollections = dbCollections;
  }

  save(data) {
    return new Promise((resolve, reject) => {
      IndexedDB.open(this.dbName, this.dbCollections).then((openDB) => {
        const requestErrors = [];

        function onTransactionError(e) {
          requestErrors.push(e);
          reject(requestErrors);
        }

        function onTransactionComplete() {
          console.log('bla');
          resolve(data._id);
        }

        const transaction = IndexedDB.createReadWriteTransaction(openDB, [CHANGES_DB_STORE_NAME, this.collectionName], onTransactionComplete, onTransactionError);

        const changeObjectsStore = transaction.objectStore(CHANGES_DB_STORE_NAME);
        const objectStore = transaction.objectStore(this.collectionName);

        if (!data._id) {
          data._id = cuid();
        }
        const changeObject = createUpdateChangeObject(this.collectionName, data);

        const changeObjectPromise = IndexedDB.save(changeObjectsStore, changeObject);
        const savePromise = IndexedDB.save(objectStore, data);

        Promise.all([changeObjectPromise, savePromise]).catch((e) => {
          requestErrors.push(e);
        });
      }).catch(function(e) {
        reject(e);
      });
    });
  }

  remove(id) {
    return new Promise((resolve, reject) => {
      IndexedDB.open(this.dbName, this.dbCollections).then((openDB) => {
        const requestErrors = [];

        function onTransactionError(e) {
          requestErrors.push(e);
          reject(requestErrors);
        }

        function onTransactionComplete() {
          console.log('bla');
          resolve();
        }

        const transaction = IndexedDB.createReadWriteTransaction(openDB, [CHANGES_DB_STORE_NAME, this.collectionName], onTransactionComplete, onTransactionError);

        const changeObjectsStore = transaction.objectStore(CHANGES_DB_STORE_NAME);
        const objectStore = transaction.objectStore(this.collectionName);

        const changeObject = createRemoveChangeObject(this.collectionName, id);

        const changeObjectPromise = IndexedDB.save(changeObjectsStore, changeObject);
        const removePromise = IndexedDB.remove(objectStore, id);
        Promise.all([changeObjectPromise, removePromise]).catch((e) => {
          requestErrors.push(e);
        });
      });
    });
  }

  getAll() {
    return IndexedDB.open(this.dbName, this.dbCollections).then((openDB) => {
      const transaction = IndexedDB.createReadTransaction(openDB, [this.collectionName]);
      const objectStore = transaction.objectStore(this.collectionName);
      return IndexedDB.getAll(objectStore);
    });
  }

  getOne(id) {
    return IndexedDB.open(this.dbName, this.dbCollections).then((openDB) => {
      const transaction = IndexedDB.createReadTransaction(openDB, [this.collectionName]);
      const objectStore = transaction.objectStore(this.collectionName);
      return IndexedDB.getOne(objectStore, id);
    });
  }
}
