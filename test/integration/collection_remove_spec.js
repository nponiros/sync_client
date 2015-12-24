import SyncClient from '../../dist/syncClient.min.js';

describe('Collection remove', () => {
  let syncClient;
  let collection;
  const dbName = 'testRemoveDB';
  const serverUrl = 'http://127.0.0.1:3000';
  const collectionName = 'testCollection';
  const collectionNames = [collectionName];
  beforeEach(() => {
    syncClient = new SyncClient(dbName, collectionNames, serverUrl);
    collection = syncClient.getCollection(collectionName);
  });

  function checkExpect(done, checkFn, id) {
    const openDBRequest = window.indexedDB.open(dbName, 1);
    openDBRequest.onsuccess = function(openDBEvent) {
      let collectionData;
      let changeCollectionData;
      const openDB = openDBEvent.target.result;
      const transaction = openDB.transaction([collectionName, 'changesDBStore'], 'readonly');
      const collectionObjectStore = transaction.objectStore(collectionName);
      const changeCollectionObjectStore = transaction.objectStore('changesDBStore');

      const getRequest = collectionObjectStore.get(id);
      getRequest.onsuccess = function(e) {
        collectionData = e.target.result;
      };
      getRequest.onerror = function(err) {
        done.fail(err);
      };

      const changeRequest = changeCollectionObjectStore.get(id);
      changeRequest.onsuccess = function(e) {
        changeCollectionData = e.target.result;
      };
      changeRequest.onerror = function(err) {
        done.fail(err);
      };

      transaction.oncomplete = function() {
        checkFn(collectionData, changeCollectionData);
        done();
      };

      transaction.onerror = function(err) {
        done.fail(err);
      };
    };

    openDBRequest.onerror = function(err) {
      done.fail(err);
    };
  }

  it('should resolve the promise if no object with given id is in the database', (done) => {
    const id = 10;
    collection.remove(id).then(() => {
      done();
    }).catch((err) => {
      done.fail(err);
    });
  });

  it('should reject the promise if the given id is undefined', (done) => {
    collection.remove().then(() => {
      done.fail();
    }).catch((err) => {
      expect(err).not.toBe(undefined);
      expect(err).toEqual(jasmine.any(DOMException));
      expect(err.name).toBe('DataError');
      done();
    });
  });

  it('should reject the promise if the given id is not a valid key', (done) => {
    const id = {};
    collection.remove(id).then(() => {
      done.fail();
    }).catch((err) => {
      expect(err).not.toBe(undefined);
      expect(err).toEqual(jasmine.any(DOMException));
      expect(err.name).toBe('DataError');
      done();
    });
  });

  it('should reject the promise if the given id is null', (done) => {
    collection.remove(null).then(() => {
      done.fail();
    }).catch((err) => {
      expect(err).not.toBe(undefined);
      expect(err).toEqual(jasmine.any(DOMException));
      expect(err.name).toBe('DataError');
      done();
    });
  });

  it('should remove the data object matching the key from the collection and add a change object to the changes store', (done) => {
    const data = {
      _id: 1,
      title: 'testTitle'
    };
    collection.save(data).then((id) => {
      return collection.remove(id).then(() => {
        function checkFn(collectionData, changeCollectionData) {
          expect(collectionData).toBe(undefined);
          expect(changeCollectionData._id).toBe(id);
          expect(changeCollectionData.collectionName).toBe(collectionName);
          expect(changeCollectionData.operation).toBe('DELETE');
          expect(changeCollectionData.changeSet).toBe(undefined);
        }

        checkExpect(done, checkFn, id);
      });
    }).catch((err) => {
      done.fail(err);
    });
  });
});
