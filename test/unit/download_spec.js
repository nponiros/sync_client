import download from '../../src/download.js';
import {CHANGES_DB_STORE_NAME, API_V1_DOWNLOAD, LAST_UPDATE_TS, UPDATE_OPERATION, DELETE_OPERATION} from '../../src/constants.js';
import * as db from '../../src/indexeddb_connector.js';
import * as ajax from '../../src/ajax.js';
import * as DBMock from '../indexeddb_mock.js';

describe('download', () => {
  function getResolvePromise(toResolveWith) {
    return new Promise((resolve) => {
      resolve(toResolveWith);
    });
  }

  const collectionName = 'testCollection';
  const dbName = 'testDB';
  const collectionNames = [collectionName, CHANGES_DB_STORE_NAME];
  const serverUrl = '';
  const lastUpdateTS = '1';

  let openDB;

  beforeEach(() => {
    openDB = new DBMock.IDBDatabase(dbName, collectionNames);
    spyOn(openDB, 'close');
    spyOn(db, 'open').and.returnValue(getResolvePromise(openDB));
    spyOn(db, 'save').and.callThrough();
    spyOn(db, 'createReadTransaction').and.callThrough();
    spyOn(db, 'createReadWriteTransaction').and.callThrough();
    spyOn(db, 'remove').and.callThrough();
    localStorage.setItem(LAST_UPDATE_TS, lastUpdateTS);
  });


  it('should remove/save data into the store defined by the change object', (done) => {
    const changeObjects = [{
      _id: 1,
      operation: DELETE_OPERATION,
      collectionName
    }, {
      _id: 2,
      operation: UPDATE_OPERATION,
      collectionName,
      changeSet: {
        _id: 2
      }
    }];
    spyOn(ajax, 'post').and.returnValue(getResolvePromise({changes: changeObjects}));
    download(dbName, collectionNames, serverUrl).then(() => {
      expect(db.open).toHaveBeenCalledWith(dbName, collectionNames);
      expect(db.createReadWriteTransaction.calls.first().args[0]).toEqual(openDB);
      expect(db.createReadWriteTransaction.calls.first().args[1]).toEqual([collectionName]);
      expect(typeof db.createReadWriteTransaction.calls.first().args[2]).toBe('function');
      expect(typeof db.createReadWriteTransaction.calls.first().args[3]).toBe('function');
      expect(db.remove).toHaveBeenCalledTimes(1);
      expect(db.save).toHaveBeenCalledTimes(1);
      expect(db.open).toHaveBeenCalledTimes(1);
      expect(ajax.post).toHaveBeenCalledWith(API_V1_DOWNLOAD, {lastUpdateTS, collectionNames: [collectionName, CHANGES_DB_STORE_NAME]});
      expect(openDB.close).toHaveBeenCalledTimes(1);
      done();
    }).catch((err) => {
      done.fail(err);
    });
  });
});
