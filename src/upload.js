import {CHANGES_DB_STORE_NAME, API_V1_UPLOAD, LAST_UPDATE_TS} from './constants.js';
import * as IndexedDB from './indexeddb_connector.js';

import {post} from './ajax.js';

export function upload(dbName, collectionNames, serverUrl) {
// Server always has the change of the last client which synced -> changes could be overwritten
  return new Promise((resolve, reject) => {
    IndexedDB.open(dbName, collectionNames).then((openDB) => {
      const transaction = IndexedDB.createReadTransaction(openDB, [CHANGES_DB_STORE_NAME]);
      const objectStore = transaction.objectStore(CHANGES_DB_STORE_NAME);
      return IndexedDB.getAll(objectStore).then((data) => {
        openDB.close();
        return data;
      }).catch((err) => {
        openDB.close();
        reject(err);
      });
    }).then((changeObjects) => {
      if (changeObjects.length === 0) {
        resolve();
      } else {
        return post(`${serverUrl}${API_V1_UPLOAD}`, {changes: changeObjects});
      }
    }).then((resp) => {
      IndexedDB.open(dbName, collectionNames).then((openDB) => {
        function onTransactionError(err) {
          openDB.close();
          reject(err);
        }

        function onTransactionComplete() {
          openDB.close();
          resolve();
        }

        const transaction = IndexedDB.createReadWriteTransaction(openDB, [CHANGES_DB_STORE_NAME], onTransactionComplete, onTransactionError);
        const objectStore = transaction.objectStore(CHANGES_DB_STORE_NAME);
        const {changeIds, lastUpdateTS} = resp;

        const promises = changeIds.map((id) => {
          return IndexedDB.remove(objectStore, id);
        });

        Promise.all(promises).then(() => {
          localStorage.setItem(LAST_UPDATE_TS, lastUpdateTS);
        }).catch((err) => {
          onTransactionError(err);
        });
      });
    }).catch((err) => {
      reject(err);
    });
  });
}
