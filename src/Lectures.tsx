import { useEffect, useState } from 'react'
import { listLectures, type Lecture, type Role } from './api'

const time = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC', // WordPress stores local conference time with a +00:00 suffix
  })

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

  if (error) return <p className="error">{error}</p>
  if (!lectures) return <p className="empty">Loading lectures…</p>
  if (lectures.length === 0) {
    return <p className="empty">No lectures are assigned to you in the timetable.</p>
  }

  const q = filter.trim().toLowerCase()
  const shown = lectures.filter((l) =>
    [l.title, l.location, l.session, ...l.speakers.map((s) => s.name)]
      .join(' ')
      .toLowerCase()
      .includes(q),
  )

  return (
    <>
      {role === 'admin' && (
        <input
          className="search"
          type="search"
          placeholder="Search lecture, hall or speaker"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      )}
      <ul className="lectures">
        {shown.map((l) => (
          <li key={l.id}>
            <a href={`${base}/${l.id}`}>
              <span className="lecture-title">{l.title}</span>
              <small>
                {time(l.from)} · {l.location} · {l.speakers.map((s) => s.name).join(', ')}
              </small>
              {role === 'admin' && (l.pending > 0 || l.approved > 0) && (
                <span className="badges">
                  {l.pending > 0 && <span className="badge new">{l.pending} new</span>}
                  {l.approved > 0 && <span className="badge">{l.approved} queued</span>}
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}
