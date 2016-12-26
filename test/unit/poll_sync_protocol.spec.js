import initPollSyncProtocol from '../../src/poll_sync_protocol';

describe('pollSyncProtocol', () => {
  const serverComm = jasmine.createSpy();
  const isOnline = jasmine.createSpy();

  const sync = initPollSyncProtocol(serverComm, isOnline);

  beforeEach(() => {
    serverComm.calls.reset();
    isOnline.calls.reset();
  });

  describe('serverComm failure', () => {
    it('should call onError with Infinity if isOnline fails', (done) => {
      const error = new Error('Some error');
      serverComm.and.returnValue(new Promise((resolve, reject) => {
        reject(error);
      }));
      isOnline.and.returnValue(new Promise((resolve) => {
        resolve(false);
      }));

      function onError(e, again) {
        try {
          expect(e).toBe(error);
          expect(again).toBe(Infinity);
          done();
        } catch (e) {
          done(e);
        }
      }

      sync(
        {},
        'http://foo.invalid',
        {},
        0,
        1,
        [],
        false,
        () => {},
        () => {},
        () => {},
        onError
      );
    });

    it('should call onError with pollInterval if isOnline succeeds', (done) => {
      const options = { pollInterval: 100 };
      const error = new Error('Some error');
      serverComm.and.returnValue(new Promise((resolve, reject) => {
        reject(error);
      }));
      isOnline.and.returnValue(new Promise((resolve) => {
        resolve(true);
      }));

      function onError(e, again) {
        try {
          expect(e).toBe(error);
          expect(again).toBe(options.pollInterval);
          done();
        } catch (e) {
          done(e);
        }
      }

      sync(
          {},
          'http://foo.invalid',
          options,
          0,
          1,
          [],
          false,
          () => {},
          () => {},
          () => {},
          onError
      );
    });
  });

  describe('serverComm success', () => {
    it('should call onError with errorMessage and Infinity if data.success is not true', (done) => {
      const error = 'Some error';
      serverComm.and.returnValue(new Promise((resolve) => {
        resolve({
          success: false,
          errorMessage: error,
        });
      }));

      function onError(e, again) {
        try {
          expect(e).toBe(error);
          expect(again).toBe(Infinity);
          done();
        } catch (e) {
          done(e);
        }
      }

      sync(
          {},
          'http://foo.invalid',
          {},
          0,
          1,
          [],
          false,
          () => {},
          () => {},
          () => {},
          onError
      );
    });

    it('should save the new clientIdentity', (done) => {
      const saveSpy = jasmine.createSpy('save spy').and.returnValue(new Promise((resolve) => {
        resolve();
      }));
      const applyRemoteChangesSpy = jasmine.createSpy('apply remote spy');
      const onChangesAcceptedSpy = jasmine.createSpy('on changes accepted spy');
      const context = {
        save: saveSpy,
      };

      const options = { pollInterval: 100 };
      const serverResp = {
        success: true,
        clientIdentity: 1,
      };
      serverComm.and.returnValue(new Promise((resolve) => {
        resolve(serverResp);
      }));

      function onSuccess(again) {
        try {
          expect(context.clientIdentity).toBe(serverResp.clientIdentity);
          expect(saveSpy).toHaveBeenCalled();
          expect(applyRemoteChangesSpy).toHaveBeenCalled();
          expect(onChangesAcceptedSpy).toHaveBeenCalled();
          expect(again).toEqual({ again: options.pollInterval });
          done();
        } catch (e) {
          done(e);
        }
      }

      sync(
          context,
          'http://foo.invalid',
          options,
          0,
          1,
          [],
          false,
          applyRemoteChangesSpy,
          onChangesAcceptedSpy,
          onSuccess,
          () => {}
      );
    });

    it('should call onError with Infinity and an error if saving fails', (done) => {
      const error = new Error('Some error');
      const saveSpy = jasmine.createSpy('save spy')
        .and.returnValue(new Promise((resolve, reject) => { reject(error); }));
      const applyRemoteChangesSpy = jasmine.createSpy('apply remote spy');
      const onChangesAcceptedSpy = jasmine.createSpy('on changes accepted spy');
      const context = {
        save: saveSpy,
      };

      const serverResp = {
        success: true,
        clientIdentity: 1,
      };
      serverComm.and.returnValue(new Promise((resolve) => {
        resolve(serverResp);
      }));

      function onError(e, again) {
        try {
          expect(e).toBe(error);
          expect(again).toBe(Infinity);
          expect(onChangesAcceptedSpy).not.toHaveBeenCalled();
          expect(applyRemoteChangesSpy).not.toHaveBeenCalled();
          done();
        } catch (e) {
          done(e);
        }
      }

      sync(
          context,
          'http://foo.invalid',
          {},
          0,
          1,
          [],
          false,
          applyRemoteChangesSpy,
          onChangesAcceptedSpy,
          () => {},
          onError
      );
    });

    it('should not save the clientIdentity if we already had one', (done) => {
      const saveSpy = jasmine.createSpy('save spy').and.returnValue(new Promise((resolve) => {
        resolve();
      }));
      const applyRemoteChangesSpy = jasmine.createSpy('apply remote spy');
      const onChangesAcceptedSpy = jasmine.createSpy('on changes accepted spy');
      const context = {
        clientIdentity: 10,
        save: saveSpy,
      };

      const options = { pollInterval: 100 };
      const serverResp = {
        success: true,
        clientIdentity: 1,
      };
      serverComm.and.returnValue(new Promise((resolve) => {
        resolve(serverResp);
      }));

      function onSuccess(again) {
        try {
          expect(saveSpy).not.toHaveBeenCalled();
          expect(applyRemoteChangesSpy).toHaveBeenCalled();
          expect(onChangesAcceptedSpy).toHaveBeenCalled();
          expect(again).toEqual({ again: options.pollInterval });
          done();
        } catch (e) {
          done(e);
        }
      }

      sync(
          context,
          'http://foo.invalid',
          options,
          0,
          1,
          [],
          false,
          applyRemoteChangesSpy,
          onChangesAcceptedSpy,
          onSuccess,
          () => {}
      );
    });
  });
});
