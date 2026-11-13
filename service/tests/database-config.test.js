const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  connectionOptions,
  readConnectionOptions,
  getDatabase,
} = require('../database.js');

test('encodes special characters in Atlas credentials', () => {
  const { uri, dbName } = connectionOptions({
    hostname: 'cluster0.example.mongodb.net',
    userName: 'student@example.com',
    password: 'p@ss:word#1',
    dbName: 'studymatch',
  });
  assert.equal(dbName, 'studymatch');
  assert.match(uri, /^mongodb\+srv:\/\/student%40example\.com:p%40ss%3Aword%231@cluster0\.example\.mongodb\.net\//);
  assert.equal(uri.includes('p@ss:word#1'), false);
});

test('accepts URI format for local or environment configuration', () => {
  assert.deepEqual(
    connectionOptions({ uri: 'mongodb://localhost:27017', dbName: 'studymatch_test' }),
    { uri: 'mongodb://localhost:27017', dbName: 'studymatch_test' },
  );
});

test('rejects missing credentials and malformed hostnames', () => {
  assert.throws(() => connectionOptions({ hostname: 'cluster0.mongodb.net', userName: 'test' }), /password/);
  assert.throws(() => connectionOptions({ hostname: 'https://cluster0.mongodb.net', userName: 'test', password: 'abc' }), /hostname/);
});

test('reads a JSON config without requiring a live database', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'studymatch-db-test-'));
  const oldUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;
  const filename = path.join(directory, 'dbConfig.json');
  try {
    fs.writeFileSync(filename, JSON.stringify({
      hostname: 'cluster0.mongodb.net', userName: 'test', password: 'secret',
    }));
    const options = readConnectionOptions(filename);
    assert.equal(options.dbName, 'studymatch');
    assert.match(options.uri, /^mongodb\+srv:\/\/test:secret@cluster0\.mongodb\.net\//);
  } finally {
    if (oldUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = oldUri;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('database access requires an explicit connection', () => {
  assert.throws(() => getDatabase(), /connectDatabase/);
});
