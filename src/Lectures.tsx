import { useEffect, useState } from 'react'
import { listLectures, type Lecture, type Role } from './api'
import { Avatar } from './Login'
import { hours, wpTime } from './useQuestions'

const day = (iso: string) => wpTime(iso, { weekday: 'long', day: 'numeric', month: 'long' })
const dateKey = (iso: string) => iso.slice(0, 10) // "2026-11-04", WordPress local date

/** The browser's wall-clock time on the same fake-UTC scale as WordPress times. */
const wallNow = () => Date.now() - new Date().getTimezoneOffset() * 60_000
const isLive = (l: Lecture) => {
  const now = wallNow()
  return Date.parse(l.from) <= now && now < Date.parse(l.to)
}

const suffix = (n: number) =>
  n >= 11 && n <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'

type Filters = { day?: string; hall?: string }

// Kept per tab so going into a lecture and back keeps the chosen day and hall.
const loadFilters = (role: Role): Filters => {
  try {
    return JSON.parse(sessionStorage.getItem(`qa.filters.${role}`) ?? '{}') as Filters
  } catch {
    return {}
  }
}
const saveFilters = (role: Role, f: Filters) => {
  try {
    sessionStorage.setItem(`qa.filters.${role}`, JSON.stringify(f))
  } catch {
    // storage blocked: filters just reset on navigation
  }
}

/** Lecture picker: every lecture for the moderator, own lectures for a speaker. */
export function Lectures({ role }: { role: Role }) {
  const [lectures, setLectures] = useState<Lecture[]>()
  const [error, setError] = useState<string>()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(() => loadFilters(role))
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

  // Like the app: one day and one hall are always selected. Default to today, else the first day.
  const days = [...new Set(lectures.map((l) => dateKey(l.from)))].sort()
  const halls = [...new Set(lectures.map((l) => l.location).filter(Boolean))].sort()
  const today = new Date(wallNow()).toISOString().slice(0, 10)
  const selDay = days.includes(filters.day ?? '')
    ? filters.day!
    : days.includes(today)
      ? today
      : days[0]
  const selHall = halls.includes(filters.hall ?? '') ? filters.hall! : halls[0]
  const choose = (f: Filters) => {
    const next = { day: selDay, hall: selHall, ...f }
    setFilters(next)
    saveFilters(role, next)
  }

  // A search looks across the whole conference; otherwise show the chosen day and hall.
  const q = search.trim().toLowerCase()
  const shown = q
    ? lectures.filter((l) =>
        [l.title, l.location, l.session, ...l.speakers.map((s) => s.name)]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    : lectures.filter(
        (l) => dateKey(l.from) === selDay && (!selHall || l.location === selHall),
      )
  const byDay = new Map<string, Lecture[]>()
  for (const l of shown) byDay.set(day(l.from), [...(byDay.get(day(l.from)) ?? []), l])

  return (
    <>
      <div className="filters" aria-disabled={!!q}>
        {days.length > 1 && (
          <div className="filter-row" role="group" aria-label="Day">
            <span className="filter-label">Day</span>
            <div className="chips">
              {days.map((d) => {
                const n = Number(d.slice(8))
                return (
                  <button
                    key={d}
                    className="chip chip-day"
                    aria-pressed={d === selDay}
                    title={day(`${d}T00:00:00+00:00`)}
                    onClick={() => choose({ day: d })}
                  >
                    {n}
                    <small>{suffix(n)}</small>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {halls.length > 1 && (
          <div className="filter-row" role="group" aria-label="Hall">
            <span className="filter-label">Hall</span>
            <div className="chips">
              {halls.map((h) => (
                <button
                  key={h}
                  className="chip"
                  aria-pressed={h === selHall}
                  onClick={() => choose({ hall: h })}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {role === 'admin' && (
        <input
          className="search"
          type="search"
          placeholder="Or search every day: lecture, hall or speaker"
          aria-label="Search all lectures"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {shown.length === 0 && (
        <p className="empty">
          {q ? `Nothing matches “${search}”.` : 'No lectures in this hall on this day.'}
        </p>
      )}
      {[...byDay].map(([d, ls]) => (
        <section key={d} className="day">
          <h2>
            {d}
            {!q && selHall && `, ${selHall}`}
          </h2>
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
                    {l.speakers.length > 0 && (
                      <span className="lecture-speakers">
                        {l.speakers.map((s) => (
                          <span key={s.id}>
                            <Avatar name={s.name} src={s.image} size={26} />
                            {s.name}
                          </span>
                        ))}
                      </span>
                    )}
                    {q && l.location && <span className="lecture-meta">{l.location}</span>}
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
