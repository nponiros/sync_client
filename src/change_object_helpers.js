import {UPDATE_OPERATION, DELETE_OPERATION} from './constants.js';

// Change set always replaces the last change for a given object
export function createUpdateChangeObject(collectionName, data) {
  const changeObject = {
    operation: UPDATE_OPERATION,
    changeSet: data,
    _id: data._id,
    collectionName
  };
  return changeObject;
}

export function createRemoveChangeObject(collectionName, id) {
  const changeObject = {
    operation: DELETE_OPERATION,
    _id: id,
    collectionName
  };
  return changeObject;
}
