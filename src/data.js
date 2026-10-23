// Temporary browser-only data until the service and database deliverables.
export const COURSES = [
  'CS 235 - Data Structures',
  'CS 260 - Web Programming',
  'MATH 112 - Calculus',
];

export function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function shortCourse(course) {
  return course.split(' - ')[0];
}

export function displayDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function makeInitialState() {
  return {
    user: null,
    accounts: {},
    coursesByUser: {},
    sessions: [
      {
        id: 'sample-235', course: COURSES[0], date: dateAfter(2), time: '18:00',
        location: 'Library', maxStudents: 5,
        members: ['alex@example.com', 'sam@example.com', 'linus@example.com'],
        createdBy: 'alex@example.com',
      },
      {
        id: 'sample-260', course: COURSES[1], date: dateAfter(3), time: '15:00',
        location: 'Talmage Building', maxStudents: 6,
        members: ['alex@example.com', 'sam@example.com', 'linus@example.com', 'annie@example.com'],
        createdBy: 'sam@example.com',
      },
      {
        id: 'sample-math', course: COURSES[2], date: dateAfter(4), time: '17:00',
        location: 'Library', maxStudents: 5,
        members: ['alex@example.com', 'annie@example.com'],
        createdBy: 'annie@example.com',
      },
    ],
    messages: {
      'sample-235': [
        { id: 'initial-1', from: 'Alex', text: 'Are we studying chapter 5?', time: new Date().toISOString() },
        { id: 'initial-2', from: 'Sam', text: "I'll be there!", time: new Date().toISOString() },
      ],
      'sample-260': [
        { id: 'initial-3', from: 'Alex', text: 'Anyone want to review React Router?', time: new Date().toISOString() },
      ],
    },
  };
}

const KEY = 'studymatch-reactivity-v1';

export function loadState() {
  const initial = makeInitialState();
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    if (!stored || !Array.isArray(stored.sessions)) return initial;
    return {
      ...initial,
      ...stored,
      accounts: stored.accounts && typeof stored.accounts === 'object' ? stored.accounts : {},
      coursesByUser: stored.coursesByUser && typeof stored.coursesByUser === 'object' ? stored.coursesByUser : {},
      messages: stored.messages && typeof stored.messages === 'object' ? stored.messages : {},
    };
  } catch {
    return initial;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Could not save StudyMatch demo data', error);
  }
}
