/* eslint guard-for-in:0, no-unused-vars: 0 */
/**
 * cuid.js
 * Collision-resistant UID generator for browsers and node.
 * Sequential for fast db lookups and recency sorting.
 * Safe for element IDs and server-side lookups.
 *
 * Extracted from CLCTR
 *
 * Copyright (c) Eric Elliott 2012
 * MIT License
 */
// The file was modified to use ES2015
let c = 0;
const blockSize = 4;
const base = 36;
const discreteValues = Math.pow(base, blockSize);

function pad(num, size) {
  const s = '000000000' + num;
  return s.substr(s.length - size);
}

function randomBlock() {
  return pad((Math.random() * discreteValues << 0).toString(base), blockSize);
}

function safeCounter() {
  c = c < discreteValues ? c : 0;
  c++; // this is not subliminal
  return c - 1;
}

// We want to cache the results of this
const cache = (function calc() {
  let count = 0;

  for (const i in window) {
    count++;
  }

  return count;
}());

function globalCount() {
  return cache;
}

function browserPrint() {
  const mimeTypesUAString = (
    navigator.mimeTypes.length + navigator.userAgent.length
  ).toString(base);
  return pad(mimeTypesUAString + globalCount().toString(base), 4);
}

function cuid() {
  // Starting with a lowercase letter makes
  // it HTML element ID friendly.
  const letter = 'c'; // hard-coded allows for sequential access

  // timestamp
  // warning: this exposes the exact date and time
  // that the uid was created.
  const timestamp = (new Date().getTime()).toString(base);

  // A few chars to generate distinct ids for different
  // clients (so different computers are far less
  // likely to generate the same id)
  const fingerprint = browserPrint();

  // Grab some more chars from Math.random()
  const random = randomBlock() + randomBlock();

  // Prevent same-machine collisions.
  const counter = pad(safeCounter().toString(base), blockSize);

  return letter + timestamp + counter + fingerprint + random;
}

export default cuid;
