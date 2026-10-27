import { useState, type FormEvent } from 'react'
import { login, setSession, type Role } from './api'

const FIELDS: Record<
  Role,
  { title: string; hint: string; user: string; userType: string }
> = {
  admin: {
    title: 'Sign in to moderate',
    hint: 'Use the moderator account the organisers gave you.',
    user: 'Username',
    userType: 'text',
  },
  speaker: {
    title: 'Sign in as a speaker',
    hint: 'Your speaker ID is the number the organisers sent you with your password.',
    user: 'Speaker ID',
    userType: 'number',
  },
}

export function Login({ role, onLogin }: { role: Role; onLogin: () => void }) {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const f = FIELDS[role]

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(undefined)
    try {
      const credentials =
        role === 'admin'
          ? { username: user.trim(), password }
          : { speakerId: Number(user), password }
      setSession(role, await login(role, credentials))
      onLogin()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <main className="login">
      <form onSubmit={submit}>
        <Brand />
        <h1>{f.title}</h1>
        <p className="hint">{f.hint}</p>
        <label>
          {f.user}
          <input
            type={f.userType}
            inputMode={role === 'speaker' ? 'numeric' : undefined}
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}

export function Brand() {
  return (
    <a className="brand" href="/">
      <span className="mark" aria-hidden>
        Q
      </span>
      Conference Q&amp;A
    </a>
  )
}
