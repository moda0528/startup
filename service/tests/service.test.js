const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index.js');

let server;
let origin;
let cookie;

before(async () => {
  server = await new Promise((resolve) => {
    const running = app.listen(0, '127.0.0.1', () => resolve(running));
  });
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function api(path, method = 'GET', body, authenticated = false) {
  const response = await fetch(origin + '/api' + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(authenticated ? { Cookie: cookie } : {}) },
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

  const email = `learner-${Date.now()}@example.com`;
  const password = 'Test-Password-2026!';
  result = await api('/auth/create', 'POST', { email, name: 'Learner', password });
  assert.equal(result.response.status, 201);
  assert.equal(result.data.user.email, email);
  assert.equal(Object.hasOwn(result.data.user, 'passwordHash'), false);
  cookie = result.response.headers.get('set-cookie').split(';')[0];
  assert.match(result.response.headers.get('set-cookie'), /httponly/i);

  result = await api('/auth/me', 'GET', undefined, true);
  assert.equal(result.response.status, 200);
  assert.equal(result.data.user.name, 'Learner');

  result = await api('/courses', 'POST', { course: 'CS 235' }, true);
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.data.courses, ['CS 235']);

  result = await api('/sessions', 'POST', {
    course: 'CS 235', date: '2099-01-01', time: '15:00', location: 'Library', maxStudents: 5,
  }, true);
  assert.equal(result.response.status, 201);
  const id = result.data.session.id;
  assert.ok(id);

  result = await api(`/sessions/${id}/messages`, 'POST', { text: 'Hello group!' }, true);
  assert.equal(result.response.status, 201);

  result = await api(`/sessions/${id}/messages`, 'GET', undefined, true);
  assert.equal(result.response.status, 200);
  assert.equal(result.data.messages[0].text, 'Hello group!');

  result = await api('/auth/logout', 'DELETE', undefined, true);
  assert.equal(result.response.status, 204);
  result = await api('/auth/me', 'GET', undefined, true);
  assert.equal(result.response.status, 401, 'logout must invalidate the token');

  result = await api('/auth/login', 'POST', { email, password: 'wrong-password' });
  assert.equal(result.response.status, 401);
  result = await api('/auth/login', 'POST', { email, password });
  assert.equal(result.response.status, 200, 'correct password must work again');
});
