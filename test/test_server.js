/* eslint-env node */

'use strict';

const fs = require('fs');

const pidFile = '/tmp/sync_server.pid';
const action = process.argv[2];

const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const expressApp = express();

if (action === 'start') {
  fs.writeFileSync(pidFile, process.pid);

  expressApp.use(bodyParser.json());
  expressApp.use(cors());

  expressApp.post('/api/v1/upload', (req, res) => {
    const changes = req.body.changes;
    const ids = changes.map((change) => {
      return change._id;
    });
    res.send({
      changeIds: ids,
      lastUpdateTS: Date.now(),
    });
  });

  const downloadData = [{
    _id: 1,
    collectionName: 'testCollection',
    operation: 'UPDATE',
    changeSet: {
      _id: 1,
      title: 'title',
    },
  }];

  expressApp.post('/api/v1/download', (req, res) => {
    res.send({
      changes: downloadData,
    });
  });

  expressApp.listen(3000);
} else if (action === 'stop') {
  const pid = fs.readFileSync(pidFile);
  process.kill(Number(pid));
  fs.unlinkSync(pidFile);
} else {
  throw Error('Action not supported!');
}
