import initConnectionStatus from '../../src/connection_status';

describe('connectionStatus', () => {
  const global = {
    navigator: { onLine: false },
    addEventListener: jasmine.createSpy('add listener spy'),
    fetch: jasmine.createSpy('fetch spy'),
  };

  const { isOnline, onlineStatusChanged } = initConnectionStatus(global);

  beforeEach(() => {
    global.addEventListener.calls.reset();
    global.fetch.calls.reset();
  });

  describe('isOnline', () => {
    it('should resolve with false if no URL was given', (done) => {
      isOnline('')
          .then((status) => {
            expect(status).toBe(false);
            done();
          })
          .catch((e) => done(e));
    });

    it('should resolve with false if the navigator is not online', (done) => {
      global.navigator.onLine = false;
      isOnline('http://foo.invalid')
          .then((status) => {
            expect(status).toBe(false);
            done();
          })
          .catch((e) => done(e));
    });

    it('should resolve with false if connecting to the server failed', (done) => {
      global.navigator.onLine = true;
      global.fetch.and.returnValue(new Promise((resolve, reject) => {
        reject();
      }));

      isOnline('http://foo.invalid')
          .then((status) => {
            expect(status).toBe(false);
            done();
          })
          .catch((e) => done(e));
    });

    it('should resolve with true if connecting to the server succeeded', (done) => {
      global.navigator.onLine = true;
      global.fetch.and.returnValue(new Promise((resolve) => {
        resolve();
      }));

      isOnline('http://foo.invalid')
          .then((status) => {
            expect(status).toBe(true);
            done();
          })
          .catch((e) => done(e));
    });

    it('should add "check" to the given URL and call method: HEAD', (done) => {
      global.navigator.onLine = true;
      global.fetch.and.returnValue(new Promise((resolve) => {
        resolve();
      }));
      const url = 'http://foo.invalid';
      isOnline(url)
          .then(() => {
            expect(global.fetch).toHaveBeenCalledWith(`${url}/check`, { method: 'HEAD' });
            done();
          })
          .catch((e) => done(e));
    });

    it('should not add a / to the given URL if one exists already', (done) => {
      global.navigator.onLine = true;
      global.fetch.and.returnValue(new Promise((resolve) => {
        resolve();
      }));
      const url = 'http://foo.invalid/';
      isOnline(url)
          .then(() => {
            expect(global.fetch).toHaveBeenCalledWith(`${url}check`, { method: 'HEAD' });
            done();
          })
          .catch((e) => done(e));
    });
  });

  describe('onlineStatusChanged', () => {
    it('should add listeners for the offline and online events', () => {
      global.navigator.onLine = false;
      onlineStatusChanged('http://foo.invalid', () => {});
      expect(global.addEventListener.calls.argsFor(0)[0]).toBe('online');
      expect(global.addEventListener.calls.argsFor(1)[0]).toBe('offline');
    });

    it('should call the cb with the initial status', (done) => {
      global.navigator.onLine = false;
      onlineStatusChanged('http://foo.invalid', (status) => {
        try {
          expect(status).toBe(false);
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('should call the cb with false if the offline listener is called', (done) => {
      global.navigator.onLine = false;
      let calls = 0;
      onlineStatusChanged('http://foo.invalid', (status) => {
        if (calls === 1) {
          try {
            expect(status).toBe(false);
            done();
          } catch (e) {
            done(e);
          }
        } else {
          calls++;
          // Call 'offline' listener
          global.addEventListener.calls.argsFor(1)[1]();
        }
      });
    });

    it(`should call the cb with true if the online listener is called and server
connection succeeds`, (done) => {
      global.navigator.onLine = true;
      global.fetch.and.returnValue(new Promise((resolve) => {
        resolve();
      }));
      let calls = 0;
      onlineStatusChanged('http://foo.invalid', (status) => {
        if (calls === 1) {
          try {
            expect(status).toBe(true);
            done();
          } catch (e) {
            done(e);
          }
        } else {
          calls++;
          // Call 'online' listener
          global.addEventListener.calls.argsFor(0)[1]();
        }
      });
    });

    it(`should call the cb with false if the online listener is called and server
connection fails`, (done) => {
      global.navigator.onLine = true;
      global.fetch.and.returnValue(new Promise((resolve, reject) => {
        reject();
      }));
      let calls = 0;
      onlineStatusChanged('http://foo.invalid', (status) => {
        if (calls === 1) {
          try {
            expect(status).toBe(false);
            done();
          } catch (e) {
            done(e);
          }
        } else {
          calls++;
          // Call 'online' listener
          global.addEventListener.calls.argsFor(0)[1]();
        }
      });
    });
  });
});
