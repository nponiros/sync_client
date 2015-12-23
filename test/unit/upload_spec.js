import upload from '../../src/upload.js';
import {CHANGES_DB_STORE_NAME, API_V1_UPLOAD, LAST_UPDATE_TS} from '../../src/constants.js';
import * as db from '../../src/indexeddb_connector.js';
import * as ajax from '../../src/ajax.js';
import * as DBMock from '../indexeddb_mock.js';

describe('upload', () => {
  function getResolvePromise(toResolveWith) {
    return new Promise((resolve) => {
      resolve(toResolveWith);
    });
  }

  const collectionName = 'testCollection';
  const dbName = 'testDB';
  const collectionNames = [collectionName, CHANGES_DB_STORE_NAME];
  const serverUrl = '';

  let openDB;

  beforeEach(() => {
    openDB = new DBMock.IDBDatabase(dbName, collectionNames);
    spyOn(openDB, 'close');
    spyOn(db, 'open').and.returnValue(getResolvePromise(openDB));
    spyOn(db, 'save').and.callThrough();
    spyOn(db, 'createReadTransaction').and.callThrough();
    spyOn(db, 'createReadWriteTransaction').and.callThrough();
    spyOn(db, 'getAll').and.callThrough();
    spyOn(db, 'remove');
    spyOn(localStorage, 'setItem');
  });


  it('should open the db, call getAll, close the db, send a server request with the data and update the stores with the data from the server', (done) => {
    const data = [{
      _id: 1
    }, {
      _id: 2
    }];
    openDB.setData({
      [CHANGES_DB_STORE_NAME]: {
        1: data[0],
        2: data[1]
      }
    });
    spyOn(ajax, 'post').and.returnValue({lastUpdateTS: 1, changeIds: [1, 2]});
    upload(dbName, collectionNames, serverUrl).then(() => {
      expect(db.open).toHaveBeenCalledWith(dbName, collectionNames);
      expect(db.createReadTransaction).toHaveBeenCalledWith(openDB, [CHANGES_DB_STORE_NAME]);
      expect(db.createReadWriteTransaction.calls.first().args[0]).toEqual(openDB);
      expect(db.createReadWriteTransaction.calls.first().args[1]).toEqual([CHANGES_DB_STORE_NAME]);
      expect(typeof db.createReadWriteTransaction.calls.first().args[2]).toBe('function');
      expect(typeof db.createReadWriteTransaction.calls.first().args[3]).toBe('function');
      expect(db.remove).toHaveBeenCalledTimes(2);
      expect(db.open).toHaveBeenCalledTimes(2);
      expect(ajax.post).toHaveBeenCalledWith(API_V1_UPLOAD, {changes: data});
      expect(openDB.close).toHaveBeenCalledTimes(2);
      done();
    }).catch((err) => {
      done.fail(err);
    });
  });

  it('should add the lastUpdateTS into localStorage', (done) => {
    const data = [{
      _id: 1
    }, {
      _id: 2
    }];
    openDB.setData({
      [CHANGES_DB_STORE_NAME]: {
        1: data[0],
        2: data[1]
      }
    });
    const lastUpdateTS = 1;
    spyOn(ajax, 'post').and.returnValue({lastUpdateTS, changeIds: [1, 2]});
    upload(dbName, collectionNames, serverUrl).then(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(LAST_UPDATE_TS, 1);
      done();
    }).catch((err) => {
      done.fail(err);
    });
  });
});
