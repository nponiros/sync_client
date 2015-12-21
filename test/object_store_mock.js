function callDelayedCB(cb, result) {
  setTimeout(() => {
    const event = {
      target: {
        result
      }
    };
    cb(event);
  }, 0);
}

class MockObjectStore {
  constructor(isErrorMock, result) {
    this.request = {};
    if (isErrorMock) {
      Object.defineProperty(this.request, 'onerror', {
        set(cb) {
          setTimeout(() => {
            cb(Error('Some error'));
          }, 0);
        }
      });
    } else {
      Object.defineProperty(this.request, 'onsuccess', {
        set(cb) {
          callDelayedCB(cb, result);
        }
      });
    }
    this.data = result;
    this.isErrorMock = isErrorMock;
  }

  put() {
    return this.request;
  }

  delete() {
    return this.request;
  }

  get() {
    return this.request;
  }

  openCursor() {
    if (this.isErrorMock) {
      return this.request;
    } else {
      const data = this.data;
      let index = 1;
      let onSuccess;
      const cursor = {
        value: data[0],
        continue() {
          if (index < data.length) {
            cursor.value = data[index];
            callDelayedCB(onSuccess, cursor);
            index = index + 1;
          } else {
            callDelayedCB(onSuccess, null);
          }
        }
      };
      Object.defineProperty(cursor, 'onsuccess', {
        set(cb) {
          onSuccess = cb;
          callDelayedCB(cb, cursor);
        }
      });
      return cursor;
    }
  }
}

export class ErrorObjectStore extends MockObjectStore {
  constructor() {
    super(true);
  }
}

export class ObjectStore extends MockObjectStore {
  constructor(data) {
    super(false, data);
  }
}
