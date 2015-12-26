import {API_V1_DOWNLOAD, LAST_UPDATE_TS, UPDATE_OPERATION, DELETE_OPERATION} from './constants.js';

import * as IndexedDB from './indexeddb_connector.js';

import {post} from './ajax.js';

export function download(dbName, collectionNames, serverUrl) {
  return new Promise((resolve, reject) => {
    const lastUpdateTS = localStorage.getItem(LAST_UPDATE_TS);
    post(`${serverUrl}${API_V1_DOWNLOAD}`, {lastUpdateTS, collectionNames}).then((resp) => {
      if (resp.changes.length > 0) {
        return resp.changes;
      } else {
        resolve();
      }
    }).then((changes) => {
      const collectionsToChange = new Map();
      changes.forEach((change) => {
        if (collectionsToChange.has(change.collectionName)) {
          collectionsToChange.get(change.collectionName).push(change);
        } else {
          collectionsToChange.set(change.collectionName, [change]);
        }
      });
      return collectionsToChange;
    }).then((collectionsToChange) => {
      return IndexedDB.open(dbName, collectionNames).then((openDB) => {
        function onTransactionError(err) {
          openDB.close();
          reject(err);
        }

        function onTransactionComplete() {
          openDB.close();
          resolve();
        }

        function execOperation(changeObject, objectStore) {
          if (changeObject.operation === DELETE_OPERATION) {
            return IndexedDB.remove(objectStore, changeObject._id);
          } else if (changeObject.operation === UPDATE_OPERATION) {
            return IndexedDB.save(objectStore, changeObject.changeSet);
          } else {
            return Promise.reject('Operation does not exist');
          }
        }

        const transaction = IndexedDB.createReadWriteTransaction(openDB, Array.from(collectionsToChange.keys()), onTransactionComplete, onTransactionError);
        const promises = [];
        for (const [collectionName, changeObjects] of collectionsToChange) {
          const objectStore = transaction.objectStore(collectionName);
          for (const changeObject of changeObjects) {
            promises.push(execOperation(changeObject, objectStore));
          }
        }
        Promise.all(promises).catch((err) => {
          transaction.abort();
          onTransactionError(err);
        });
      });
    }).catch((err) => {
      reject(err);
    });
  });
}
