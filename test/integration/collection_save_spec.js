import SyncClient from '../../dist/syncClient.min.js';

describe('Collection save', () => {
  let syncClient;
  let collection;
  const dbName = 'testSaveDB';
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

  it('should add the given data to the database, to the changes object store and return the id', (done) => {
    const data = {
      _id: 1,
      title: 'testTitle'
    };
    collection.save(data).then((id) => {
      expect(id).toBe(data._id);

      function checkFn(collectionData, changeCollectionData) {
        expect(collectionData).toEqual(data);
        expect(changeCollectionData._id).toBe(id);
        expect(changeCollectionData.operation).toBe('UPDATE');
        expect(changeCollectionData.collectionName).toBe(collectionName);
        expect(changeCollectionData.changeSet).toEqual(data);
      }

      checkExpect(done, checkFn, id);
    }).catch((err) => {
      done.fail(err);
    });
  });

  it('should update the data if the given id already exists in the database', (done) => {
    const data = {
      _id: 1,
      title: 'testTitle'
    };
    collection.save(data).then((id) => {
      const newData = {
        _id: id,
        title: 'testTitle 2'
      };
      return collection.save(newData).then(() => {
        function checkFn(collectionData, changeCollectionData) {
          expect(collectionData).toEqual(newData);
          expect(changeCollectionData.changeSet).toEqual(newData);
        }

        checkExpect(done, checkFn, id);
      });
    }).catch((err) => {
      done.fail(err);
    });
  });

  it('should add the given data to the database, to the changes object store and return the id even if we do not give an id to the data', (done) => {
    const data = {
      title: 'testTitle'
    };
    collection.save(data).then((id) => {
      expect(id).not.toBe(undefined);

      function checkFn(collectionData, changeCollectionData) {
        expect(collectionData.title).toBe(data.title);
        expect(collectionData._id).toBe(id);
        expect(changeCollectionData._id).toBe(id);
        expect(changeCollectionData.operation).toBe('UPDATE');
        expect(changeCollectionData.collectionName).toBe(collectionName);
        expect(changeCollectionData.changeSet.title).toBe(data.title);
        expect(changeCollectionData.changeSet._id).toBe(id);
      }

      checkExpect(done, checkFn, id);
    }).catch((err) => {
      done.fail(err);
    });
  });

  // TypeError does not come from the database, it comes when we create the change object
  it('should reject the promise with a TypeError if the data is undefined', (done) => {
    collection.save().then(() => {
      done.fail();
    }).catch((err) => {
      expect(err).not.toBe(undefined);
      expect(err).toEqual(jasmine.any(TypeError));
      done();
    });
  });

  it('should reject the promise if the data can not be cloned', (done) => {
    const data = {
      _id: 10,
      noClone() {}
    };
    collection.save(data).then(() => {
      done.fail();
    }).catch((err) => {
      expect(err).not.toBe(undefined);
      expect(err).toEqual(jasmine.any(DOMException));
      expect(err.name).toBe('DataCloneError');
      done();
    });
  });

  it('should reject the promise if data has an invalid key as id', (done) => {
    const data = {
      _id: {},
      title: 'testTitle'
    };
    collection.save(data).then(() => {
      done.fail();
    }).catch((err) => {
      expect(err).not.toBe(undefined);
      expect(err).toEqual(jasmine.any(DOMException));
      expect(err.name).toBe('DataError');
      done();
    });
  });
});
