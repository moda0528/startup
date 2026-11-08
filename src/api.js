// All StudyMatch backend calls are same-origin. Express owns login cookies.
export async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  let result = null;
  if (response.status !== 204) {
    try { result = await response.json(); } catch { /* report below if needed */ }
  }
  if (!response.ok) throw new Error(result?.msg || `Request failed (HTTP ${response.status})`);
  return result;
}
export function json(method, path, payload) {
  return request(path, { method, body: JSON.stringify(payload) });
}
