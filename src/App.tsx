import { useEffect, useState } from 'react'
import { getSession, listLectures, setSession, type Lecture, type Role } from './api'
import { Lectures } from './Lectures'
import { hours } from './useQuestions'
import { Avatar, Login, TopBar } from './Login'
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

  useEffect(() => {
    document.title = lecture ? `${lecture.title} | Q&A` : 'Conference Q&A'
  }, [lecture])

  if (!role) {
    return (
      <main className="home">
        <TopBar />
        <h1>Questions from the hall, straight to the stage.</h1>
        <div className="doors">
          <a href="/moderate">
            <b>I'm moderating</b>
            <span>Review questions from the app and choose what the speaker sees.</span>
          </a>
          <a href="/speaker">
            <b>I'm speaking</b>
            <span>See the questions picked for your lecture, one at a time.</span>
          </a>
        </div>
      </main>
    )
  }
  if (!session) return <Login role={role} onLogin={() => setCurrent(getSession(role))} />

  const base = role === 'admin' ? '/moderate' : '/speaker'
  const logout = () => {
    setSession(role, null)
    setCurrent(null)
  }

  return (
    <main className={lectureId && role === 'speaker' ? 'stage' : undefined}>
      <TopBar>
        <span className="who">
          {role === 'speaker' && <Avatar name={session.name} src={session.image} size={40} />}
          <span className="who-text">
            <span>{session.name}</span>
            <button className="quiet small" onClick={logout}>
              Sign out
            </button>
          </span>
        </span>
      </TopBar>
      {lectureId ? (
        <>
          <a className="back" href={base}>
            All lectures
          </a>
          <div className="lecture-head">
            <h1>{lecture?.title ?? 'Lecture'}</h1>
            {lecture && (
              <p className="lecture-meta">
                <span>
                  {hours(lecture.from)} to {hours(lecture.to)}
                </span>
                {lecture.location && <span>{lecture.location}</span>}
              </p>
            )}
            {lecture && lecture.speakers.length > 0 && (
              <div className="lecture-speakers head-speakers">
                {lecture.speakers.map((s) => (
                  <span key={s.id}>
                    <Avatar
                      name={s.name}
                      src={s.image}
                      size={role === 'speaker' ? 128 : 36}
                      ring={role === 'speaker'}
                    />
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          {role === 'admin' ? (
            <Moderator lectureId={lectureId} />
          ) : (
            <Speaker lectureId={lectureId} />
          )}
        </>
      ) : (
        <>
          {role === 'admin' ? (
            <h1>Pick a lecture to moderate</h1>
          ) : (
            <div className="welcome">
              <Avatar name={session.name} src={session.image} size={96} ring />
              <div>
                <p className="welcome-hello">Welcome,</p>
                <h1>{session.name}</h1>
                <p className="hint">Open your lecture to see the questions the moderator puts on screen.</p>
              </div>
            </div>
          )}
          <Lectures role={role} />
        </>
      )}
    </main>
  )
}
