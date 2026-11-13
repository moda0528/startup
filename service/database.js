// MongoDB connection helper. Routes still use in-memory data until the next DB changes.
// Never commit service/dbConfig.json: it contains the database password.
const fs = require('node:fs');
const path = require('node:path');
const { MongoClient } = require('mongodb');

const defaultConfigPath = path.join(__dirname, 'dbConfig.json');
let client;
let database;
let pendingConnection;

function connectionOptions(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('MongoDB configuration must be an object.');
  }

  const dbName = config.dbName ?? 'studymatch';
  if (typeof dbName !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(dbName)) {
    throw new Error('MongoDB dbName must contain only letters, digits, underscores, or hyphens.');
  }

  if (config.uri !== undefined) {
    if (typeof config.uri !== 'string' || !/^mongodb(\+srv)?:\/\//.test(config.uri)) {
      throw new Error('MongoDB uri must start with mongodb:// or mongodb+srv://.');
    }
    return { uri: config.uri, dbName };
  }

  const { hostname, userName, password } = config;
  if (typeof hostname !== 'string' || !/^[a-zA-Z0-9.-]+$/.test(hostname)) {
    throw new Error('MongoDB hostname must be an Atlas hostname without a protocol or credentials.');
  }
  if (typeof userName !== 'string' || !userName || typeof password !== 'string' || !password) {
    throw new Error('MongoDB userName and password are required.');
  }

  // Encoding allows special characters such as @ and # in credentials.
  const uri = `mongodb+srv://${encodeURIComponent(userName)}:${encodeURIComponent(password)}@${hostname}/?retryWrites=true&w=majority`;
  return { uri, dbName };
}

function readConnectionOptions(configPath = defaultConfigPath) {
  // Optional alternative for production: a secret environment variable.
  if (process.env.MONGODB_URI) {
    return connectionOptions({
      uri: process.env.MONGODB_URI,
      dbName: process.env.MONGODB_DB_NAME || 'studymatch',
    });
  }
  if (!fs.existsSync(configPath)) {
    throw new Error('Missing service/dbConfig.json. Copy dbConfig.example.json and add your Atlas credentials locally.');
  }
  return connectionOptions(JSON.parse(fs.readFileSync(configPath, 'utf8')));
}

async function connectDatabase() {
  if (database) return database;
  if (!pendingConnection) {
    pendingConnection = (async () => {
      const { uri, dbName } = readConnectionOptions();
      const nextClient = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
      try {
        await nextClient.connect();
        const nextDatabase = nextClient.db(dbName);
        await nextDatabase.command({ ping: 1 });
        client = nextClient;
        database = nextDatabase;
        return database;
      } catch (_error) {
        await nextClient.close();
        // Do not log exception details that might include connection credentials.
        throw new Error('MongoDB connection failed. Check the Atlas cluster, database user, password, and IP access list.');
      }
    })().catch((error) => {
      pendingConnection = undefined; // permit retry after configuration changes
      throw error;
    });
  }
  return pendingConnection;
}

function getDatabase() {
  if (!database) throw new Error('Connect to MongoDB with connectDatabase() first.');
  return database;
}

async function closeDatabase() {
  if (client) await client.close();
  client = undefined;
  database = undefined;
  pendingConnection = undefined;
}

module.exports = {
  connectionOptions,
  readConnectionOptions,
  connectDatabase,
  getDatabase,
  closeDatabase,
};
