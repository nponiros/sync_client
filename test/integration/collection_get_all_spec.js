import SyncClient from '../../dist/syncClient.min.js';

describe('Collection getOne', () => {
  let syncClient;
  let collection;
  const dbName = 'testGetAllDB';
  const serverUrl = 'http://127.0.0.1:3000';
  const collectionName = 'testCollection';
  const collectionNames = [collectionName];
  beforeEach(() => {
    syncClient = new SyncClient(dbName, collectionNames, serverUrl);
    collection = syncClient.getCollection(collectionName);
  });

  it('should return the data object matching the given id', (done) => {
    const data1 = {
      _id: 1,
      title: 'testTitle'
    };
    const data2 = {
      _id: 2,
      title: 'testTitle2'
    };
    collection.save(data1).then(() => {
      return collection.save(data2);
    }).then(() => {
      return collection.getAll().then((dataArray) => {
        expect(dataArray).toEqual([data1, data2]);
        done();
      });
    }).catch((err) => {
      done.fail(err);
    });
  });
});
