import Dexie from 'dexie';
import observable from 'dexie-observable';
import syncable from 'dexie-syncable';

import cuid from './cuid.js';
import initSync from './poll_sync_protocol';
import initConnectionStatus from './connection_status';
import serverComm from './server_comm';

const { isOnline, onlineStatusChanged } = initConnectionStatus(window);

const sync = initSync(serverComm, isOnline);

import initSyncClient from './sync_client';

export default initSyncClient({
  Dexie,
  syncable,
  observable,
  sync,
  onlineStatusChanged,
  isOnline,
  cuid,
});
