// TODO some return value types don't match the spec
export class IDBRequest {
  constructor(transaction, source, result, flags) {
    const self = this;
    Object.defineProperty(this, 'onsuccess', {
      set(cb) {
        self.successCB = cb;
      }
    });
    Object.defineProperty(this, 'onerror', {
      set(cb) {
        self.errorCB = cb;
      }
    });
    // TODO these get set after "done"
    this.result = result;
    this.error = null;

    this.source = source;
    this.transaction = transaction;
    this.readyState = 'pending';
    this.internal = {
      flags
    };
  }

  exec() {
    // this.internal.flags.done = true;
    // this.internal.flags.pending = false;
    this.readyState = 'done';
    if (this.internal.flags && this.internal.flags.onError) {
      const event = {
        type: 'error'
      };
      this.result = undefined;
      this.error = Error('Request error');
      if (this.errorCB) {
        this.errorCB(event);
      }
      return event;
    } else {
      const event = {
        target: {
          result: this.result
        },
        type: 'success'
      };
      this.error = null;
      if (this.successCB) {
        this.successCB(event);
      }
      return event;
    }
  }
}

export class IDBCursor {
  constructor(source, internal) {
    this.source = source;
    this.internal = internal;
    this.internal.position = 1;
  }

  continue() {
    if (this.internal.position < this.internal.keys.length) {
      const next = this.internal.data[this.internal.keys[this.internal.position]];
      this.internal.position = this.internal.position + 1;
      return next;
    } else {
      return null;
    }
  }
}

export class IDBCursorWithValue extends IDBCursor {
  constructor(source, internal) {
    super(source, internal);
    this.value = internal.data[internal.keys[0]];
  }

  continue() {
    const next = super.continue();
    if (next === null) {
      this.internal.request.result = null;
    }
    this.value = next;
    this.internal.request.exec();
  }
}

// TODO check if transaction is active before executing operations on it
export class IDBObjectStore {
  constructor(transaction, name, internal) {
    this.name = name;
    this.transaction = transaction;
    this.internal = internal;
  }

  put() {
    // TODO: is the result of put really null?
    const requestFlags = this.internal.flags.request;
    const request = new IDBRequest(this.transaction, this, null, requestFlags);
    this.transaction.internal.requests.push(request);
    return request;
  }

  delete() {
    const requestFlags = this.internal.flags.request;
    const request = new IDBRequest(this.transaction, this, undefined, requestFlags);
    this.transaction.internal.requests.push(request);
    return request;
  }

  get(id) {
    const requestFlags = this.internal.flags.request;
    const value = this.internal.data[id];
    const request = new IDBRequest(this.transaction, this, value, requestFlags);
    this.transaction.internal.requests.push(request);
    return request;
  }

// TODO range and direction
  openCursor() {
    const requestFlags = this.internal.flags.request;
    const request = new IDBRequest(this.transaction, this, undefined, requestFlags);
    this.transaction.internal.requests.push(request);
    const data = this.internal.data;
    // TODO keys should be sorted
    const keys = Object.keys(data);
    const cursorInternal = {
      keys,
      data,
      request
    };
    request.result = new IDBCursorWithValue(this, cursorInternal);
    return request;
  }
}

export class IDBTransaction {
  constructor(db, dbStoreNames, mode, internal) {
    const self = this;
    this.db = db;
    this.objectStoreNames = dbStoreNames;
    this.mode = mode;
    this.internal = internal;
    Object.defineProperty(this, 'oncomplete', {
      set(cb) {
        self.completeCB = cb;
      }
    });
    Object.defineProperty(this, 'onerror', {
      set(cb) {
        self.errorCB = cb;
      }
    });
    Object.defineProperty(this, 'onabort', {
      set(cb) {
        self.abortCB = cb;
      }
    });
    setTimeout(() => {
      // Transaction becomes inactive once the event loop takes over
      internal.flags.transaction = {
        active: false
      };
      const requests = this.internal.requests;
      const index = 0;
      let isError = false;

      function next(i) {
        const nextRequest = requests[i];
        if (nextRequest) {
          i = i + 1;
          setTimeout(() => {
            const event = nextRequest.exec();
            if (event.type === 'error') {
              i = requests.length;
              isError = true;
              next(null);
            } else {
              next(i);
            }
          }, 0);
        } else {
          if (!isError && self.completeCB) {
            self.completeCB();
          } else if (self.errorCB) {
            self.errorCB();
          }
        }
      }

      next(index);
    }, 0);
    internal.requests = [];
  }

  objectStore(name) {
    // TODO InvalidStateError
    if (this.objectStoreNames.indexOf(name) === -1) {
      throw new DOMException('NotFoundError');
    }
    const data = this.internal.data[name];
    const objectStoreInternal = {
      data,
      flags: this.internal.flags
    };
    return new IDBObjectStore(this, name, objectStoreInternal);
  }
}

// TODO flags is too complicated
export class IDBDatabase {
  constructor(name, objectStoreNames) {
    this.name = name;
    this.version = 1;
    this.objectStoreNames = objectStoreNames;
    this.internal = {
      data: {},
      flags: {}
    };
  }

  close() {
    if (this.internal.flags && this.internal.flags.db) {
      this.internal.flags.db.isClosed = true;
    } else {
      this.internal.flags = {
        db: {
          isClosed: true
        }
      };
    }
  }

  transaction(dbStoreNames, mode) {
    // TODO: mode error TypeError
    // TODO: dbStoreNames must be in objectStoreNames NotFoundError
    if (dbStoreNames.length === 0) {
      throw new DOMException('InvalidAccessError');
    } else if (this.internal.flags && this.internal.flags.db && this.internal.flags.db.isClosed) {
      throw new DOMException('InvalidStateError');
    }
    return new IDBTransaction(this, dbStoreNames, mode, this.internal);
  }

  setData(data) {
    this.internal.data = data;
  }

  setFlags(flags) {
    this.internal.flags = flags;
  }
}
