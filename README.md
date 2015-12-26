# SyncClient

This module can be used to write data to IndexedDB and later call a synchronization function to synchronize the data in IndexedDB with a server. It was primarily written to work with [SyncServer](https://github.com/nponiros/sync_server) but should work with other servers which offer the same API.

## Installation

The easiest way to install this package is via npm.

```bash
npm install --save sync-client
```

The alternative is to clone this repository and execute the following commands to create the production and development bundles. After built, the bundles can be found in the /dist directory.

```bash
npm install
npm run build-dev   # Development bundle
npm run build-prod  # Production bundle
```

## Basic Usage

The module was made to work with [SystemJS](https://github.com/systemjs/systemjs). It is possible that it also works with other loaders, but that was not tested. 

```js
import SyncClient from 'syncClient';

const databaseName = 'testDB';            // The name for the indexedDB database
const collectionName = 'testCollection';
const collectionNames = [collectionName]; // The names of the object stores we want the database to contain
const serverUrl = 'http://127.0.0.1';     // The URL of the server we use for synchronization
const syncClient = new SyncClient(databaseName, collectionNames, serverUrl);

const collection = syncClient.getCollection(collectionName);

const testData = {
  title: 'Test title'
};
collection.save(testData).then(() => {
  return collection.getAll();
}).then((data) => {
  console.log(data);
}).catch((err) => {
  console.log(err);
});

```
The code above assumes that the loader exposes SyncClient as an ES Module with name "syncClient". For more usage information, see the API.

### Caveat

Changing the collection names after the first collection operation was executed is currently not supported. For that you need to change the database version and this option is currently not supported.

If you want to synchronize your data with a server, you will also need a [SyncServer](https://github.com/nponiros/sync_server). It doesn't necessarily have to be the linked server but the APIs must match.

## API

### SyncClient 

* constructor(dbName, collectionNames, serverUrl)
  * dbName: the name of the indexedDB database
  * collectionNames: the names of the object store we would like to have in the database
  * serverUrl: Protocol + Domain + Port (if needed) for the synchronization functions. The actual API path is automatically added
    * API Paths: for upload: /api/v1/upload, for download: /api/v1/download
  * returns a SyncClient instance
* getCollection(collectionName)
  * collectionName: the name of the collection we want to get. Must be one of the collectionNames given to the constructor
  * returns a Collection
* sync()
  * returns a Promise
  * Description: calls upload and download functions to send data to the server and receive new data from the server.
  
### Collection

* save(data)
  * data: the data to save in the collection
  * returns Promise which resolves with the \_id property of the data or rejects with an error
  * Description: Can be used to add and update data in the database. For a data update, the given data object needs the \_id property. For data objects without \_id, an id will be set automatically
* remove(id)
  * id: the id of the data object to delete
  * returns Promise which resolves with undefined or rejects with an error
* getAll()
  * returns Promise which resolves with the data of a given collection or rejects with an error
* getOne(id)
  * id: the \_id property of a data object in the database
  * returns Promise which resolves with the data object or rejects with an error

## Running the tests

The following commands can be execute to run the tests.

```bash
npm install
npm test
```

The last command will run the unit and integration tests for the module. The integration tests will start a [test server](./test/test_server.js) on port 3000 for the synchronization test so make sure that port if not in use before running the tests. The server will be stopped automatically after the tests are through.
Coverage results for the unit tests can be found in the coverage directory.

## Browser Compatibility

The module was tested with newer versions of Firefox and Chrome.

## Contributing

If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please open an [issue](https://github.com/nponiros/sync_client/issues) or [pull request](https://github.com/nponiros/sync_client/pulls).
If you have any questions feel free to open an [issue](https://github.com/nponiros/sync_client/issues) with your question.

## TODO
* What to do with a change object if we delete an element which does not exist
* Take a look at object store's getAll() function

## License
[MIT License](./LICENSE)

[cuid.js](./src/cuid.js) has license MIT Copyright (c) Eric Elliott 2012. The file was modified to use ES2015 syntax.
