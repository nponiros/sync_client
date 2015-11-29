# SyncClient (WIP)

This module can be used to write data to IndexedDB and later call a synchronization function to synchronize the data in IndexedDB with a server. It was primarily written to work with [SyncServer](https://github.com/nponiros/sync_server) but should work with other servers which offer the same API.

## API


    
## TODO
* What happens if the db fails to open?
* Test onabort -> make something fail by not passing an id
* Test onerror for transaction
* Check what errors are thrown and what is called via onerror -> error control, catch is missing
* Some functions could throw an exception -> need to abort the transaction
* Tests
* Improve docu
* Offer API function for online/offline check
* Download/Upload is not working yet
* Online check not working