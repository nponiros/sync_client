import Collection from '../../src/collection.js';
import {CHANGES_DB_STORE_NAME, DELETE_OPERATION, UPDATE_OPERATION} from '../../src/constants.js';
import * as db from '../../src/indexeddb_connector.js';

describe('Collection', () => {
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
  });

  describe('constructor', () => {
    it('should set the database name, collection name and a list of database collections', () => {
      const name = 'testCollection';
      const dbName = 'testDB';
      const collections = [name, CHANGES_DB_STORE_NAME];
      const collection = new Collection(name, dbName, collections);
      expect(collection.collectionName).toBe(name);
      expect(collection.dbName).toBe(dbName);
      expect(collection.dbCollectionNames).toEqual(collections);
    });

    it('should throw an error if the collection name is not in the collections list', () => {
      const name = 'testCollection';
      const dbName = 'testDB';
      const collections = [CHANGES_DB_STORE_NAME];

      function fn() {
        new Collection(name, dbName, collections); //eslint-disable-line no-new
      }

      expect(fn).toThrow();
    });

    it('should throw an error if the change collection name is not in the collections list', () => {
      const name = 'testCollection';
      const dbName = 'testDB';
      const collections = [name];

      function fn() {
        new Collection(name, dbName, collections); //eslint-disable-line no-new
      }

      expect(fn).toThrow();
    });
  });

  describe('save', () => {
    let collection;
    const collectionName = 'testCollection';
    const dbName = 'testDB';
    const collectionNames = [collectionName, CHANGES_DB_STORE_NAME];

    beforeEach(() => {
      collection = new Collection(collectionName, dbName, collectionNames);
      spyOn(openDB, 'close');
      spyOn(db, 'open').and.returnValue(getResolvePromise(openDB));
      spyOn(db, 'save');
    });

    it('should open the database, create a read/write transaction, call save for the change collection, call save for this collection and close the db', (done) => {
      const data = {
        _id: 1
      };
      spyOn(db, 'createReadWriteTransaction').and.callFake(fakeSuccess);

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
      spyOn(db, 'createReadWriteTransaction').and.callFake(fakeSuccess);

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
      spyOn(db, 'createReadWriteTransaction').and.callFake(fakeError);

      collection.save(data).then(() => {
        done.fail();
      }).catch((errors) => {
        expect(errors.length).toBe(1);
        expect(openDB.close).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('remove', () => {
    let collection;
    const collectionName = 'testCollection';
    const dbName = 'testDB';
    const collectionNames = [collectionName, CHANGES_DB_STORE_NAME];

    beforeEach(() => {
      collection = new Collection(collectionName, dbName, collectionNames);
      spyOn(openDB, 'close');
      spyOn(db, 'open').and.returnValue(getResolvePromise(openDB));
      spyOn(db, 'save');
      spyOn(db, 'remove');
    });

    it('should open the database, create a read/write transaction, call save for the change collection, remove for this collection and close the db', (done) => {
      const id = 1;
      spyOn(db, 'createReadWriteTransaction').and.callFake(fakeSuccess);

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
      spyOn(db, 'createReadWriteTransaction').and.callFake(fakeError);

      collection.remove(id).then(() => {
        done.fail();
      }).catch((errors) => {
        expect(errors.length).toBe(1);
        expect(openDB.close).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('getAll', () => {
    let collection;
    const collectionName = 'testCollection';
    const dbName = 'testDB';
    const collectionNames = [collectionName, CHANGES_DB_STORE_NAME];

    beforeEach(() => {
      collection = new Collection(collectionName, dbName, collectionNames);
      spyOn(openDB, 'close');
      spyOn(db, 'open').and.returnValue(getResolvePromise(openDB));
      spyOn(db, 'createReadTransaction').and.callThrough();
    });

    it('should open the database, create a read transaction, call getAll and then close the db', (done) => {
      const id = 1;
      const data = [{
        _id: id
      }];
      spyOn(db, 'getAll').and.returnValue(getResolvePromise(data));
      collection.getAll().then((result) => {
        expect(db.open).toHaveBeenCalledWith(dbName, collectionNames);
        expect(db.createReadTransaction).toHaveBeenCalledWith(openDB, [collectionName]);
        expect(db.getAll).toHaveBeenCalledWith(objectStore);
        expect(openDB.close).toHaveBeenCalled();
        expect(result).toEqual(data);
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('should close the db and return an error if getAll fails', (done) => {
      const error = Error('Error');

      spyOn(db, 'getAll').and.returnValue(getRejectPromise(error));
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
    const collectionName = 'testCollection';
    const dbName = 'testDB';
    const collectionNames = [collectionName, CHANGES_DB_STORE_NAME];
    const id = 1;

    beforeEach(() => {
      collection = new Collection(collectionName, dbName, collectionNames);
      spyOn(openDB, 'close');
      spyOn(db, 'open').and.returnValue(getResolvePromise(openDB));
      spyOn(db, 'createReadTransaction').and.callThrough();
    });

    it('should open the database, create a read transaction, call getOne and then close the db', (done) => {
      const data = {
        _id: id
      };
      spyOn(db, 'getOne').and.returnValue(getResolvePromise(data));
      collection.getOne(id).then((result) => {
        expect(db.open).toHaveBeenCalledWith(dbName, collectionNames);
        expect(db.createReadTransaction).toHaveBeenCalledWith(openDB, [collectionName]);
        expect(db.getOne).toHaveBeenCalledWith(objectStore, id);
        expect(openDB.close).toHaveBeenCalled();
        expect(result).toEqual(data);
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('should close the db and return an error if getOne fails', (done) => {
      const error = Error('Error');
      spyOn(db, 'getOne').and.returnValue(getRejectPromise(error));
      collection.getOne(id).then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });
  });
});
