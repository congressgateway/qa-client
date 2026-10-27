import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { listSpeakers, login, setSession, type Role, type Speaker } from './api'

export function Login({ role, onLogin }: { role: Role; onLogin: () => void }) {
  const [speaker, setSpeaker] = useState<Speaker>()

  if (role === 'speaker' && !speaker) return <SpeakerPicker onPick={setSpeaker} />
  return (
    <PasswordForm
      role={role}
      speaker={speaker}
      onBack={() => setSpeaker(undefined)}
      onLogin={onLogin}
    />
  )
}

/** Step 1 for speakers: find your name in the timetable. */
function SpeakerPicker({ onPick }: { onPick: (s: Speaker) => void }) {
  const [speakers, setSpeakers] = useState<Speaker[]>()
  const [error, setError] = useState<string>()
  const [filter, setFilter] = useState('')

  useEffect(() => {
    listSpeakers()
      .then(setSpeakers)
      .catch((e: Error) => setError(e.message))
  }, [])

  const q = filter.trim().toLowerCase()
  const shown = speakers?.filter((s) => s.name.toLowerCase().includes(q))

  return (
    <main className="login">
      <TopBar />
      <div className="card">
        <h1>Who's speaking?</h1>
        <p className="hint">Choose your name from the conference timetable.</p>
        <input
          type="search"
          placeholder="Search by name"
          aria-label="Search by name"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          autoFocus
        />
        {error && (
          <p className="error" role="alert">
            Couldn't load the speaker list: {error}
          </p>
        )}
        {!speakers && !error && <p className="hint">Loading speakers…</p>}
        {shown && (
          <ul className="picker">
            {shown.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => onPick(s)}>
                  <Avatar name={s.name} src={s.image} size={40} />
                  {s.name}
                </button>
              </li>
            ))}
            {shown.length === 0 && <li className="hint">No speaker matches “{filter}”.</li>}
          </ul>
        )}
      </div>
    </main>
  )
}

function PasswordForm({
  role,
  speaker,
  onBack,
  onLogin,
}: {
  role: Role
  speaker?: Speaker
  onBack: () => void
  onLogin: () => void
}) {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(undefined)
    try {
      const credentials = speaker
        ? { speakerId: speaker.id, password }
        : { username: user.trim(), password }
      setSession(role, await login(role, credentials))
      onLogin()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <main className="login">
      <TopBar />
      <form className="card" onSubmit={submit}>
        {speaker ? (
          <>
            <Avatar name={speaker.name} src={speaker.image} size={112} ring />
            <h1 className="center">{speaker.name}</h1>
            <p className="hint center">
              Not you?{' '}
              <button type="button" className="link" onClick={onBack}>
                Choose another name
              </button>
            </p>
          </>
        ) : (
          <>
            <h1>Sign in to moderate</h1>
            <p className="hint">Use the moderator account the organisers gave you.</p>
            <label>
              Username
              <input
                value={user}
                onChange={(e) => setUser(e.target.value)}
                autoComplete="username"
                required
                autoFocus
              />
            </label>
          </>
        )}
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            autoFocus={!!speaker}
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

/** Round speaker photo; falls back to initials when there's no photo or it fails to load. */
export function Avatar({
  name,
  src,
  size,
  ring,
}: {
  name: string
  src?: string
  size: number
  ring?: boolean
}) {
  const [broken, setBroken] = useState(false)
  const initials = name
    .replace(/^((Prof|Dr|Assoc|Assist|Mr|Mrs|Ms)\.?\s+)+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
  return (
    <span
      className={ring ? 'avatar ring' : 'avatar'}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {src && !broken ? (
        <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} />
      ) : (
        initials
      )}
    </span>
  )
}

/** Conference logo on the left, partner logo on the right, anything else in between. */
export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="bar">
      <a href="/" aria-label="Conference Q&A home">
        <img src="/Asset-1.svg" alt="Conference logo" className="logo-left" />
      </a>
      <span className="bar-end">
        {children}
        <img src="/Asset-2.svg" alt="Partner logo" className="logo-right" />
      </span>
    </header>
  )
}
