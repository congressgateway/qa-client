import { io } from 'socket.io-client'

export const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export type Status = 'pending' | 'approved' | 'rejected' | 'answered'
export type Role = 'admin' | 'speaker'

export type Question = {
  id: number
  lectureId: number
  name: string
  text: string
  status: Status
  position: number
  createdAt: string
  onScreen: boolean
  displayedAt: string | null
}

export type Lecture = {
  id: number
  title: string
  from: string
  to: string
  location: string
  session: string
  speakers: Speaker[]
  pending: number
  approved: number
}

export type Session = { token: string; name: string; image?: string }

// Admin and speaker logins are kept separately so one browser can test both.
const storageKey = (role: Role) => `qa.${role}`

export function getSession(role: Role): Session | null {
  try {
    return JSON.parse(localStorage.getItem(storageKey(role)) ?? 'null') as Session | null
  } catch {
    return null
  }
}

export function setSession(role: Role, session: Session | null) {
  try {
    if (session) localStorage.setItem(storageKey(role), JSON.stringify(session))
    else localStorage.removeItem(storageKey(role))
  } catch {
    // storage blocked: the login just won't survive a reload
  }
}

async function request<T>(role: Role | null, path: string, init: RequestInit = {}) {
  const token = role && getSession(role)?.token
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token && { authorization: `Bearer ${token}` }),
    },
  })
  const body = (await res.json().catch(() => null)) as { message?: string } | null
  if (res.status === 401 && role && token) {
    setSession(role, null) // expired or invalid: back to the login form
    location.reload()
  }
  if (!res.ok) throw new Error(body?.message ?? `HTTP ${res.status}`)
  return body as T
}

export const login = (role: Role, credentials: Record<string, unknown>) =>
  request<Session>(null, `/auth/${role}`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

export type Speaker = { id: number; name: string; image: string }

export const listSpeakers = () => request<Speaker[]>(null, '/speakers')

export const listLectures = (role: Role) => request<Lecture[]>(role, '/lectures')

export const listQuestions = (role: Role, lectureId: number) =>
  request<Question[]>(role, `/lectures/${lectureId}/questions`)

export const updateQuestion = (
  role: Role,
  id: number,
  patch: { status?: Status; position?: number },
) =>
  request<Question>(role, `/questions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })

export const displayQuestion = (id: number) =>
  request<Question>('admin', `/questions/${id}/display`, { method: 'POST' })

export const connect = (role: Role) =>
  io(API, { auth: { token: getSession(role)?.token } })
