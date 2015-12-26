import Collection from '../../src/collection.js';
import {CHANGES_DB_STORE_NAME, DELETE_OPERATION, UPDATE_OPERATION} from '../../src/constants.js';
import * as db from '../../src/indexeddb_connector.js';
import * as DBMock from '../indexeddb_mock.js';

describe('Collection', () => {
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
  const collectionNames = [collectionName];
  const collectionNamesForOpenDB = [CHANGES_DB_STORE_NAME, collectionName];

  describe('save', () => {
    let collection;
    let openDB;
    let openSpy;
    let saveSpy;

    beforeEach(() => {
      openDB = new DBMock.IDBDatabase(dbName, collectionNamesForOpenDB);
      spyOn(openDB, 'close');
      openSpy = spyOn(db, 'open').and.returnValue(getResolvePromise(openDB));
      collection = new Collection(collectionName, dbName, collectionNames);
      saveSpy = spyOn(db, 'save').and.callThrough();
      spyOn(db, 'createReadWriteTransaction').and.callThrough();
    });

    it('should open the database, create a read/write transaction, call save for the change collection, call save for this collection and close the db', (done) => {
      const data = {
        _id: 1
      };
      collection.save(data).then((result) => {
        expect(db.open).toHaveBeenCalledWith(dbName, collectionNames);
        expect(db.createReadWriteTransaction.calls.first().args[0]).toEqual(openDB);
        expect(db.createReadWriteTransaction.calls.first().args[1]).toEqual([CHANGES_DB_STORE_NAME, collectionName]);
        expect(typeof db.createReadWriteTransaction.calls.first().args[2]).toBe('function');
        expect(typeof db.createReadWriteTransaction.calls.first().args[3]).toBe('function');
        expect(db.save.calls.argsFor(0)[0].name).toEqual(collectionName);
        expect(db.save.calls.argsFor(0)[1]).toEqual(data);
        expect(db.save.calls.argsFor(1)[0].name).toEqual(CHANGES_DB_STORE_NAME);
        expect(db.save.calls.argsFor(1)[1].operation).toBe(UPDATE_OPERATION);
        expect(openDB.close).toHaveBeenCalled();
        expect(result).toBe(data._id);
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('should add an _id to the given data if the _id is not defined', (done) => {
      const data = {
        data: 'testData'
      };

      collection.save(data).then((result) => {
        expect(result).not.toBe(undefined);
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('should reject with a TypeError if the data is undefiend', (done) => {
      collection.save().then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).toEqual(jasmine.any(TypeError));
        done();
      });
    });

    it('should reject with an error if the database can not be opened', (done) => {
      openSpy.and.returnValue(getRejectPromise(Error()));
      collection.save({}).then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });

    it('should reject with an error if the data cannot be saved', (done) => {
      saveSpy.and.returnValue(getRejectPromise(Error()));
      collection.save({}).then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });
  });

  describe('remove', () => {
    let collection;
    let openDB;
    let openSpy;
    let saveSpy;
    let removeSpy;

    beforeEach(() => {
      openDB = new DBMock.IDBDatabase(dbName, collectionNamesForOpenDB);
      spyOn(openDB, 'close');
      openSpy = spyOn(db, 'open').and.returnValue(getResolvePromise(openDB));
      collection = new Collection(collectionName, dbName, collectionNames);
      saveSpy = spyOn(db, 'save').and.callThrough();
      removeSpy = spyOn(db, 'remove').and.callThrough();
      spyOn(db, 'createReadWriteTransaction').and.callThrough();
    });

    it('should open the database, create a read/write transaction, call save for the change collection, remove for this collection and close the db', (done) => {
      const id = 1;
      collection.remove(id).then(() => {
        expect(db.open).toHaveBeenCalledWith(dbName, collectionNames);
        expect(db.createReadWriteTransaction.calls.first().args[0]).toEqual(openDB);
        expect(db.createReadWriteTransaction.calls.first().args[1]).toEqual([CHANGES_DB_STORE_NAME, collectionName]);
        expect(typeof db.createReadWriteTransaction.calls.first().args[2]).toBe('function');
        expect(typeof db.createReadWriteTransaction.calls.first().args[3]).toBe('function');
        expect(db.save.calls.first().args[0].name).toEqual(CHANGES_DB_STORE_NAME);
        expect(db.save.calls.first().args[1].operation).toBe(DELETE_OPERATION);
        expect(db.remove.calls.first().args[0].name).toEqual(collectionName);
        expect(db.remove.calls.first().args[1]).toEqual(id);
        expect(openDB.close).toHaveBeenCalled();
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('should reject with an error if the database can not be opened', (done) => {
      openSpy.and.returnValue(getRejectPromise(Error()));
      collection.remove(1).then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });

    it('should reject with an error if the data cannot be saved', (done) => {
      saveSpy.and.returnValue(getRejectPromise(Error()));
      collection.remove(1).then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });

    it('should reject with an error if the data cannot be removed', (done) => {
      removeSpy.and.returnValue(getRejectPromise(Error()));
      collection.remove(1).then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });
  });

  describe('getAll', () => {
    let collection;
    let openDB;

    beforeEach(() => {
      openDB = new DBMock.IDBDatabase(dbName, collectionNames);
      spyOn(openDB, 'close');
      spyOn(db, 'open').and.returnValue(getResolvePromise(openDB));
      collection = new Collection(collectionName, dbName, collectionNames);
      spyOn(db, 'createReadTransaction').and.callThrough();
    });

    it('should open the database, create a read transaction, close the db and return data', (done) => {
      const data = [{
        _id: 1
      }, {
        _id: 2
      }];
      openDB.setData({
        testCollection: {
          1: data[0],
          2: data[1]
        }
      });
      collection.getAll().then((result) => {
        expect(db.open).toHaveBeenCalledWith(dbName, collectionNames);
        expect(db.createReadTransaction).toHaveBeenCalledWith(openDB, [collectionName]);
        expect(openDB.close).toHaveBeenCalled();
        expect(result).toEqual(data);
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('should close the db and return an error if getAll fails', (done) => {
      openDB.setFlags({
        request: {
          onError: true
        }
      });
      collection.getAll().then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });
  });

  describe('getOne', () => {
    let collection;
    let openDB;
    const id = 1;

    beforeEach(() => {
      openDB = new DBMock.IDBDatabase(dbName, collectionNames);
      spyOn(openDB, 'close');
      spyOn(db, 'open').and.returnValue(getResolvePromise(openDB));
      collection = new Collection(collectionName, dbName, collectionNames);
      spyOn(db, 'createReadTransaction').and.callThrough();
    });

    it('should open the database, create a read transaction, close the db and return data', (done) => {
      const data = {
        _id: id
      };
      openDB.setData({
        testCollection: {
          1: data
        }
      });
      collection.getOne(id).then((result) => {
        expect(db.open).toHaveBeenCalledWith(dbName, collectionNames);
        expect(db.createReadTransaction).toHaveBeenCalledWith(openDB, [collectionName]);
        expect(openDB.close).toHaveBeenCalled();
        expect(result).toEqual(data);
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('should close the db and return an error if getOne fails', (done) => {
      openDB.setFlags({
        request: {
          onError: true
        }
      });
      collection.getOne(id).then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });
  });
});
