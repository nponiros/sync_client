import SyncClient from '../../src/sync_client.js';
import Collection from '../../src/collection.js';
import { CHANGES_DB_STORE_NAME } from '../../src/constants.js';
import * as uploadFn from '../../src/upload.js';
import * as downloadFn from '../../src/download.js';

describe('SyncClient', () => {
  let syncClient;
  const collectionName = 'testCollection';
  const dbName = 'testDB';
  const collectionNames = [collectionName];
  const serverUrl = '';

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

  beforeEach(() => {
    syncClient = new SyncClient(dbName, collectionNames, serverUrl);
  });

  describe('constructor', () => {
    it('should return a new SyncClient instance', () => {
      expect(syncClient instanceof SyncClient).toBe(true);
    });

    it('should not contain the changes collection in the collections map', () => {
      const collectionsMap = syncClient.collections;
      expect(collectionsMap.get(CHANGES_DB_STORE_NAME)).toBe(undefined);
    });
  });

  describe('getCollection', () => {
    it('should return a collection with the given name', () => {
      const collection = syncClient.getCollection(collectionName);
      expect(collection instanceof Collection).toBe(true);
      expect(collection.collectionName).toBe(collectionName);
    });
  });

  describe('sync', () => {
    it('should call the download and upload functions', (done) => {
      spyOn(uploadFn, 'upload').and.returnValue(getResolvePromise());
      spyOn(downloadFn, 'download').and.returnValue(getResolvePromise());
      syncClient.sync().then(() => {
        expect(uploadFn.upload).toHaveBeenCalledWith(dbName, collectionNames, serverUrl);
        expect(downloadFn.download).toHaveBeenCalledWith(dbName, collectionNames, serverUrl);
        done();
      }).catch((err) => {
        done.fail(err);
      });
    });

    it('should reject the promise if download fails', (done) => {
      spyOn(downloadFn, 'download').and.returnValue(getRejectPromise(Error()));
      syncClient.sync().then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });

    it('should reject the promise if upload fails', (done) => {
      spyOn(downloadFn, 'download').and.returnValue(getResolvePromise());
      spyOn(uploadFn, 'upload').and.returnValue(getRejectPromise(Error()));
      syncClient.sync().then(() => {
        done.fail();
      }).catch((err) => {
        expect(err).not.toBe(undefined);
        done();
      });
    });
  });
});
