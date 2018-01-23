# Change Log
This project adheres to [Semantic Versioning](http://semver.org/).

Please not that there was no stable release yet and things may break at any time

## [1.0.0-beta.10] - 2018-01-23

* Update dexie to 2.0.1 and dexie-observable/dexie-syncable to 1.0.0-beta.4

## [1.0.0-beta.9] - 2017-06-03

* Allow the user to pass additional addons for Dexie. Closes: [#5](https://github.com/nponiros/sync_client/issues/5). This is a breaking change in case the partialsThreshold is defined. See the README on how to pass the addons and/or partialsThreshold

## [1.0.0-beta.8] - 2017-02-05

* Support upgrade functions. Closes: [#1](https://github.com/nponiros/sync_client/issues/1)
* Configurable partialsThreshold. Closes: [#2](https://github.com/nponiros/sync_client/issues/2)
* Add getStatus method to get the status as text
* Update dexie/dexie-syncable/dexie-observable
* Fix order of dexie addons inclusion

## [1.0.0-beta.5] - 2017-01-22

* Fix publish scripts

## [1.0.0-beta.3] - 2017-01-21

* Add credentials option for connect
* package.json main now points to the dist file

## [1.0.0-beta.1] - 2016-12-27

Rewrite to use Dexie and Dexie.Syncable. The complete API was changed and is not backwards compatible. Please open an issue if you are using an old version and want to upgrade it.
