import {post} from '../../src/ajax.js';

describe('Ajax post', () => {
  jasmine.Ajax.install();

  let promise;
  let request;
  const url = 'testUrl';
  const data = {
    title: 'testTitle',
    _id: 1
  };

  beforeEach(() => {
    promise = post(url, data);
    request = jasmine.Ajax.requests.mostRecent();
  });

  it('should resolve the promise with data from the server', (done) => {
    promise.then((returnData) => {
      expect(returnData).toEqual(data);
      done();
    }).catch((err) => {
      done.fail(err);
    });
    request.respondWith({status: 200, response: data});
  });

  it('should set the url to the given url and the method to POST', () => {
    post(url, data);
    expect(request.url).toBe(url);
    expect(request.method).toBe('POST');
    expect(request.params).toEqual(JSON.stringify(data));
  });

  it('should set the correct request headers', () => {
    post(url, data);
    expect(request.requestHeaders['X-Request-With']).toBe('XMLHttpRequest');
    expect(request.requestHeaders.Accept).toBe('application/json');
    expect(request.requestHeaders['Content-Type']).toBe('application/json;charset=UTF-8');
  });

  it('should reject the promise if the status is not 200', (done) => {
    promise.then(() => {
      done.fail();
    }).catch((xhr) => {
      expect(xhr).not.toBe(undefined);
      done();
    });
    request.respondWith({status: 500, response: data});
  });

  it('should reject the promise on error', (done) => {
    promise.then(() => {
      done.fail();
    }).catch((xhr) => {
      expect(xhr).not.toBe(undefined);
      done();
    });
    request.onerror();
  });

  it('should reject the promise on abort', (done) => {
    promise.then(() => {
      done.fail();
    }).catch((xhr) => {
      expect(xhr).not.toBe(undefined);
      done();
    });
    request.onabort();
  });
});
