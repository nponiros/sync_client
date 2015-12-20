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
        set: function (cb) {
          setTimeout(() => {
            cb(Error('Some error'));
          }, 0);
        }
      });
    } else {
      Object.defineProperty(this.request, 'onsuccess', {
        set: function (cb) {
          callDelayedCB(cb, result);
        }
      });
    }
    this.data = result;
    this.isErrorMock = isErrorMock;
  }

  put(data) {
    return this.request;
  }

  delete(id) {
    return this.request;
  }

  get(id) {
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
