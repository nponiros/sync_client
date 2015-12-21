import * as db from '../../src/indexeddb_connector.js';
import * as Mocks from '../object_store_mock.js';
import {IDBTransactionModes} from '../../src/constants.js';

describe('IndexedDB Connector', () => {
  describe('open', () => {
    it('should open and return a database with the given name and object stores', (done) => {
      const name = 'testDB';
      const dbStoreNames = ['testStore'];
      db.open(name, dbStoreNames).then((openDB) => {
        expect(openDB.name).toBe(name);
        expect(openDB.version).toBe(1);
        expect(openDB.objectStoreNames[0]).toBe(dbStoreNames[0]);
        openDB.close();
        done();
      }).catch((err) => {
        done(err);
      });
    });
  });

  describe('save', () => {
    it('should return the id of the saved object', (done) => {
      const data = {
        _id: 1
      };
      const objectStore = new Mocks.ObjectStore();
      db.save(objectStore, data).then((id) => {
        expect(id).toBe(1);
        done();
      });
    });

    it('should return an error object if the error callback gets called', (done) => {
      const data = {
        _id: 1
      };
      const objectStore = new Mocks.ErrorObjectStore();
      db.save(objectStore, data).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });
  });

  describe('remove', () => {
    it('should not return anything', (done) => {
      const id = 1;
      const objectStore = new Mocks.ObjectStore();
      db.remove(objectStore, id).then((returnId) => {
        expect(returnId).toBe(undefined);
        done();
      });
    });

    it('should return an error object if the error callback gets called', (done) => {
      const id = 1;
      const objectStore = new Mocks.ErrorObjectStore();
      db.remove(objectStore, id).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });
  });

  describe('getOne', () => {
    it('should return an object matching the id', (done) => {
      const testData = {
        _id: 1
      };
      const objectStore = new Mocks.ObjectStore(testData);
      db.getOne(objectStore, testData._id).then((data) => {
        expect(data).toEqual(testData);
        done();
      });
    });

    it('should return an error object if the error callback gets called', (done) => {
      const id = 1;
      const objectStore = new Mocks.ErrorObjectStore();
      db.getOne(objectStore, id).catch((err) => {
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
      const objectStore = new Mocks.ObjectStore(testData);
      db.getAll(objectStore).then((data) => {
        expect(data).toEqual(testData);
        done();
      });
    });

    it('should return an error object if the error callback gets called', (done) => {
      const id = 1;
      const objectStore = new Mocks.ErrorObjectStore();
      db.getAll(objectStore, id).catch((err) => {
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
