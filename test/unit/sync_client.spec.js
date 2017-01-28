import Dexie from 'dexie';
import 'dexie-syncable';
import cuid from '../../src/cuid';

import initSyncClient from '../../src/sync_client';

describe('SyncClient', () => {
  const Syncable = {
    StatusTexts: Dexie.Syncable.StatusTexts,
    Statuses: Dexie.Syncable.Statuses,
    registerSyncProtocol: jasmine.createSpy('register sync protocol spy'),
  };
  const syncable = {
    on: jasmine.createSpy('on spy'),
  };

  const storesSpy = jasmine.createSpy('stores spy');
  class MyDexie {
    constructor() {
      this.syncable = syncable;
    }

    on() {}
  }
  MyDexie.prototype.version = jasmine.createSpy('version spy')
      .and.returnValue({ stores: storesSpy });

  MyDexie.Syncable = Syncable;

  const isOnlineSpy = jasmine.createSpy('isOnline spy');
  const onlineStatusChangedSpy = jasmine.createSpy('onlineStatusChanged spy');

  const syncFn = () => {};
  const SyncClient = initSyncClient({
    Dexie: MyDexie,
    sync: syncFn,
    isOnline: isOnlineSpy,
    onlineStatusChanged: onlineStatusChangedSpy,
    cuid,
  });

  describe('constructor', () => {
    it('should setup stores, register the protocol and setup statusChanged', () => {
      const dbName = 'myDB';
      const versions = [{ version: 1, stores: { foo: 'id' } }];
      new SyncClient(dbName, versions, 10); // eslint-disable-line no-new

      expect(MyDexie.prototype.version).toHaveBeenCalledWith(1);
      expect(storesSpy).toHaveBeenCalledWith({ foo: 'id' });
      expect(syncable.on.calls.argsFor(0)[0]).toBe('statusChanged');
      expect(Syncable.registerSyncProtocol)
          .toHaveBeenCalledWith('sync_client_protocol', { sync: syncFn, partialsThreshold: 10 });
    });
  });

  describe('disconnect', () => {
    it('should call syncable.disconnect and remove the given URL from this.urls', (done) => {
      const syncClient = new SyncClient('', []);
      const url = 'http://foo.invalid';
      syncable.disconnect = jasmine.createSpy('disconnect spy')
          .and.returnValue(new Promise((resolve) => { resolve(); }));

      syncClient.urls.push(url);

      syncClient.disconnect(url)
          .then(() => {
            expect(syncable.disconnect).toHaveBeenCalledWith(url);
            expect(syncClient.urls).toEqual([]);
            done();
          })
          .catch((e) => {
            done(e);
          });
    });

    it('should not remove the URL if the syncable.disconnect call failed', (done) => {
      const syncClient = new SyncClient('', []);
      const url = 'http://foo.invalid';
      syncable.disconnect = jasmine.createSpy('disconnect spy')
          .and.returnValue(new Promise((resolve, reject) => { reject(); }));

      syncClient.urls.push(url);

      syncClient.disconnect(url)
          .catch(() => {
            try {
              expect(syncable.disconnect).toHaveBeenCalledWith(url);
              expect(syncClient.urls).toEqual([url]);
              done();
            } catch (e) {
              done(e);
            }
          });
    });
  });

  describe('removeUrl', () => {
    it('should call syncable.delete and remove any status listener and the URL', (done) => {
      const syncClient = new SyncClient('', []);
      const url = 'http://foo.invalid';
      syncable.delete = jasmine.createSpy('delete spy')
          .and.returnValue(new Promise((resolve) => { resolve(); }));

      syncClient.urls.push(url);
      syncClient.statusChangeListeners[url] = 'foo';

      syncClient.removeUrl(url)
          .then(() => {
            expect(syncable.delete).toHaveBeenCalledWith(url);
            expect(syncClient.urls).toEqual([]);
            expect(syncClient.statusChangeListeners[url]).toBeUndefined();
            done();
          })
          .catch((e) => {
            done(e);
          });
    });

    it('should do nothing if syncable.delete failed', (done) => {
      const syncClient = new SyncClient('', []);
      const url = 'http://foo.invalid';
      syncable.delete = jasmine.createSpy('delete spy')
          .and.returnValue(new Promise((resolve, reject) => { reject(); }));

      syncClient.urls.push(url);
      syncClient.statusChangeListeners[url] = 'foo';

      syncClient.removeUrl(url)
          .catch(() => {
            try {
              expect(syncable.delete).toHaveBeenCalledWith(url);
              expect(syncClient.urls).toEqual([url]);
              expect(syncClient.statusChangeListeners[url]).toBe('foo');
              done();
            } catch (e) {
              done(e);
            }
          });
    });
  });

  describe('getStatuses', () => {
    it('should return a list with url and status', (done) => {
      const urls = ['http://foo.invalid'];
      const statuses = [-1];
      syncable.list = function () {
        return new Promise((resolve) => {
          resolve(urls);
        });
      };
      syncable.getStatus = function () {
        return new Promise((resolve) => {
          resolve(statuses);
        });
      };

      const syncClient = new SyncClient('', []);

      syncClient.getStatuses()
          .then((res) => {
            expect(res.length).toBe(1);
            expect(res[0].url).toBe(urls[0]);
            expect(res[0].status).toBe(SyncClient.statuses.ERROR);
            done();
          })
          .catch((e) => {
            done(e);
          });
    });
  });

  describe('connect', () => {
    beforeEach(() => {
      isOnlineSpy.calls.reset();
      onlineStatusChangedSpy.calls.reset();
    });

    it('should try to connect, if it succeeds it should add listeners and the url', (done) => {
      const syncClient = new SyncClient('', []);
      const url = 'http://foo.invalid';
      const options = { foo: 'bar' };

      syncClient._connect = jasmine.createSpy()
          .and.returnValue(new Promise((resolve) => { resolve(); }));

      isOnlineSpy.and.returnValue(new Promise((resolve) => {
        resolve(true);
      }));

      syncClient.connect(url, options)
          .then(() => {
            expect(syncClient.urls).toEqual([url]);
            expect(syncClient.options[url]).toEqual({
              foo: 'bar',
              pollInterval: 10000,
              credentials: 'omit',
            });
            expect(onlineStatusChangedSpy).toHaveBeenCalled();
            done();
          })
          .catch((e) => {
            done(e);
          });
    });

    it('should reject if we are not online', (done) => {
      const syncClient = new SyncClient('', []);
      const url = 'http://foo.invalid';
      const options = { foo: 'bar' };

      isOnlineSpy.and.returnValue(new Promise((resolve) => {
        resolve(false);
      }));

      syncClient.connect(url, options)
          .catch((e) => {
            expect(e instanceof Error).toBe(true);
            done();
          });
    });

    it('should reject if connect fails', (done) => {
      const syncClient = new SyncClient('', []);
      const url = 'http://foo.invalid';
      const options = { foo: 'bar' };

      syncClient._connect = jasmine.createSpy()
          .and.returnValue(new Promise((resolve, reject) => { reject(); }));

      isOnlineSpy.and.returnValue(new Promise((resolve) => {
        resolve(true);
      }));

      syncClient.connect(url, options)
          .then(() => {
            expect(syncClient.urls).toEqual([url]);
            expect(syncClient.options[url]).toEqual({
              foo: 'bar',
              pollInterval: 10000,
            });
            expect(onlineStatusChangedSpy).toHaveBeenCalled();
            done();
          })
          .catch((e) => {
            done(e);
          });
    });
  });

  describe('connect - onlineStatusChanged', () => {
    beforeEach(() => {
      isOnlineSpy.calls.reset();
      onlineStatusChangedSpy.calls.reset();
    });

    it('should call disconnect if the status changed to offline', (done) => {
      const syncClient = new SyncClient('', []);
      const url = 'http://foo.invalid';
      const options = { foo: 'bar' };

      syncClient._connect = jasmine.createSpy()
          .and.returnValue(new Promise((resolve) => { resolve(); }));

      isOnlineSpy.and.returnValue(new Promise((resolve) => {
        resolve(true);
      }));

      syncClient.disconnect = jasmine.createSpy('disconnect spy');

      syncClient.connect(url, options)
          .then(() => {
            const cb = onlineStatusChangedSpy.calls.argsFor(0)[1];
            cb(false);
            expect(syncClient.disconnect).toHaveBeenCalledWith(url);
            done();
          })
          .catch((e) => {
            done(e);
          });
    });

    it('should call _connect if the status changed to online', (done) => {
      const syncClient = new SyncClient('', []);
      const url = 'http://foo.invalid';
      const options = { foo: 'bar' };

      syncClient._connect = jasmine.createSpy('_connect spy')
          .and.returnValue(new Promise((resolve) => { resolve(); }));

      isOnlineSpy.and.returnValue(new Promise((resolve) => {
        resolve(true);
      }));

      syncClient.connect(url, options)
          .then(() => {
            const cb = onlineStatusChangedSpy.calls.argsFor(0)[1];
            syncClient._connect.calls.reset();
            cb(true);
            expect(syncClient._connect)
              .toHaveBeenCalledWith(url, { foo: 'bar', pollInterval: 10000, credentials: 'omit' });
            done();
          })
          .catch((e) => {
            done(e);
          });
    });
  });
});
