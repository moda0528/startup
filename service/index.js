// StudyMatch HTTP service. Accounts, courses, login tokens, study sessions
// and chat messages are stored in MongoDB.
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const path = require('node:path');
const { connectDatabase } = require('./database');
const userStore = require('./userStore');
const sessionStore = require('./sessionStore');
const messageStore = require('./messageStore');

const app = express();
const port = Number(process.argv[2] || process.env.PORT || 4000);
const TOKEN_COOKIE = 'studymatchToken';

function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const exampleSessions = [
  { id: 'sample-235', course: 'CS 235 - Data Structures', date: dateAfter(2), time: '18:00', location: 'Library', maxStudents: 5, members: ['alex@example.com', 'sam@example.com', 'linus@example.com'], createdBy: 'alex@example.com' },
  { id: 'sample-260', course: 'CS 260 - Web Programming', date: dateAfter(3), time: '15:00', location: 'Talmage Building', maxStudents: 6, members: ['alex@example.com', 'sam@example.com', 'linus@example.com', 'annie@example.com'], createdBy: 'sam@example.com' },
  { id: 'sample-math', course: 'MATH 112 - Calculus', date: dateAfter(4), time: '17:00', location: 'Library', maxStudents: 5, members: ['alex@example.com', 'annie@example.com'], createdBy: 'annie@example.com' },
];
const exampleMessages = {
  'sample-235': [
    { id: 'intro-1', from: 'Alex', text: 'Are we studying chapter 5?', time: new Date().toISOString() },
    { id: 'intro-2', from: 'Sam', text: "I'll be there!", time: new Date().toISOString() },
  ],
  'sample-260': [
    { id: 'intro-3', from: 'Alex', text: 'Anyone want to review React Router?', time: new Date().toISOString() },
  ],
};

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const api = express.Router();
app.use('/api', api);

function publicUser(user) {
  return { name: user.name, email: user.email };
}
function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}
function secureCookie(req) {
  return req.secure || req.get('x-forwarded-proto') === 'https';
}
const LOGIN_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
async function createToken(req, res, user) {
  const token = crypto.randomBytes(32).toString('hex');
  await userStore.storeLogin(user.email, hashToken(token), new Date(Date.now() + LOGIN_DURATION_MS));
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true, secure: secureCookie(req), sameSite: 'lax',
    maxAge: LOGIN_DURATION_MS, path: '/',
  });
}
async function findAuthenticatedUser(req) {
  const token = req.cookies?.[TOKEN_COOKIE];
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return null;
  return userStore.findByTokenHash(hashToken(token));
}
async function requireAuth(req, res, next) {
  try {
    const user = await findAuthenticatedUser(req);
    if (!user) return res.status(401).json({ msg: 'Please log in first.' });
    req.user = user;
    next();
  } catch (error) { next(error); }
}
function inSession(session, email) {
  return session && session.members.includes(email);
}
function validText(value, max) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
}
async function sessionFromRequest(req, res) {
  const session = await sessionStore.getSession(req.params.id);
  if (!session) res.status(404).json({ msg: 'Study session not found.' });
  return session;
}

api.get('/health', (_req, res) => res.json({ status: 'ok', service: 'StudyMatch' }));

api.post('/auth/create', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const { name, password } = req.body || {};
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || !validText(name, 60) || typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ msg: 'Enter a name, valid email, and password with 8–128 characters.' });
    }
    if (await userStore.findByEmail(email)) return res.status(409).json({ msg: 'An account with this email already exists.' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = { email, name: name.trim(), passwordHash, courses: [] };
    try {
      await userStore.insertUser(user);
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ msg: 'An account with this email already exists.' });
      throw error;
    }
    await createToken(req, res, user);
    res.status(201).json({ user: publicUser(user), courses: user.courses });
  } catch (error) { next(error); }
});

api.post('/auth/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const user = await userStore.findByEmail(email);
    if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ msg: 'Incorrect email or password.' });
    }
    await createToken(req, res, user);
    res.json({ user: publicUser(user), courses: user.courses });
  } catch (error) { next(error); }
});

api.get('/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user), courses: req.user.courses || [] });
});

api.delete('/auth/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.[TOKEN_COOKIE];
    if (typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)) {
      await userStore.clearLogin(hashToken(token));
    }
    res.clearCookie(TOKEN_COOKIE, { path: '/' });
    res.status(204).end();
  } catch (error) { next(error); }
});

api.get('/courses', requireAuth, (req, res) => {
  res.json({ courses: req.user.courses || [] });
});
api.post('/courses', requireAuth, async (req, res, next) => {
  try {
    const course = req.body?.course;
    if (!validText(course, 80)) return res.status(400).json({ msg: 'Enter a valid course name.' });
    const courses = await userStore.addCourse(req.user.email, course.trim().toUpperCase());
    res.json({ courses });
  } catch (error) { next(error); }
});
api.delete('/courses/:course', requireAuth, async (req, res, next) => {
  try {
    const courses = await userStore.removeCourse(req.user.email, req.params.course);
    res.json({ courses });
  } catch (error) { next(error); }
});

