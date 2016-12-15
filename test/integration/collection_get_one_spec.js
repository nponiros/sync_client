import SyncClient from '../../dist/syncClient.min.js';

describe('Collection getOne', () => {
  let syncClient;
  let collection;
  const dbName = 'testGetOneDB';
  const serverUrl = 'http://127.0.0.1:3000';
  const collectionName = 'testCollection';
  const collectionNames = [collectionName];
  beforeEach(() => {
    syncClient = new SyncClient(dbName, collectionNames, serverUrl);
    collection = syncClient.getCollection(collectionName);
  });

  it('should return the data object matching the given id', (done) => {
    const data = {
      _id: 1,
      title: 'testTitle',
    };
    collection.save(data).then((id) => {
      return collection.getOne(id).then((result) => {
        expect(result).toEqual(data);
        done();
      });
    }).catch((err) => {
      done.fail(err);
    });
  });

  it('should return undefined if the given id matches no object', (done) => {
    collection.getOne(10).then((data) => {
      expect(data).toBe(undefined);
      done();
    }).catch((err) => {
      done.fail(err);
    });
  });

  it('should reject the promise if the given id is undefined', (done) => {
    collection.getOne().then(() => {
      done.fail();
    }).catch((err) => {
      expect(err).not.toBe(undefined);
      expect(err).toEqual(jasmine.any(DOMException));
      expect(err.name).toBe('DataError');
      done();
    });
  });

  it('should reject the promise if the given id is not a valid key', (done) => {
    const id = {};
    collection.getOne(id).then(() => {
      done.fail();
    }).catch((err) => {
      expect(err).not.toBe(undefined);
      expect(err).toEqual(jasmine.any(DOMException));
      expect(err.name).toBe('DataError');
      done();
    });
  });

  it('should reject the promise if the given id is null', (done) => {
    collection.getOne(null).then(() => {
      done.fail();
    }).catch((err) => {
      expect(err).not.toBe(undefined);
      expect(err).toEqual(jasmine.any(DOMException));
      expect(err.name).toBe('DataError');
      done();
    });
  });
});
