import { useEffect, useState } from 'react'
import { getSession, listLectures, setSession, type Lecture, type Role } from './api'
import { Lectures } from './Lectures'
import { Login } from './Login'
import { Moderator } from './Moderator'
import { Speaker } from './Speaker'

// Routes: /moderate, /moderate/:lectureId, /speaker, /speaker/:lectureId
export default function App() {
  const [, page, id] = location.pathname.split('/')
  const role: Role | null =
    page === 'moderate' ? 'admin' : page === 'speaker' ? 'speaker' : null
  const [session, setCurrent] = useState(() => role && getSession(role))
  const lectureId = Number(id)
  const [lecture, setLecture] = useState<Lecture>()

  useEffect(() => {
    if (!role || !session || !lectureId) return
    listLectures(role)
      .then((ls) => setLecture(ls.find((l) => l.id === lectureId)))
      .catch(console.error)
  }, [role, session, lectureId])

  if (!role) {
    return (
      <main>
        <h1>Conference Q&amp;A</h1>
        <p>
          <a href="/moderate">Moderator</a> · <a href="/speaker">Speaker</a>
        </p>
      </main>
    )
  }
  if (!session) return <Login role={role} onLogin={() => setCurrent(getSession(role))} />

  const base =role === 'admin' ? '/moderate' : '/speaker'
  const logout = () => {
    setSession(role, null)
    setCurrent(null)
  }

  return (
    <main>
      <header className="bar">
        {lectureId ? <a href={base}>← All lectures</a> : <span />}
        <span>
          {session.name} · <button onClick={logout}>Log out</button>
        </span>
      </header>
      <h1>
        {role === 'admin' ? 'Moderator' : 'Questions'}
        {lectureId ? '' : ' · Lectures'}
      </h1>
      {lecture && (
        <p className="lecture-head">
          <b>{lecture.title}</b>
          <small>
            {lecture.location} · {lecture.speakers.map((s) => s.name).join(', ')}
          </small>
        </p>
      )}
      {!lectureId ? (
        <Lectures role={role} />
      ) : role === 'admin' ? (
        <Moderator lectureId={lectureId} />
      ) : (
        <Speaker lectureId={lectureId} />
      )}
    </main>
  )
}
