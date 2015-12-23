import {API_V1_DOWNLOAD, LAST_UPDATE_TS, UPDATE_OPERATION, DELETE_OPERATION} from './constants.js';

import * as IndexedDB from './indexeddb_connector.js';

import {post} from './ajax.js';

export default function download(dbName, collectionNames) {
  return new Promise((resolve, reject) => {
    const lastUpdateTS = localStorage.getItem(LAST_UPDATE_TS);
    post(API_V1_DOWNLOAD, {lastUpdateTS, collectionNames}).then((resp) => {
      const changes = new Map();
      resp.changes.forEach((change) => {
        if (changes.has(change.collectionName)) {
          changes.get(change.collectionName).push(change);
        } else {
          changes.set(change.collectionName, [change]);
        }
      });
      return changes;
    }).then((changes) => {
      IndexedDB.open(dbName, collectionNames).then((openDB) => {
        const requestErrors = [];

        function onTransactionError(e) {
          openDB.close();
          requestErrors.push(e);
          reject(requestErrors);
        }

        function onTransactionComplete() {
          openDB.close();
          resolve();
        }

        const transaction = IndexedDB.createReadWriteTransaction(openDB, Array.from(changes.keys()), onTransactionComplete, onTransactionError);
        const promises = [];
        for (let [collectionName, changeObjects] of changes) {
          const objectStore = transaction.objectStore(collectionName);
          changeObjects.forEach((changeObject) => {
            if (changeObject.operation === DELETE_OPERATION) {
              promises.push(IndexedDB.remove(objectStore, changeObject._id));
            } else if (changeObject.operation === UPDATE_OPERATION) {
              promises.push(IndexedDB.save(objectStore, changeObject.changeSet));
            } else {
              promises.push(Promise.reject('Operation does not exist'));
            }
          });
        }
        Promise.all(promises).catch((err) => {
          requestErrors.push(err);
        });
      });
    }).catch((err) => {
      reject(err);
    });
  });
}
