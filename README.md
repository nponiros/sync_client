# SyncClient

[![Code Climate](https://codeclimate.com/github/nponiros/sync_client/badges/gpa.svg)](https://codeclimate.com/github/nponiros/sync_client)

## Synopsis

This module can be used to write data to IndexedDB using [Dexie](http://dexie.org) and to synchronize the data in IndexedDB with a server. [Dexie.Syncable](https://www.npmjs.com/package/dexie-syncable) is used for the synchronization. This module contains an implementation of the [ISyncProtocol](https://github.com/dfahlander/Dexie.js/wiki/Dexie.Syncable.ISyncProtocol). It was primarily written to work with [sync-server](https://github.com/nponiros/sync_server) but should work with other servers which offer the same API.

## Installation

```bash
npm install --save sync-client
```

## Basic Usage

```js
import SyncClient from 'sync-client';
// SyncClient is a subclass of Dexie

const databaseName = 'testDB'; // The name for the indexedDB database
const versions = [{
  version: 1,
  stores: { // Has the same format as https://github.com/dfahlander/Dexie.js/wiki/Version.stores()
    test: 'id',
  },
}];

const syncClient = new SyncClient(databaseName, versions);
```

## API

### constructor(dbName, versions, partialsThreshold)

__Parameters__:

* dbName: The name of the IndexedDB database
* versions: An array of objects with `version` and `stores` as key. The `version` must be an integer and the `stores` an object in the form of a [Dexie Store](https://github.com/dfahlander/Dexie.js/wiki/Version.stores()). You can optionally pass an `upgrader` function for each store to be used with [Version.upgrade](https://github.com/dfahlander/Dexie.js/wiki/Version.upgrade())
* partialsThreshold: This is an optional parameter and define the maximum number of changes we will send at once. If for example the threshold is set to 10 and we have 20 changes, dexie-syncable will send to requests each with 10 changes. Default value is `Infinity`

__Return__:

A SyncClient instance. Via this instance you can access all methods of a Dexie instance. More information can be found in the [Dexie API Reference](https://github.com/dfahlander/Dexie.js/wiki/API%20Reference)

__Example__:

```js
import SyncClient from 'sync-client';

const dbVersions = [
    {
      version: 1,
      stores: {
        todos: 'id'
      }
    },
    {
      version: 2,
      stores: {
        todos: 'id, tags'
      },
      upgrader(transaction) { ... }
    }
]

const syncClient = new SyncClient('MyTodosDB', dbVersions);
```

### Static Methods

#### getID()

__Description__:

Creates and returns a unique ID using [cuid](https://github.com/ericelliott/cuid). This method does not add anything to the database. Alternatively you can use the prototype `getID()` method.

__Parameters__:

None.

__Returns__:

A string representing the ID.

### Prototype Methods

#### getID()

__Description__:

Creates and returns a unique ID using [cuid](https://github.com/ericelliott/cuid). This method does not add anything to the database. Alternatively you can use the static `getID()` method.

__Parameters__:

None.

__Returns__:

A string representing the ID.

#### connect(url, options)

__Description__:

This method tries to connect to a server and start the synchronization process. Before trying to connect, it checks if `window.navigator.onLine` is true and if yes it sends a ping to `${url}/check` to make sure that the server is online. If The checks pass it calls the `connect` method of [Dexie.Syncable](https://github.com/dfahlander/Dexie.js/wiki/db.syncable.connect()). Subsequent calls to `connect` just resolve unless we manually disconnected before by calling `disconnect(url)` or if the client auto-disconnected us because of an error during synchronization or because we are offline (`navigator.onLine` changed to false).

__Parameters__:

* url: The server URL to connect to
* options: Object. Currently supported options:
  * pollInterval: Number in milliseconds telling the client how often it should sync with the server. Default value is `10000`
  * credentials: one of `'omit'` or `'include'`. Default value is 'omit'. You can find more information about the credentials option on the [Fetch API page](https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch/fetch). The `'include'` value only works if the server supports the `Access-Control-Allow-Credentials` header.

__Returns__:

A Promise which resolves if we managed to connect to the server and rejects if we failed to connect.

#### disconnect(url)

__Description__:

This method tries to disconnect from a server and stop the synchronization process. Calls the `disconnect` method of [Dexie.Syncable](https://github.com/dfahlander/Dexie.js/wiki/db.syncable.disconnect()).

__Parameters__:

* url: The server URL to disconnect from

__Returns__:

A Promise which resolves if we managed to disconnect and rejects if we failed to disconnect.

#### removeUrl(url)

__Description__:

It disconnects from the server with the given URL and removes all relevant synchronization data from the database. It does not remove data in your tables. Calls the `delete` method of [Dexie.Syncable](https://github.com/dfahlander/Dexie.js/wiki/db.syncable.delete())

__Parameters__:

* url: The server URL to disconnect from and remove its data

__Returns__:

A Promise which resolves if we managed to delete the data and rejects if we failed.

#### statusChange(url, cb)

__Description__:

This method can be used to register a listener which is called every time the connection status of the given URL is changed.

__Parameters__:

* url: The URL for which we want to receive status changed
* cb: Callback to be called on status changed. The callback has one parameter which is the new status string

__Returns__:

Nothing.

#### getStatuses()

__Description__:

This method can be used to get a list of all URLs the their current status.

__Parameters__:

None.

__Returns__:

A Promise which resolves with an array of `{url: string, status: SyncClient.statuses}` object. The promise is rejected if we failed to get the statuses.

#### getStatus(url)

__Description__:

This method can be used to get the text status for one URL.

__Parameters__:

* url: The URL for which we want the status for

__Returns__:

A Promise which resolves with a status of type `SyncClient.statuses`. The promise is rejected if we fail to get the status.

### Static Properties

#### statuses

__Description__:

An object containing keys pointing to [statuses](https://github.com/dfahlander/Dexie.js/wiki/Dexie.Syncable.Statuses) of Dexie.Syncable. Instead of returning the number for a status it returns the string as key. For example `SyncClient.statuses.ERROR` will return `'ERROR'`.

## Running the tests

The following commands can be execute to run the tests.

```bash
npm install
npm test
```

The last command will run eslint and the unit tests for the module.

## TODO

* Add integration tests

## Contributing

If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please open an [issue](https://github.com/nponiros/sync_client/issues) or [pull request](https://github.com/nponiros/sync_client/pulls).
If you have any questions feel free to open an [issue](https://github.com/nponiros/sync_client/issues) with your question.

## License
[MIT License](./LICENSE)

[cuid.js](./src/cuid.js) has license MIT Copyright (c) Eric Elliott 2012. The file was modified to use ES2015 syntax.
