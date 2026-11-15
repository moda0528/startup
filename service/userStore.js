// MongoDB storage for StudyMatch accounts, courses, and login sessions.
// Database credentials are loaded privately by database.js.
const { getDatabase } = require('./database');

function collection() {
  return getDatabase().collection('users');
}

async function ensureIndexes() {
  await collection().createIndex({ email: 1 }, { unique: true });
  await collection().createIndex({ authTokenHash: 1 }, { unique: true, sparse: true });
}

function findByEmail(email) {
  return collection().findOne({ email });
}

async function insertUser(user) {
  await collection().insertOne(user);
  return user;
}

async function storeLogin(email, tokenHash, expiresAt) {
  await collection().updateOne(
    { email },
    { $set: { authTokenHash: tokenHash, tokenExpiresAt: expiresAt } },
  );
}

function findByTokenHash(tokenHash) {
  return collection().findOne({ authTokenHash: tokenHash, tokenExpiresAt: { $gt: new Date() } });
}

async function clearLogin(tokenHash) {
  if (!tokenHash) return;
  await collection().updateOne(
    { authTokenHash: tokenHash },
    { $unset: { authTokenHash: '', tokenExpiresAt: '' } },
  );
}

async function addCourse(email, name) {
  await collection().updateOne({ email }, { $addToSet: { courses: name } });
  return (await findByEmail(email)).courses;
}

async function removeCourse(email, name) {
  await collection().updateOne({ email }, { $pull: { courses: name } });
  return (await findByEmail(email)).courses;
}

module.exports = {
  ensureIndexes, findByEmail, insertUser, storeLogin, findByTokenHash,
  clearLogin, addCourse, removeCourse,
};
