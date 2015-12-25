/*eslint-env node */

'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const expressApp = express();

expressApp.use(bodyParser.json());
expressApp.use(cors());

// TODO: error based on parameter
expressApp.post('/api/v1/upload', (req, res) => {
  const changes = req.body.changes;
  const ids = changes.map((change) => {
    return change._id;
  });
  res.send({
    changeIds: ids,
    lastUpdateTS: Date.now()
  });
});

const downloadData = [{
  _id: 1,
  collectionName: 'testCollection',
  operation: 'UPDATE',
  changeSet: {
    _id: 1,
    title: 'title'
  }
}];

// TODO: error based on parameter
// TODO: not valid operation

expressApp.post('/api/v1/download', (req, res) => {
  res.send({
    changes: downloadData
  });
});

expressApp.listen(3000);
