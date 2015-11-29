import {CHANGES_DB_STORE_NAME, API_V1_UPLOAD, LAST_UPDATE_TS} from './constants.js';
import * as IndexedDB from './indexeddb_connector.js';

import {post} from './ajax.js';

export default function upload(dbName, collectionNames) {
// Server always has the change of the last client which synced -> changes could be overwritten
  return new Promise((resolve, reject) => {
    IndexedDB.open(dbName, collectionNames).then((openDB) => {
      const transaction = IndexedDB.createReadTransaction(openDB, [CHANGES_DB_STORE_NAME]);
      const objectStore = transaction.objectStore(CHANGES_DB_STORE_NAME);
      return IndexedDB.getAll(objectStore);
    }).then((changeObjects) => {
      return post(API_V1_UPLOAD, {changes: changeObjects});
    }).then((resp) => {
      const requestErrors = [];

      function onTransactionError(e) {
        requestErrors.push(e);
        reject(requestErrors);
      }

      function onTransactionComplete() {
        console.log('bla');
        resolve();
      }

      // TODO: reopen DB
      const transaction = IndexedDB.createReadWriteTransaction(openDB, [CHANGES_DB_STORE_NAME], onTransactionComplete, onTransactionError);
      const objectStore = transaction.objectStore(CHANGES_DB_STORE_NAME);
      const {changeIds, lastUpdateTS} = resp;

      const promises = changeIds.map((id) => {
        return IndexedDB.remove(objectStore, id);
      });

      Promise.all(promises).then(() => {
        localStorage.setItem(LAST_UPDATE_TS, lastUpdateTS);
      }).catch((e) => {
        requestErrors.push(e);
      });
    }).catch((err) => {
      console.log(err);
      reject(err);
    });
  });
}
