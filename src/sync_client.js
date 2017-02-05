const SYNCABLE_PROTOCOL = 'sync_client_protocol';
const defaultSyncOptions = {
  pollInterval: 10000, // Poll every 10 seconds
  credentials: 'omit',
};

export default function initSyncClient({
  Dexie,
  observable,
  syncable,
  sync,
  isOnline,
  onlineStatusChanged,
  cuid,
}) {
  class SyncClient extends Dexie {
    /*
     * dbName: string, name for the database
     * dbVersions: {version: number, stores: Array<Dexie.SchemaDefinition>}
     * https://github.com/dfahlander/Dexie.js/wiki/Version.stores()
     */
    constructor(dbName, dbVersions, partialsThreshold) {
      super(dbName, { addons: [observable, syncable] });
      dbVersions.forEach((version) => {
        if (version.upgrader) {
          this.version(version.version).stores(version.stores).upgrade(version.upgrader);
        } else {
          this.version(version.version).stores(version.stores);
        }
      });

      Dexie.Syncable.registerSyncProtocol(SYNCABLE_PROTOCOL, { sync, partialsThreshold });

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

    static getID() {
      return cuid();
    }

    _connect(url, options) {
      return this.syncable
          .connect(SYNCABLE_PROTOCOL, url, options)
          .catch((e) => { // disconnect when onError is called
            this.disconnect(url);
            throw e;
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
        this.options[url] = Object.assign({}, options, defaultSyncOptions);

        return isOnline(url)
            .then((status) => {
              if (status) {
                return this._connect(url, this.options[url])
                    .then(() => {
                      // Make sure we managed to connect before adding URL
                      // and listener
                      this.urls.push(url);

                      onlineStatusChanged(url, (newStatus) => {
                        if (newStatus) {
                          this._connect(url, this.options[url]);
                        } else {
                          this.disconnect(url);
                        }
                      });
                    });
              }
              return Promise.reject(new Error('Is not online'));
            });
      }
      return Promise.resolve();
    }

    disconnect(url) {
      return this.syncable.disconnect(url)
          .then(() => {
            this.urls = this.urls.filter((u) => u !== url);
          });
    }

    removeUrl(url) {
      return this.syncable.delete(url)
          .then(() => {
            this.urls = this.urls.filter((u) => u !== url);
            this.statusChangeListeners[url] = undefined;
          });
    }

    statusChange(url, cb) {
      this.statusChangeListeners[url] = cb;
    }

    /*
     * Returns a Promise<Array<{url, status}>>
     */
    getStatuses() {
      return this.syncable
          .list()
          .then((urls) => {
            const promises = urls.map((url) => this.syncable.getStatus(url));
            return Promise.all(promises).then((statuses) => {
              return urls.map((url, index) => ({
                url,
                status: Dexie.Syncable.StatusTexts[statuses[index]],
              }));
            });
          });
    }

    getStatus(url) {
      return this.syncable
          .getStatus(url)
          .then((status) => {
            return Dexie.Syncable.StatusTexts[status];
          });
    }

    getID() { return SyncClient.getID(); }
  }

  SyncClient.statuses = Object
      .keys(Dexie.Syncable.Statuses)
      .reduce((statuses, statusKey) => Object.assign(statuses, { [statusKey]: statusKey }), {});

  return SyncClient;
}
