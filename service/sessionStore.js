// MongoDB storage for StudyMatch study sessions.
const { getDatabase } = require('./database');

function collection() {
  return getDatabase().collection('sessions');
}

async function ensureIndexes() {
  await collection().createIndex({ id: 1 }, { unique: true });
}

async function seedSamples(samples) {
  // Insert only if absent; never overwrite members or edits in MongoDB.
  for (const session of samples) {
    await collection().updateOne({ id: session.id }, { $setOnInsert: session }, { upsert: true });
  }
}

const projection = { projection: { _id: 0 } };

async function listSessions() {
  return collection().find({}, projection).sort({ date: 1, time: 1 }).toArray();
}

async function listMine(email) {
  return collection().find({ members: email }, projection).sort({ date: 1, time: 1 }).toArray();
}

function getSession(id) {
  return collection().findOne({ id }, projection);
}

async function createSession(session) {
  await collection().insertOne({ ...session });
  return session;
}

function joinSession(id, email) {
  // Atomic guard prevents concurrent requests from exceeding maxStudents.
  return collection().findOneAndUpdate(
    { id, members: { $ne: email }, $expr: { $lt: [{ $size: '$members' }, '$maxStudents'] } },
    { $addToSet: { members: email } },
    { returnDocument: 'after', projection: { _id: 0 } },
  );
}

function leaveSession(id, email) {
  return collection().findOneAndUpdate(
    { id, members: email, createdBy: { $ne: email } },
    { $pull: { members: email } },
    { returnDocument: 'after', projection: { _id: 0 } },
  );
}

async function deleteSession(id, email) {
  const result = await collection().deleteOne({ id, createdBy: email });
  return result.deletedCount === 1;
}

module.exports = {
  ensureIndexes, seedSamples, listSessions, listMine,
  getSession, createSession, joinSession, leaveSession, deleteSession,
};
