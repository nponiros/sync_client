import {API_V1_DOWNLOAD, LAST_UPDATE_TS} from './constants.js';

import * as IndexedDB from './indexeddb_connector.js';

import {post} from './ajax.js';

export default function download(dbName, collectionNames) {
// TODO: better names for the data we send
// could be undefined
  const lastUpdateTS = localStorage.getItem(LAST_UPDATE_TS);
  post(API_V1_DOWNLOAD, {lastUpdateTS, collectionNames}).then((resp) => {
    const changes = resp.changes;
    // TODO: don't like this yet
    const maping = {};
    changes.forEach(function(change) {
      maping[change.collection] = change.changeSets;
    });
    return maping;
  }).then((maping) => {
    var collections = Object.keys(maping);
    // TODO: save/delete distinguish
  });
  // Download only needs the real collections but without changeset generation
  // could use same collections as now with parameters to define if changeset needs creating
// need a transaction for all changes at once

  // Download: need a lastUpdateTS (get from localStore) and all collections, download all changes newer than lastUpdateTS and save to DB

}
