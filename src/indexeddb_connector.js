import { IDBTransactionModes, CHANGES_DB_STORE_NAME } from './constants.js';

const version = 1;

export function open(dbName, dbStoreNames) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    const storeNames = [CHANGES_DB_STORE_NAME, ...dbStoreNames];

    request.onupgradeneeded = function (e) {
      const db = e.target.result;
      const options = {
        keyPath: '_id',
        autoIncrement: false,
      };

      // Create stores
      const existingStores = [...db.objectStoreNames];
      storeNames.forEach((dbstoreName) => {
        const storeExists = existingStores.indexOf(dbstoreName) !== -1;
        if (!storeExists) {
          db.createObjectStore(dbstoreName, options);
        }
      });
    };

    request.onsuccess = function (e) {
      const db = e.target.result;
      resolve(db);
    };

    request.onerror = function (e) {
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
  transaction.oncomplete = function () {
    onComplete();
  };

  transaction.onerror = function (e) {
    onError(e);
  };

  return transaction;
}

export function getAll(objectStore) {
  return new Promise((resolve, reject) => {
    const data = [];
    const cursor = objectStore.openCursor();

    cursor.onsuccess = function (e) {
      const result = e.target.result;

      if (result && result !== null) {
        data.push(result.value);
        result.continue();
      } else {
        resolve(data);
      }
    };

    cursor.onerror = function (e) {
      reject(e);
    };
  });
}

export function getOne(objectStore, id) {
  return new Promise((resolve, reject) => {
    const request = objectStore.get(id);

    request.onsuccess = function (e) {
      resolve(e.target.result);
    };

    request.onerror = function (e) {
      reject(e);
    };
  });
}

export function remove(objectStore, id) {
  return new Promise((resolve, reject) => {
    try {
      const request = objectStore.delete(id);

      request.onsuccess = function () {
        resolve();
      };

      request.onerror = function (e) {
        reject(e);
      };
    } catch (e) {
      objectStore.transaction.abort();
      reject(e);
    }
  });
}

export function save(objectStore, data) {
  return new Promise((resolve, reject) => {
    try {
      const request = objectStore.put(data);
      request.onsuccess = function () {
        resolve(data._id);
      };

      request.onerror = function (e) {
        reject(e);
      };
    } catch (e) {
      objectStore.transaction.abort();
      reject(e);
    }
  });
}
