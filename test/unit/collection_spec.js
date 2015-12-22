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

  const collectionName = 'testCollection';
  const dbName = 'testDB';
  const collectionNames = [collectionName, CHANGES_DB_STORE_NAME];
  let openDB;

  beforeEach(() => {
    openDB = new DBMock.IDBDatabase(dbName, collectionNames);
    spyOn(openDB, 'close');
    spyOn(db, 'open').and.returnValue(getResolvePromise(openDB));
  });

  describe('constructor', () => {
    it('should set the database name, collection name and a list of database collections', () => {
      const name = 'testCollection';
      const collections = [name, CHANGES_DB_STORE_NAME];
      const collection = new Collection(name, dbName, collections);
      expect(collection.collectionName).toBe(name);
      expect(collection.dbName).toBe(dbName);
      expect(collection.dbCollectionNames).toEqual(collections);
    });

    it('should throw an error if the collection name is not in the collections list', () => {
      const name = 'testCollection';
      const collections = [CHANGES_DB_STORE_NAME];

      function fn() {
        new Collection(name, dbName, collections); //eslint-disable-line no-new
      }

      expect(fn).toThrow();
    });

    it('should throw an error if the change collection name is not in the collections list', () => {
      const name = 'testCollection';
      const collections = [name];

      function fn() {
        new Collection(name, dbName, collections); //eslint-disable-line no-new
      }

      expect(fn).toThrow();
    });
  });

  describe('save', () => {
    let collection;

    beforeEach(() => {
      collection = new Collection(collectionName, dbName, collectionNames);
      spyOn(db, 'save').and.callThrough();
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
        expect(db.save.calls.argsFor(0)[0].name).toEqual(CHANGES_DB_STORE_NAME);
        expect(db.save.calls.argsFor(0)[1].operation).toBe(UPDATE_OPERATION);
        expect(db.save.calls.argsFor(1)[0].name).toEqual(collectionName);
        expect(db.save.calls.argsFor(1)[1]).toEqual(data);
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

    it('should return an array with errors if some error occured', (done) => {
      const data = {
        _id: 1
      };
      openDB.setFlags({
        request: {
          onError: true
        }
      });
      collection.save(data).then(() => {
        done.fail();
      }).catch((errors) => {
        expect(errors.length).toBe(2);
        expect(openDB.close).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('remove', () => {
    let collection;

    beforeEach(() => {
      collection = new Collection(collectionName, dbName, collectionNames);
      spyOn(db, 'save').and.callThrough();
      spyOn(db, 'remove').and.callThrough();
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

    it('should return an array with errors if some error occured', (done) => {
      const id = 1;
      openDB.setFlags({
        request: {
          onError: true
        }
      });
      collection.remove(id).then(() => {
        done.fail();
      }).catch((errors) => {
        expect(errors.length).toBe(2);
        expect(openDB.close).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('getAll', () => {
    let collection;

    beforeEach(() => {
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
    const id = 1;

    beforeEach(() => {
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
