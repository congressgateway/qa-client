import { useEffect, useState } from 'react'
import { connect, listQuestions, type Question, type Role } from './api'

/** Live list of a lecture's questions, sorted by position. */
export function useQuestions(lectureId: number, role: Role) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState<string>()

  useEffect(() => {
    const socket = connect(role)
    const upsert = (q: Question) =>
      setQuestions((list) =>
        [...list.filter((x) => x.id !== q.id), q].sort((a, b) => a.position - b.position),
      )

    // Runs on every (re)connect: join the room, then reload so nothing missed while offline is lost.
    socket.on('connect', () => {
      socket.emit('join', { lectureId, role: role === 'admin' ? 'mod' : 'spk' })
      listQuestions(role, lectureId)
        .then((qs) => {
          setQuestions(qs)
          setError(undefined)
        })
        .catch((e: Error) => setError(e.message))
    })
    socket.on('disconnect', () => setError('Disconnected, reconnecting…'))
    socket.on('question:new', upsert)
    socket.on('question:update', upsert)
    return () => {
      socket.close()
    }
  }, [lectureId, role])

  return { questions, error }
}
