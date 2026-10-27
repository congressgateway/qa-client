import { useState, type FormEvent } from 'react'
import { login, setSession, type Role } from './api'

const FIELDS: Record<Role, { title: string; user: string; userType: string }> = {
  admin: { title: 'Moderator login', user: 'Username', userType: 'text' },
  speaker: { title: 'Speaker login', user: 'Speaker ID', userType: 'number' },
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
        <h1>{f.title}</h1>
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
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
