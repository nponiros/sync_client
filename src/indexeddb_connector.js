import {IDBTransactionModes} from './constants.js';

const version = 1;

// TODO: close function
export function open(dbName, dbStoreNames) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onupgradeneeded = function(e) {
      const db = e.target.result;
      const options = {
        keyPath: '_id',
        autoIncrement: false
      };

      // Create stores
      const existingStores = Array.prototype.slice.call(db.objectStoreNames);
      dbStoreNames.forEach((dbstoreName) => {
        const storeExists = existingStores.indexOf(dbstoreName) !== -1;
        if (!storeExists) {
          db.createObjectStore(dbstoreName, options);
        }
      });
    };

    request.onsuccess = function(e) {
      const db = e.target.result;
      resolve(db);
    };

    // Insert error
    request.onerror = function(e) {
      reject(e);
    };
  });
}

function createTransaction(db, dbStoreNames, mode) {
  const transaction = db.transaction(dbStoreNames, mode);
  return transaction;
}

export function createReadTransaction(db, dbStoreNames) {
  return createTransaction(db, dbStoreNames, IDBTransactionModes.READ_ONLY);
}

export function createReadWriteTransaction(db, dbStoreNames, onComplete, onError) {
  const transaction = createTransaction(db, dbStoreNames, IDBTransactionModes.READ_WRITE);
  transaction.oncomplete = function() {
    onComplete();
  };

  transaction.onerror = function(e) {
    onError(e);
  };

  return transaction;
}

export function getAll(objectStore) {
  return new Promise((resolve, reject) => {
    const data = [];
    const cursor = objectStore.openCursor();

    cursor.onsuccess = function(e) {
      const result = e.target.result;

      if (result && result !== null) {
        data.push(result.value);
        result.continue();
      } else {
        resolve(data);
      }
    };

    cursor.onerror = function(e) {
      reject(e);
    };
  });
}

export function getOne(objectStore, id) {
  return new Promise((resolve, reject) => {
    const requestUpdate = objectStore.get(id);

    requestUpdate.onsuccess = function(e) {
      resolve(e.target.result);
    };

    requestUpdate.onerror = function(e) {
      reject(e);
    };
  });
}

export function remove(objectStore, id) {
  return new Promise((resolve, reject) => {
    const requestUpdate = objectStore.delete(id);

    requestUpdate.onsuccess = function() {
      resolve();
    };

    requestUpdate.onerror = function(e) {
      reject(e);
    };
  });
}

export function save(objectStore, data) {
  return new Promise((resolve, reject) => {
    const requestUpdate = objectStore.put(data);

    requestUpdate.onsuccess = function() {
      resolve(data._id);
    };

    requestUpdate.onerror = function(e) {
      reject(e);
    };
  });
}
