// MongoDB persistence for messages posted to StudyMatch study-session chats.
const { getDatabase } = require('./database');

function collection() {
  return getDatabase().collection('messages');
}

async function ensureIndexes() {
  await collection().createIndex({ id: 1 }, { unique: true });
  await collection().createIndex({ sessionId: 1, time: 1, _id: 1 });
}

async function seedSamples(samplesBySession) {
  // Preserve sample messages without duplicating them on server restarts.
  for (const [sessionId, conversation] of Object.entries(samplesBySession)) {
    for (const message of conversation) {
      await collection().updateOne(
        { id: message.id },
        { $setOnInsert: { sessionId, ...message } },
        { upsert: true },
      );
    }
  }
}

function listMessages(sessionId) {
  // Never leak MongoDB's _id or internal sessionId in API responses.
  return collection().find(
    { sessionId },
    { projection: { _id: 0, sessionId: 0 } },
  ).sort({ time: 1, _id: 1 }).toArray();
}

async function addMessage(sessionId, message) {
  await collection().insertOne({ sessionId, ...message });
  return message;
}

async function deleteForSession(sessionId) {
  await collection().deleteMany({ sessionId });
}

module.exports = { ensureIndexes, seedSamples, listMessages, addMessage, deleteForSession };
