import SyncClient from '../../dist/syncClient.min.js';
import { checkExpect } from '../helpers.js';

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

  it('should reject the promise if the given id is undefined. No change object should be written', (done) => {
    collection.remove().then(() => {
      done.fail();
    }).catch((err) => {
      expect(err).not.toBe(undefined);
      expect(err).toEqual(jasmine.any(DOMException));
      expect(err.name).toBe('DataError');
      const openDBRequest = window.indexedDB.open(dbName, 1);
      openDBRequest.onsuccess = function (openDBEvent) {
        const openDB = openDBEvent.target.result;
        const transaction = openDB.transaction(['changesDBStore'], 'readonly');
        const objectStore = transaction.objectStore('changesDBStore');
        const cursorRequest = objectStore.openCursor();

        const results = [];

        cursorRequest.onsuccess = function (e) {
          const cursor = e.target.result;
          if (cursor && cursor !== null) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            openDB.close();
            expect(results.length).toBe(0);
            done();
          }
        };

        cursorRequest.onerror = function (e) {
          openDB.close();
          done.fail(e);
        };
      };
      openDBRequest.onerror = function (e) {
        done.fail(e);
      };
    });
  });

  it('should resolve the promise if no object with given id is in the database. A change object is saved nevertheless', (done) => {
    const id = 10;
    collection.remove(id).then(() => {
      function checkFn(collectionData, changeCollectionData) {
        expect(changeCollectionData.operation).toBe('DELETE');
      }

      checkExpect(done, checkFn, dbName, collectionName, id);
    }).catch((err) => {
      done.fail(err);
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
      title: 'testTitle',
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

        checkExpect(done, checkFn, dbName, collectionName, id);
      });
    }).catch((err) => {
      done.fail(err);
    });
  });
});
