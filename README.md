# SyncClient (WIP)

This module can be used to write data to IndexedDB and later call a synchronization function to synchronize the data in IndexedDB with a server. It was primarily written to work with [SyncServer](https://github.com/nponiros/sync_server) but should work with other servers which offer the same API.

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

## TODO
* What to do with a change object if we delete an element which does not exist
* Add test coverage
* Take a look at object store's getAll() function
* Integration tests for sync()
