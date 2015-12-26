import {upload} from '../../src/upload.js';
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

  function getRejectPromise(toRejectWith) {
    return new Promise((_, reject) => {
      reject(toRejectWith);
    });
  }

  const collectionName = 'testCollection';
  const dbName = 'testDB';
  const collectionNamesForOpenDB = [CHANGES_DB_STORE_NAME, collectionName];
  const collectionNames = [collectionName];
  const serverUrl = '';

  let openDB;
  let openSpy;
  let getAllSpy;
  let removeSpy;

  beforeEach(() => {
    openDB = new DBMock.IDBDatabase(dbName, collectionNamesForOpenDB);
    spyOn(openDB, 'close');
    openSpy = spyOn(db, 'open').and.returnValue(getResolvePromise(openDB));
    spyOn(db, 'save').and.callThrough();
    spyOn(db, 'createReadTransaction').and.callThrough();
    spyOn(db, 'createReadWriteTransaction').and.callThrough();
    getAllSpy = spyOn(db, 'getAll').and.callThrough();
    removeSpy = spyOn(db, 'remove').and.callThrough();
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
      expect(localStorage.getItem(LAST_UPDATE_TS)).toBe('1');
      done();
    }).catch((err) => {
      done.fail(err);
    });
  });

  it('should reject the promise if the database can not be opened', (done) => {
    openSpy.and.returnValue(getRejectPromise(Error()));
    upload(dbName, collectionNames, serverUrl).then(() => {
      done.fail();
    }).catch((err) => {
      expect(err).not.toBe(undefined);
      done();
    });
  });

  it('should reject the promise if posting the data failed', (done) => {
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
    spyOn(ajax, 'post').and.returnValue(getRejectPromise(Error()));
    upload(dbName, collectionNames, serverUrl).then(() => {
      done.fail();
    }).catch((err) => {
      expect(err).not.toBe(undefined);
      done();
    });
  });

  it('should not try to post data if no data to send are available', (done) => {
    openDB.setData({
      [CHANGES_DB_STORE_NAME]: {}
    });
    spyOn(ajax, 'post');
    upload(dbName, collectionNames, serverUrl).then(() => {
      expect(ajax.post).not.toHaveBeenCalled();
      done();
    }).catch((err) => {
      done.fail(err);
    });
  });

  it('should reject the promise if getting data from the database failed', (done) => {
    getAllSpy.and.returnValue(getRejectPromise(Error()));
    upload(dbName, collectionName, serverUrl).then(() => {
      done.fail();
    }).catch((err) => {
      expect(err).not.toBe(undefined);
      done();
    });
  });

  it('should reject the promise if removing data from the database failed. DB should also be closed', (done) => {
    removeSpy.and.returnValue(getRejectPromise(Error()));
    spyOn(ajax, 'post').and.returnValue({lastUpdateTS: 1, changeIds: [1, 2]});
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
    upload(dbName, collectionName, serverUrl).then(() => {
      done.fail();
    }).catch((err) => {
      expect(err).not.toBe(undefined);
      expect(openDB.close).toHaveBeenCalled();
      done();
    });
  });
});
