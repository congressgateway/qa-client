import { updateQuestion, type Question } from './api'
import { useQuestions } from './useQuestions'

/** Position halfway into the gap the question moves to (one row update per move). */
function positionFor(list: Question[], i: number, dir: -1 | 1) {
  const near = list[i + dir]
  const far = list[i + 2 * dir]
  return ((far ? far.position : near.position + dir * 2) + near.position) / 2
}

export function Moderator({ lectureId }: { lectureId: number }) {
  const { questions, error } = useQuestions(lectureId, 'admin')
  const pending = questions.filter((q) => q.status === 'pending')
  const approved = questions.filter((q) => q.status === 'approved')
  const set = (q: Question, patch: Parameters<typeof updateQuestion>[2]) =>
    void updateQuestion('admin', q.id, patch).catch(console.error)

  return (
    <>
      {error && <p className="error">{error}</p>}
      <div className="columns">
        <section>
          <h2>Incoming ({pending.length})</h2>
          {pending.length === 0 && <p className="empty">No new questions.</p>}
          {pending.map((q) => (
            <article key={q.id}>
              <p>{q.text}</p>
              <small>{q.name}</small>
              <div className="actions">
                <button className="primary" onClick={() => set(q, { status: 'approved' })}>
                  Approve
                </button>
                <button onClick={() => set(q, { status: 'rejected' })}>Reject</button>
              </div>
            </article>
          ))}
        </section>
        <section>
          <h2>Queue for speaker ({approved.length})</h2>
          {approved.length === 0 && <p className="empty">Approve a question to queue it.</p>}
          {approved.map((q, i) => (
            <article key={q.id}>
              <p>
                <b>{i + 1}.</b> {q.text}
              </p>
              <small>{q.name}</small>
              <div className="actions">
                <button
                  disabled={i === 0}
                  aria-label="Move up"
                  onClick={() => set(q, { position: positionFor(approved, i, -1) })}
                >
                  ↑
                </button>
                <button
                  disabled={i === approved.length - 1}
                  aria-label="Move down"
                  onClick={() => set(q, { position: positionFor(approved, i, 1) })}
                >
                  ↓
                </button>
                <button onClick={() => set(q, { status: 'pending' })}>Unqueue</button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </>
  )
}

