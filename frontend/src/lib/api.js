// Thin JSON client for the Laravel API (backend/, Sanctum token auth).
// The token lives in localStorage; a 401 clears it so the app falls back to
// the login screen on the next render.

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const TOKEN_KEY = 'revenue-os.token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message)
    this.status = status
    this.errors = errors // Laravel validation errors, if any
  }
}

async function request(method, path, body) {
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the API — is the backend running?')
  }

  if (res.status === 204) return null

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401) clearToken()
    throw new ApiError(res.status, json?.message || 'Request failed (' + res.status + ')', json?.errors)
  }
  return json
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),

  /** Multipart upload (the browser sets the boundary). Returns parsed JSON. */
  async upload(path, formData) {
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}),
      },
      body: formData,
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      if (res.status === 401) clearToken()
      const err = new ApiError(res.status, json?.message || 'Upload failed (' + res.status + ')', json?.errors)
      err.rows = json?.rows // per-row import errors
      throw err
    }
    return json
  },
}
