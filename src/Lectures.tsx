import { useEffect, useState } from 'react'
import { listLectures, type Lecture, type Role } from './api'
import { hours, wpTime } from './useQuestions'

const day = (iso: string) => wpTime(iso, { weekday: 'long', day: 'numeric', month: 'long' })

/** The browser's wall-clock time on the same fake-UTC scale as WordPress times. */
const wallNow = () => Date.now() - new Date().getTimezoneOffset() * 60_000
const isLive = (l: Lecture) => {
  const now = wallNow()
  return Date.parse(l.from) <= now && now < Date.parse(l.to)
}

/** Lecture picker: every lecture for the moderator, own lectures for a speaker. */
export function Lectures({ role }: { role: Role }) {
  const [lectures, setLectures] = useState<Lecture[]>()
  const [error, setError] = useState<string>()
  const [filter, setFilter] = useState('')
  const base = role === 'admin' ? '/moderate' : '/speaker'

  useEffect(() => {
    listLectures(role)
      .then(setLectures)
      .catch((e: Error) => setError(e.message))
  }, [role])

  if (error) return <p className="error">Couldn't load the timetable: {error}</p>
  if (!lectures) return <p className="empty">Loading the timetable…</p>
  if (lectures.length === 0) {
    return (
      <p className="empty">
        You aren't listed as a speaker on any lecture yet. If that's wrong, ask the organisers to
        add you in the timetable, then sign in again.
      </p>
    )
  }

  const q = filter.trim().toLowerCase()
  const shown = lectures.filter((l) =>
    [l.title, l.location, l.session, ...l.speakers.map((s) => s.name)]
      .join(' ')
      .toLowerCase()
      .includes(q),
  )
  const days = new Map<string, Lecture[]>()
  for (const l of shown) days.set(day(l.from), [...(days.get(day(l.from)) ?? []), l])

  return (
    <>
      {role === 'admin' && (
        <input
          className="search"
          type="search"
          placeholder="Find a lecture, hall or speaker"
          aria-label="Find a lecture"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      )}
      {shown.length === 0 && <p className="empty">Nothing matches “{filter}”.</p>}
      {[...days].map(([d, ls]) => (
        <section key={d} className="day">
          <h2>{d}</h2>
          <ul className="lectures">
            {ls.map((l) => (
              <li key={l.id} className={isLive(l) ? 'is-live' : undefined}>
                <a href={`${base}/${l.id}`}>
                  <span className="slot">
                    {hours(l.from)}
                    <small>{hours(l.to)}</small>
                  </span>
                  <span className="lecture-body">
                    <span className="lecture-title">{l.title}</span>
                    <span className="lecture-meta">
                      {l.location && <span>{l.location}</span>}
                      {l.speakers.length > 0 && (
                        <span>{l.speakers.map((s) => s.name).join(', ')}</span>
                      )}
                    </span>
                  </span>
                  <span className="badges">
                    {isLive(l) && <span className="badge live">On now</span>}
                    {role === 'admin' && l.pending > 0 && (
                      <span className="badge new">{l.pending} new</span>
                    )}
                    {role === 'admin' && l.approved > 0 && (
                      <span className="badge">{l.approved} queued</span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
