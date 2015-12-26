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
    this.result = result;
    this.error = null;

    this.source = source;
    this.transaction = transaction;
    this.readyState = 'pending';
    this.internal = {
      flags
    };
    this._flags = {
      pending: true,
      done: false
    };
  }

  exec() {
    this._flags.done = true;
    this._flags.pending = false;
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
    this._position = 1;
  }

  continue() {
    if (this._position < this.internal.keys.length) {
      const next = this.internal.data[this.internal.keys[this._position]];
      this._position = this._position + 1;
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

export class IDBObjectStore {
  constructor(transaction, name, internal) {
    this.name = name;
    this.transaction = transaction;
    this.internal = internal;
    this._flags = {};
  }

  put() {
    if (!this.transaction._flags.active) {
      throw new DOMException('TransactionInactiveError');
    }
    const requestFlags = this.internal.flags.request;
    const request = new IDBRequest(this.transaction, this, null, requestFlags);
    this.transaction.internal.requests.push(request);
    return request;
  }

  delete() {
    if (!this.transaction._flags.active) {
      throw new DOMException('TransactionInactiveError');
    }
    const requestFlags = this.internal.flags.request;
    const request = new IDBRequest(this.transaction, this, undefined, requestFlags);
    this.transaction.internal.requests.push(request);
    return request;
  }

  get(id) {
    if (!this.transaction._flags.active) {
      throw new DOMException('TransactionInactiveError');
    }
    const requestFlags = this.internal.flags.request;
    const value = this.internal.data[id];
    const request = new IDBRequest(this.transaction, this, value, requestFlags);
    this.transaction.internal.requests.push(request);
    return request;
  }

  openCursor() {
    if (!this.transaction._flags.active) {
      throw new DOMException('TransactionInactiveError');
    }
    const requestFlags = this.internal.flags.request;
    const request = new IDBRequest(this.transaction, this, undefined, requestFlags);
    this.transaction.internal.requests.push(request);
    const data = this.internal.data;
    const keys = Object.keys(data);
    keys.sort();
    const cursorInternal = {
      keys,
      data,
      request
    };
    if (keys.length === 0) {
      request.result = null;
    } else {
      request.result = new IDBCursorWithValue(this, cursorInternal);
    }
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
    this._flags = {
      active: true
    };
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
      this._flags.active = false;
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

  abort() {

  }

  objectStore(name) {
    if (!this._flags.active) {
      throw new DOMException('InvalidStateError');
    } else if (this.objectStoreNames.indexOf(name) === -1) {
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

export class IDBDatabase {
  constructor(name, objectStoreNames) {
    this.name = name;
    this.version = 1;
    this.objectStoreNames = objectStoreNames;
    this.internal = {
      data: {},
      flags: {}
    };
    this._flags = {
      isClosed: false
    };
  }

  close() {
    if (this.internal.flags && this.internal.flags.db) {
      this._flags.isClosed = true;
    } else {
      this._flags.isClosed = true;
    }
  }

  transaction(dbStoreNames, mode) {
    mode = mode || 'readonly';
    if (dbStoreNames.length === 0) {
      throw new DOMException('InvalidAccessError');
    } else if (this._flags.isClosed) {
      throw new DOMException('InvalidStateError');
    } else if (mode !== 'readonly' && mode !== 'readwrite' && mode !== 'versionchange') {
      throw new DOMException('TypeError');
    } else {
      for (let i = 0; i < dbStoreNames.length; i++) {
        const storeName = dbStoreNames[i];
        if (this.objectStoreNames.indexOf(storeName) === -1) {
          throw new DOMException('NotFoundError');
        }
      }
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
