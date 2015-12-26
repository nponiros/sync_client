import * as db from '../../src/indexeddb_connector.js';
import {IDBTransactionModes, CHANGES_DB_STORE_NAME} from '../../src/constants.js';
import * as DBMock from '../indexeddb_mock.js';

describe('IndexedDB Connector', () => {
  describe('open', () => {
    it('should open and return a database with the given name and object stores', (done) => {
      const name = 'testDB';
      const dbStoreNames = ['testStore'];
      db.open(name, dbStoreNames).then((openDB) => {
        expect(openDB.name).toBe(name);
        expect(openDB.version).toBe(1);
        expect(openDB.objectStoreNames[0]).toBe(CHANGES_DB_STORE_NAME);
        expect(openDB.objectStoreNames[1]).toBe(dbStoreNames[0]);
        openDB.close();
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });
  });

  describe('save', () => {
    it('should return the id of the saved object', (done) => {
      const data = {
        _id: 1
      };
      const dbMock = new DBMock.IDBDatabase('testDB', ['testStore']);
      const trans = dbMock.transaction(['testStore'], IDBTransactionModes.READ_WRITE);
      const objectStore = trans.objectStore('testStore');
      db.save(objectStore, data).then((id) => {
        expect(id).toBe(1);
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('should return an error object if the error callback gets called', (done) => {
      const data = {
        _id: 1
      };
      const dbMock = new DBMock.IDBDatabase('testDB', ['testStore']);
      dbMock.setFlags({
        request: {
          onError: true
        }
      });
      const trans = dbMock.transaction(['testStore'], IDBTransactionModes.READ_WRITE);
      const objectStore = trans.objectStore('testStore');
      db.save(objectStore, data).then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });

    it('should reject the promise if an exception is thrown and abort the transaction', (done) => {
      const data = {
        _id: 1
      };
      const dbMock = new DBMock.IDBDatabase('testDB', ['testStore']);
      const trans = dbMock.transaction(['testStore'], IDBTransactionModes.READ_WRITE);
      const objectStore = trans.objectStore('testStore');
      trans._flags.active = false;
      spyOn(trans, 'abort');
      db.save(objectStore, data).then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        expect(trans.abort).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('remove', () => {
    it('should not return anything', (done) => {
      const id = 1;
      const dbMock = new DBMock.IDBDatabase('testDB', ['testStore']);
      const trans = dbMock.transaction(['testStore'], IDBTransactionModes.READ_WRITE);
      const objectStore = trans.objectStore('testStore');
      db.remove(objectStore, id).then((returnId) => {
        expect(returnId).toBe(undefined);
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('should return an error object if the error callback gets called', (done) => {
      const id = 1;
      const dbMock = new DBMock.IDBDatabase('testDB', ['testStore']);
      dbMock.setFlags({
        request: {
          onError: true
        }
      });
      const trans = dbMock.transaction(['testStore'], IDBTransactionModes.READ_ONLY);
      const objectStore = trans.objectStore('testStore');
      db.remove(objectStore, id).then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });

    it('should reject the promise if an exception is thrown and abort the transaction', (done) => {
      const id = 1;
      const dbMock = new DBMock.IDBDatabase('testDB', ['testStore']);
      const trans = dbMock.transaction(['testStore'], IDBTransactionModes.READ_WRITE);
      const objectStore = trans.objectStore('testStore');
      trans._flags.active = false;
      spyOn(trans, 'abort');
      db.remove(objectStore, id).then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        expect(trans.abort).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('getOne', () => {
    it('should return an object matching the id', (done) => {
      const testData = {
        _id: 1
      };
      const dbMock = new DBMock.IDBDatabase('testDB', ['testStore']);
      dbMock.setData({
        testStore: {
          1: testData
        }
      });
      const trans = dbMock.transaction(['testStore'], IDBTransactionModes.READ_ONLY);
      const objectStore = trans.objectStore('testStore');
      db.getOne(objectStore, testData._id).then((data) => {
        expect(data).toEqual(testData);
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('should return an error object if the error callback gets called', (done) => {
      const id = 1;
      const dbMock = new DBMock.IDBDatabase('testDB', ['testStore']);
      dbMock.setData({
        testStore: {}
      });
      dbMock.setFlags({
        request: {
          onError: true
        }
      });
      const trans = dbMock.transaction(['testStore'], IDBTransactionModes.READ_ONLY);
      const objectStore = trans.objectStore('testStore');
      db.getOne(objectStore, id).then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });
  });

  describe('getAll', () => {
    it('should return an array of objects', (done) => {
      const testData = [{
        _id: 1
      }, {
        _id: 2
      }];
      const dbMock = new DBMock.IDBDatabase('testDB', ['testStore']);
      dbMock.setData({
        testStore: {
          1: testData[0],
          2: testData[1]
        }
      });
      const trans = dbMock.transaction(['testStore'], IDBTransactionModes.READ_ONLY);
      const objectStore = trans.objectStore('testStore');
      db.getAll(objectStore).then((data) => {
        expect(data).toEqual(testData);
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('should return an empty array if we have no data in the store', (done) => {
      const dbMock = new DBMock.IDBDatabase('testDB', ['testStore']);
      dbMock.setData({
        testStore: {}
      });
      const trans = dbMock.transaction(['testStore'], IDBTransactionModes.READ_ONLY);
      const objectStore = trans.objectStore('testStore');
      db.getAll(objectStore).then((data) => {
        expect(data).toEqual([]);
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('should return an error object if the error callback gets called', (done) => {
      const dbMock = new DBMock.IDBDatabase('testDB', ['testStore']);
      dbMock.setData({
        testStore: {}
      });
      dbMock.setFlags({
        request: {
          onError: true
        }
      });
      const trans = dbMock.transaction(['testStore'], IDBTransactionModes.READ_ONLY);
      const objectStore = trans.objectStore('testStore');
      db.getAll(objectStore).then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });
  });

  describe('createReadTransaction', () => {
    it('should create and return a transaction for the given stores and read mode', () => {
      const openDB = {
        transaction() {
          return {};
        }
      };
      spyOn(openDB, 'transaction').and.callThrough();
      const dbStoreNames = ['testCollection'];
      const transaction = db.createReadTransaction(openDB, dbStoreNames);
      expect(transaction).not.toBe(undefined);
      expect(openDB.transaction).toHaveBeenCalledWith(dbStoreNames, IDBTransactionModes.READ_ONLY);
    });
  });

  describe('createReadWriteTransaction', () => {
    let openDB;
    const dbStoreNames = ['testCollection'];
    beforeEach(() => {
      openDB = {
        transaction() {
          return {};
        }
      };
      spyOn(openDB, 'transaction').and.callThrough();
    });

    it('should create and return a transaction for the given stores and read write mode', () => {
      const transaction = db.createReadWriteTransaction(openDB, dbStoreNames);
      expect(transaction).not.toBe(undefined);
      expect(openDB.transaction).toHaveBeenCalledWith(dbStoreNames, IDBTransactionModes.READ_WRITE);
    });

    it('should add callback functions for oncomplete and onerror events', () => {
      const transaction = db.createReadWriteTransaction(openDB, dbStoreNames);
      expect(transaction.oncomplete).not.toBe(undefined);
      expect(transaction.onerror).not.toBe(undefined);
    });
  });
});
