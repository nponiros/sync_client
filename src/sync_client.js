const SYNCABLE_PROTOCOL = 'sync_client_protocol';
const defaultSyncOptions = {
  pollInterval: 10000, // Poll every 10 seconds
};

export default function initSyncClient({
  Dexie,
  sync,
  isOnline,
  onlineStatusChanged,
  cuid,
}) {
  return class SyncClient extends Dexie {
    /*
     * dbName: string, name for the database
     * dbVersions: {version: number, stores: Array<Dexie.SchemaDefinition>}
     * https://github.com/dfahlander/Dexie.js/wiki/Version.stores()
     */
    constructor(dbName, dbVersions) {
      super(dbName);
      dbVersions.forEach((version) => {
        this.version(version.version).stores(version.stores);
      });

      Dexie.Syncable.registerSyncProtocol(SYNCABLE_PROTOCOL, { sync });

      this.options = {};
      this.urls = [];
      this.statusChangeListeners = {};

      this.syncable.on('statusChanged', (status, url) => {
        const cb = this.statusChangeListeners[url];
        if (cb) {
          cb(Dexie.Syncable.StatusTexts[status]);
        }
      });
    }

    _connect(url, options) {
      return this.syncable
          .connect(SYNCABLE_PROTOCOL, url, options)
          // TODO need to tell the user what the error was
          .catch((e) => {
            console.log(e);
          });
    }

    /*
     * options:
     *   pollInterval: number -> How often to resync
     */
    connect(url, options) {
      // First call to connect
      // Setup onlineStatusChanged
      // Check isOnline before trying to connect using Dexie.Syncable
      if (this.urls.indexOf(url) === -1) {
        this.urls.push(url);
        this.options[url] = Object.assign({}, options, defaultSyncOptions);

        onlineStatusChanged(url, (newStatus) => {
          if (newStatus) {
            this._connect(url, this.options[url]);
          } else {
            this.disconnect(url);
          }
        });

        return isOnline(url)
            .then((status) => {
              if (status) {
                return this._connect(url, this.options[url]);
              }
              return Promise.reject(new Error('Is not online'));
            });
      }
    }

    disconnect(url) {
      return this.syncable.disconnect(url)
          .then(() => {
            this.urls = this.urls.filter((u) => u !== url);
          })
          // TODO tell user what the error was
          .catch((e) => {
            console.error(e);
          });
    }

    removeUrl(url) {
      this.syncable.delete(url)
          .then(() => {
            this.statusChangeListeners[url] = undefined;
          })
          // TODO tell user about the error
          .catch((e) => {
            console.error(e);
          });
    }

    statusChange(url, cb) {
      this.statusChangeListeners[url] = cb;
    }

    /*
     * Returns a Promise<Array<{url, status}>>
     */
    getStatuses() {
      this.syncable
          .list()
          .then((urls) => {
            const promises = urls.map((url) => this.syncable.getStatus(url));
            return Promise.all(promises).then((statuses) => {
              return urls.map((url, index) => ({
                url,
                status: Dexie.Syncable.StatusTexts[statuses[index]],
              }));
            });
          })
          // TODO tell user about the error
          .catch((e) => {
            console.error(e);
          });
    }

    getID() {
      return cuid();
    }
  };
}
