import { updateQuestion } from './api'
import { LiveStatus } from './Moderator'
import { useAction, useQuestions } from './useQuestions'

/** Stage view: the current question large enough to read from the lectern, the rest below. */
export function Speaker({ lectureId }: { lectureId: number }) {
  const { questions, loaded, live, error } = useQuestions(lectureId, 'speaker')
  const { act, busy, failure } = useAction((id: number) =>
    updateQuestion('speaker', id, { status: 'answered' }),
  )
  const [now, ...next] = questions.filter((q) => q.status === 'approved')
  const answered = questions.filter((q) => q.status === 'answered').length

  return (
    <div className="speaker">
      <LiveStatus live={live} error={error ?? failure} />
      {loaded && !now && (
        <p className="stage-empty">
          No questions yet. The moderator's picks appear here as they come in.
        </p>
      )}
      {now && (
        <section className="now" key={now.id} aria-live="polite">
          <p className="now-text">{now.text}</p>
          <p className="now-name">{now.name}</p>
          <button
            className="primary big"
            disabled={busy.includes(now.id)}
            onClick={() => act(now.id, undefined)}
          >
            {busy.includes(now.id) ? 'Moving on…' : 'Answered, next question'}
          </button>
        </section>
      )}
      {next.length > 0 && (
        <section className="next">
          <h2>Up next</h2>
          <ol>
            {next.map((q) => (
              <li key={q.id}>
                <p>{q.text}</p>
                <small>{q.name}</small>
              </li>
            ))}
          </ol>
        </section>
      )}
      {answered > 0 && <p className="answered-count">{answered} answered so far</p>}
    </div>
  )
}
