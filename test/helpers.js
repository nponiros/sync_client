export function checkExpect(done, checkFn, dbName, collectionName, id) {
  const openDBRequest = window.indexedDB.open(dbName, 1);
  openDBRequest.onsuccess = function (openDBEvent) {
    let collectionData;
    let changeCollectionData;
    const openDB = openDBEvent.target.result;
    const transaction = openDB.transaction([collectionName, 'changesDBStore'], 'readonly');
    const collectionObjectStore = transaction.objectStore(collectionName);
    const changeCollectionObjectStore = transaction.objectStore('changesDBStore');

    const getRequest = collectionObjectStore.get(id);
    getRequest.onsuccess = function (e) {
      collectionData = e.target.result;
    };
    getRequest.onerror = function (err) {
      openDB.close();
      done.fail(err);
    };

    const changeRequest = changeCollectionObjectStore.get(id);
    changeRequest.onsuccess = function (e) {
      changeCollectionData = e.target.result;
    };
    changeRequest.onerror = function (err) {
      openDB.close();
      done.fail(err);
    };

    transaction.oncomplete = function () {
      openDB.close();
      checkFn(collectionData, changeCollectionData);
      done();
    };

    transaction.onerror = function (err) {
      openDB.close();
      done.fail(err);
    };
  };

  openDBRequest.onerror = function (err) {
    done.fail(err);
  };
}