api.get('/sessions', async (_req, res, next) => {
  try { res.json({ sessions: await sessionStore.listSessions() }); }
  catch (error) { next(error); }
});
api.get('/sessions/mine', requireAuth, async (req, res, next) => {
  try { res.json({ sessions: await sessionStore.listMine(req.user.email) }); }
  catch (error) { next(error); }
});
api.post('/sessions', requireAuth, async (req, res, next) => {
  try {
    const { course, date, time, location, maxStudents } = req.body || {};
    if (!validText(course, 80) || !validText(location, 100) ||
        typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < dateAfter(0) ||
        typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
        !Number.isInteger(Number(maxStudents)) || Number(maxStudents) < 2 || Number(maxStudents) > 10) {
      return res.status(400).json({ msg: 'Complete all session fields with a valid future date and group size (2–10).' });
    }
    const session = {
      id: crypto.randomUUID(), course: course.trim(), date, time, location: location.trim(),
      maxStudents: Number(maxStudents), members: [req.user.email], createdBy: req.user.email,
    };
    await sessionStore.createSession(session);
    res.status(201).json({ session });
  } catch (error) { next(error); }
});
api.post('/sessions/:id/join', requireAuth, async (req, res, next) => {
  try {
    const session = await sessionFromRequest(req, res);
    if (!session) return;
    if (inSession(session, req.user.email)) return res.status(409).json({ msg: 'You are already in this session.' });
    if (session.members.length >= session.maxStudents) return res.status(409).json({ msg: 'This session is full.' });
    // MongoDB update is atomic to prevent overfilling a session with concurrent joins.
    const updated = await sessionStore.joinSession(session.id, req.user.email);
    if (!updated) return res.status(409).json({ msg: 'This session is full or you already joined.' });
    res.json({ session: updated });
  } catch (error) { next(error); }
});
api.post('/sessions/:id/leave', requireAuth, async (req, res, next) => {
  try {
    const session = await sessionFromRequest(req, res);
    if (!session) return;
    if (!inSession(session, req.user.email)) return res.status(403).json({ msg: 'You are not part of this session.' });
    if (session.createdBy === req.user.email) return res.status(400).json({ msg: 'The owner must delete the session instead.' });
    const updated = await sessionStore.leaveSession(session.id, req.user.email);
    if (!updated) return res.status(409).json({ msg: 'Unable to leave this session. Please retry.' });
    res.json({ session: updated });
  } catch (error) { next(error); }
});
api.delete('/sessions/:id', requireAuth, async (req, res, next) => {
  try {
    const session = await sessionFromRequest(req, res);
    if (!session) return;
    if (session.createdBy !== req.user.email) return res.status(403).json({ msg: 'Only the session creator can delete it.' });
    const removed = await sessionStore.deleteSession(session.id, req.user.email);
    if (!removed) return res.status(404).json({ msg: 'Study session not found.' });
    await messageStore.deleteForSession(session.id);
    res.status(204).end();
  } catch (error) { next(error); }
});

api.get('/sessions/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const session = await sessionFromRequest(req, res);
    if (!session) return;
    if (!inSession(session, req.user.email)) return res.status(403).json({ msg: 'Join this session to read its chat.' });
    res.json({ messages: await messageStore.listMessages(session.id) });
  } catch (error) { next(error); }
});
api.post('/sessions/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const session = await sessionFromRequest(req, res);
    if (!session) return;
    if (!inSession(session, req.user.email)) return res.status(403).json({ msg: 'Join this session to send messages.' });
    const text = req.body?.text;
    if (!validText(text, 500)) return res.status(400).json({ msg: 'Message must be between 1 and 500 characters.' });
    const message = { id: crypto.randomUUID(), from: req.user.email, text: text.trim(), time: new Date().toISOString() };
    await messageStore.addMessage(session.id, message);
    res.status(201).json({ message });
  } catch (error) { next(error); }
});

// Unknown API routes should never return the React index.html page.
api.use((_req, res) => res.status(404).json({ msg: 'API endpoint not found.' }));
app.use((err, _req, res, _next) => {
  console.error('Service error:', err);
  res.status(500).json({ msg: 'Server error. Please try again.' });
});

// React Router needs index.html for non-API routes on refresh.
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

if (require.main === module) {
  connectDatabase()
    .then(() => userStore.ensureIndexes())
    .then(() => sessionStore.ensureIndexes())
    .then(() => messageStore.ensureIndexes())
    .then(() => sessionStore.seedSamples(exampleSessions))
    .then(() => messageStore.seedSamples(exampleMessages))
    .then(() => app.listen(port, () => console.log(`StudyMatch service listening on port ${port}`)))
    .catch((error) => {
      console.error('Database startup failed:', error.message);
      process.exitCode = 1;
    });
}
module.exports = app;
