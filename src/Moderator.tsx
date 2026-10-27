import { updateQuestion, type Question, type Status } from './api'
import { clock, useAction, useQuestions } from './useQuestions'

/** Position halfway into the gap the question moves to (one row update per move). */
function positionFor(list: Question[], i: number, dir: -1 | 1) {
  const near = list[i + dir]
  const far = list[i + 2 * dir]
  return ((far ? far.position : near.position + dir * 2) + near.position) / 2
}

export function Moderator({ lectureId }: { lectureId: number }) {
  const { questions, loaded, live, error } = useQuestions(lectureId, 'admin')
  const { act, busy, failure } = useAction((id, patch: { status?: Status; position?: number }) =>
    updateQuestion('admin', id, patch),
  )
  const pending = questions.filter((q) => q.status === 'pending')
  const approved = questions.filter((q) => q.status === 'approved')
  const done = questions
    .filter((q) => q.status === 'answered' || q.status === 'rejected')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <LiveStatus live={live} error={error ?? failure} />
      <div className="columns">
        <section className="lane lane-incoming">
          <h2>
            Incoming <span className="count">{pending.length}</span>
          </h2>
          {loaded && pending.length === 0 && (
            <p className="empty">New questions from the app appear here.</p>
          )}
          {pending.map((q) => (
            <article key={q.id} className="question">
              <p className="q-text">{q.text}</p>
              <p className="q-meta">
                {q.name}, {clock(q.createdAt)}
              </p>
              <div className="actions">
                <button
                  className="primary"
                  disabled={busy.includes(q.id)}
                  onClick={() => act(q.id, { status: 'approved' })}
                >
                  Send to speaker
                </button>
                <button
                  className="quiet"
                  disabled={busy.includes(q.id)}
                  onClick={() => act(q.id, { status: 'rejected' })}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className="lane lane-queue">
          <h2>
            Speaker's queue <span className="count">{approved.length}</span>
          </h2>
          {loaded && approved.length === 0 && (
            <p className="empty">Questions you send to the speaker line up here, in this order.</p>
          )}
          <ol className="queue">
            {approved.map((q, i) => (
              <li key={q.id} className="question">
                <span className="rank">{i + 1}</span>
                <div>
                  <p className="q-text">{q.text}</p>
                  <p className="q-meta">
                    {q.name}, {clock(q.createdAt)}
                  </p>
                </div>
                <div className="reorder">
                  <button
                    className="icon"
                    title="Move up"
                    aria-label="Move up"
                    disabled={i === 0 || busy.includes(q.id)}
                    onClick={() => act(q.id, { position: positionFor(approved, i, -1) })}
                  >
                    ▲
                  </button>
                  <button
                    className="icon"
                    title="Move down"
                    aria-label="Move down"
                    disabled={i === approved.length - 1 || busy.includes(q.id)}
                    onClick={() => act(q.id, { position: positionFor(approved, i, 1) })}
                  >
                    ▼
                  </button>
                  <button
                    className="icon"
                    title="Take back to incoming"
                    aria-label="Take back to incoming"
                    disabled={busy.includes(q.id)}
                    onClick={() => act(q.id, { status: 'pending' })}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {done.length > 0 && (
        <details className="done">
          <summary>
            Answered and rejected <span className="count">{done.length}</span>
          </summary>
          <ul>
            {done.map((q) => (
              <li key={q.id} className={`done-row is-${q.status}`}>
                <span className="tag">{q.status === 'answered' ? 'Answered' : 'Rejected'}</span>
                <span className="done-text">{q.text}</span>
                <button
                  className="quiet"
                  disabled={busy.includes(q.id)}
                  onClick={() => act(q.id, { status: 'pending' })}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}

export function LiveStatus({ live, error }: { live: boolean; error?: string }) {
  return (
    <div className="status" role="status">
      <span className={live ? 'dot live' : 'dot'} />
      {live ? 'Live' : 'Reconnecting…'}
      {error && <span className="error">{error}</span>}
    </div>
  )
}
