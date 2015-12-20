import * as db from '../../src/indexeddb_connector.js';
import * as Mocks from '../object_store_mock.js';

describe('IndexedDB Connector', () => {

  describe('open', () => {
    it('should open and return a database with the given name and object stores', (done) => {
      const name = 'testDB';
      const dbStoreNames = ['testStore'];
      db.open(name, dbStoreNames).then((db) => {
        expect(db.name).toBe(name);
        expect(db.version).toBe(1);
        expect(db.objectStoreNames[0]).toBe(dbStoreNames[0]);
        db.close();
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
      db.remove(objectStore, id).then((id) => {
        expect(id).toBe(undefined);
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
});