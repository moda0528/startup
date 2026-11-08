// Shared client-side presentation helpers; account/session/chat data lives on Express.
export const COURSES = [
  'CS 235 - Data Structures',
  'CS 260 - Web Programming',
  'MATH 112 - Calculus',
];
export function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function shortCourse(course) {
  return String(course || '').split(' - ')[0];
}
export function displayDate(date) {
  if (!date) return 'Date not set';
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}
