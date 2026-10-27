import { useEffect, useState } from 'react'
import { connect, listQuestions, type Question, type Role } from './api'

/** Live list of a lecture's questions, sorted by position. */
export function useQuestions(lectureId: number, role: Role) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loaded, setLoaded] = useState(false)
  const [live, setLive] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    const socket = connect(role)
    const upsert = (q: Question) =>
      setQuestions((list) =>
        [...list.filter((x) => x.id !== q.id), q].sort((a, b) => a.position - b.position),
      )

    // Runs on every (re)connect: join the room, then reload so nothing missed while offline is lost.
    socket.on('connect', () => {
      setLive(true)
      socket.emit('join', { lectureId, role: role === 'admin' ? 'mod' : 'spk' })
      listQuestions(role, lectureId)
        .then((qs) => {
          setQuestions(qs)
          setLoaded(true)
          setError(undefined)
        })
        .catch((e: Error) => setError(e.message))
    })
    socket.on('disconnect', () => setLive(false))
    socket.on('connect_error', () => setLive(false))
    socket.on('question:new', upsert)
    socket.on('question:update', upsert)
    return () => {
      socket.close()
    }
  }, [lectureId, role])

  return { questions, loaded, live, error }
}

/** Runs one update per question at a time and keeps the last failure for display. */
export function useAction<P>(run: (id: number, patch: P) => Promise<unknown>) {
  const [busy, setBusy] = useState<number[]>([])
  const [failure, setFailure] = useState<string>()

  const act = (id: number, patch: P) => {
    if (busy.includes(id)) return
    setBusy((b) => [...b, id])
    setFailure(undefined)
    run(id, patch)
      .catch((e: Error) => setFailure(`Couldn't update the question: ${e.message}`))
      .finally(() => setBusy((b) => b.filter((x) => x !== id)))
  }

  return { act, busy, failure }
}

export const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

// WordPress stores local conference time with a +00:00 suffix, so lecture times format in UTC.
export const wpTime = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString(undefined, { ...opts, timeZone: 'UTC' })
export const hours = (iso: string) => wpTime(iso, { hour: '2-digit', minute: '2-digit' })
