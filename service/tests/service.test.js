const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index.js');
const bcrypt = require('bcryptjs');
const { connectDatabase, getDatabase, closeDatabase } = require('../database.js');
const { ensureIndexes } = require('../userStore.js');
const sessionStore = require('../sessionStore.js');

let server;
let origin;
let cookie;
let testEmail;
let testParticipantEmail;
let testSessionId;

before(async () => {
  await connectDatabase();
  await ensureIndexes();
  await sessionStore.ensureIndexes();
  server = await new Promise((resolve) => {
    const running = app.listen(0, '127.0.0.1', () => resolve(running));
  });
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  // Remove only test records. Never clear real application data.
  if (testSessionId) await getDatabase().collection('sessions').deleteOne({ id: testSessionId });
  if (testEmail) await getDatabase().collection('users').deleteOne({ email: testEmail });
  if (testParticipantEmail) await getDatabase().collection('users').deleteOne({ email: testParticipantEmail });
  await closeDatabase();
});

async function api(path, method = 'GET', body, authenticated = false) {
  const response = await fetch(origin + '/api' + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(authenticated ? { Cookie: authenticated === true ? cookie : authenticated } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { response, data: response.status === 204 ? null : await response.json() };
}

test('StudyMatch Express service: health, auth, sessions, and chat', async () => {
  let result = await api('/health');
  assert.equal(result.response.status, 200);
  assert.equal(result.data.status, 'ok');

  result = await api('/auth/me');
  assert.equal(result.response.status, 401, 'protected endpoint must reject guests');

  const email = `learner-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  testEmail = email;
  const password = 'Test-Password-2026!';
  result = await api('/auth/create', 'POST', { email, name: 'Learner', password });
  assert.equal(result.response.status, 201);
  assert.equal(result.data.user.email, email);
  assert.equal(Object.hasOwn(result.data.user, 'passwordHash'), false);
  cookie = result.response.headers.get('set-cookie').split(';')[0];
  assert.match(result.response.headers.get('set-cookie'), /httponly/i);

  // Verify accounts are actually persisted in Atlas and passwords are hashed.
  const savedUser = await getDatabase().collection('users').findOne({ email });
  assert.ok(savedUser, 'MongoDB must contain the account');
  assert.notEqual(savedUser.passwordHash, password, 'do not store plaintext passwords');
  assert.equal(await bcrypt.compare(password, savedUser.passwordHash), true);
  assert.ok(savedUser.authTokenHash, 'login session is stored in MongoDB');
  assert.notEqual(savedUser.authTokenHash, cookie.split('=')[1], 'do not store plaintext tokens');

  result = await api('/auth/create', 'POST', { email, name: 'Duplicate', password });
  assert.equal(result.response.status, 409, 'duplicate emails must be rejected');

  result = await api('/auth/me', 'GET', undefined, true);
  assert.equal(result.response.status, 200);
  assert.equal(result.data.user.name, 'Learner');

  result = await api('/courses', 'POST', { course: 'CS 235' }, true);
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.data.courses, ['CS 235']);
  assert.deepEqual((await getDatabase().collection('users').findOne({ email })).courses, ['CS 235']);

  result = await api('/sessions', 'POST', {
    course: 'CS 235', date: '2099-01-01', time: '15:00', location: 'Library', maxStudents: 5,
  }, true);
  assert.equal(result.response.status, 201);
  const id = result.data.session.id;
  testSessionId = id;
  assert.ok(id);
  const storedSession = await getDatabase().collection('sessions').findOne({ id });
  assert.ok(storedSession, 'Study session must exist in MongoDB');
  assert.equal(storedSession.course, 'CS 235');
  assert.deepEqual(storedSession.members, [email]);
  result = await api('/sessions/mine', 'GET', undefined, true);
  assert.ok(result.data.sessions.some((session) => session.id === id), 'session must be retrieved from MongoDB');

  const participantEmail = `participant-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  testParticipantEmail = participantEmail;
  result = await api('/auth/create', 'POST', { email: participantEmail, name: 'Participant', password });
  assert.equal(result.response.status, 201);
  const participantCookie = result.response.headers.get('set-cookie').split(';')[0];
  result = await api(`/sessions/${id}/join`, 'POST', undefined, participantCookie);
  assert.equal(result.response.status, 200);
  assert.ok(result.data.session.members.includes(participantEmail));
  assert.ok((await getDatabase().collection('sessions').findOne({ id })).members.includes(participantEmail), 'joined member is persisted');

  result = await api(`/sessions/${id}/join`, 'POST', undefined, participantCookie);
  assert.equal(result.response.status, 409, 'joining twice is rejected');
  result = await api(`/sessions/${id}`, 'DELETE', undefined, participantCookie);
  assert.equal(result.response.status, 403, 'only owner may delete the session');

  result = await api(`/sessions/${id}/leave`, 'POST', undefined, participantCookie);
  assert.equal(result.response.status, 200);
  assert.ok(!result.data.session.members.includes(participantEmail));
  assert.ok(!(await getDatabase().collection('sessions').findOne({ id })).members.includes(participantEmail), 'leaving is persisted');


  result = await api(`/sessions/${id}/messages`, 'POST', { text: 'Hello group!' }, true);
  assert.equal(result.response.status, 201);

  result = await api(`/sessions/${id}/messages`, 'GET', undefined, true);
  assert.equal(result.response.status, 200);
  assert.equal(result.data.messages[0].text, 'Hello group!');

  result = await api(`/sessions/${id}`, 'DELETE', undefined, true);
  assert.equal(result.response.status, 204);
  assert.equal(await getDatabase().collection('sessions').findOne({ id }), null, 'deletion is persisted');


  result = await api('/auth/logout', 'DELETE', undefined, true);
  assert.equal(result.response.status, 204);
  result = await api('/auth/me', 'GET', undefined, true);
  assert.equal(result.response.status, 401, 'logout must invalidate the token');
  assert.equal((await getDatabase().collection('users').findOne({ email })).authTokenHash, undefined);

  result = await api('/auth/login', 'POST', { email, password: 'wrong-password' });
  assert.equal(result.response.status, 401);
  result = await api('/auth/login', 'POST', { email, password });
  assert.equal(result.response.status, 200, 'correct password must work again');
});
