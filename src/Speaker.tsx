import { LiveStatus } from './Moderator'
import { useQuestions } from './useQuestions'

/** Read-only stage view: shows whatever question the moderator has put on screen. */
export function Speaker({ lectureId }: { lectureId: number }) {
  const { questions, loaded, live, error } = useQuestions(lectureId, 'speaker')
  const now = questions.find((q) => q.onScreen && q.status === 'approved')

  return (
    <div className="speaker">
      <LiveStatus live={live} error={error} />
      {loaded && !now && (
        <p className="stage-empty">
          No question on screen. The moderator will display the next one here.
        </p>
      )}
      {now && (
        <section className="now" key={now.id} aria-live="polite">
          <p className="now-text">{now.text}</p>
          <p className="now-name">{now.name}</p>
        </section>
      )}
    </div>
  )
}
