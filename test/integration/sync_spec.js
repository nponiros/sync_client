import SyncClient from '../../dist/syncClient.min.js';

describe('sync', () => {
  let syncClient;
  let collection;
  const dbName = 'testSyncDB';
  const serverUrl = 'http://127.0.0.1:3000';
  const collectionName = 'testCollection';
  const collectionNames = [collectionName];
  beforeEach(() => {
    syncClient = new SyncClient(dbName, collectionNames, serverUrl);
    collection = syncClient.getCollection(collectionName);
  });

  function checkExpect(done, checkFn) {
    const openDBRequest = window.indexedDB.open(dbName, 1);
    openDBRequest.onsuccess = function(openDBEvent) {
      const openDB = openDBEvent.target.result;
      const transaction = openDB.transaction([collectionName, 'changesDBStore'], 'readonly');
      const collectionObjectStore = transaction.objectStore(collectionName);
      const changeCollectionObjectStore = transaction.objectStore('changesDBStore');

      const collectionData = [];
      const collectionRequest = collectionObjectStore.openCursor();
      collectionRequest.onsuccess = function(e) {
        const cursor = e.target.result;
        if (cursor && cursor !== null) {
          collectionData.push(cursor.value);
          cursor.continue();
        }
      };
      collectionRequest.onerror = function() {
        openDB.close();
        done.fail(collectionRequest.error);
      };

      const changeCollectionData = [];
      const changesRequest = changeCollectionObjectStore.openCursor();
      changesRequest.onsuccess = function(e) {
        const cursor = e.target.result;
        if (cursor && cursor !== null) {
          changeCollectionData.push(cursor.value);
          cursor.continue();
        }
      };
      changesRequest.onerror = function() {
        openDB.close();
        done.fail(changesRequest.error);
      };

      transaction.oncomplete = function() {
        openDB.close();
        checkFn(collectionData, changeCollectionData);
        done();
      };

      transaction.onerror = function(err) {
        openDB.close();
        done.fail(err);
      };
    };

    openDBRequest.onerror = function() {
      done.fail(openDBRequest.error);
    };
  }

  it('should get data from the server, set them in the db and upload data and remove them from the changes collection', (done) => {
    const dataToSave = {
      _id: 2,
      title: 'Test title 3'
    };
    const serverData = {
      _id: 1,
      title: 'title'
    };
    collection.save(dataToSave).then(() => {
      syncClient.sync().then(() => {
        function checkFn(collectionData, changeCollectionData) {
          expect(changeCollectionData.length).toBe(0);
          expect(collectionData).toEqual([serverData, dataToSave]);
        }

        checkExpect(done, checkFn);
      }).catch((err) => {
        done.fail(err);
      });
    });
  });
});
