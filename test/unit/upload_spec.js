import upload from '../../src/upload.js';
import * as db from '../../src/indexeddb_connector.js';
import * as ajax from '../../src/ajax.js';

describe('upload', () => {
  const collectionName = 'testCollection';
  const dbName = 'testDB';
  const collectionNames = [collectionName, CHANGES_DB_STORE_NAME];
  function getResolvePromise(toResolveWith) {
    return new Promise((resolve) => {
      resolve(toResolveWith);
    });
  }
  function getRejectPromise(toRejectWith) {
    return new Promise((resolve, reject) => {
      reject(toRejectWith);
    });
  }
  function fakeSuccess(openDB, stores, onComplete) {
    setTimeout(onComplete, 0);
    return {
      objectStore(name) {
        return {name};
      }
    };
  }
  function fakeError(openDB, stores, onComplete, onError) {
    setTimeout(onError, 0);
    return {
      objectStore(name) {
        return {name};
      }
    };
  }

  let openDB;
  let objectStore;
  beforeEach(() => {
    objectStore = {};
    openDB = {
      transaction() {
        return {
          objectStore() {
            return objectStore;
          }
        };
      },
      close() {
      }
    };
    spyOn(openDB, 'close');
    spyOn(db, 'open').and.returnValue(getResolvePromise(openDB));
    spyOn(db, 'createReadTransaction').and.callThrough();
    spyOn(ajax, 'post');
  });

  /*it('should call getAll, close the db, send a server request with the data and update the stores with the data from the server', (done) => {
    const data = [{
      _id: 1
    }];
    spyOn(db, 'getAll').and.returnValue(getResolvePromise(data));
    upload(dbName, collectionNames).then(() => {
      expect(db.open).toHaveBeenCalledWith(dbName, collectionNames);
      expect(db.createReadTransaction).toHaveBeenCalledWith(openDB, [collectionName]);
      expect(db.getAll).toHaveBeenCalledWith(objectStore);
      expect(openDB.close).toHaveBeenCalled();
      done();
    }).catch((err) => {
      done.fail(err);
    });
  });*/
});
