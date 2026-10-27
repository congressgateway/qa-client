import { updateQuestion } from './api'
import { useQuestions } from './useQuestions'

export function Speaker({ lectureId }: { lectureId: number }) {
  const { questions, error } = useQuestions(lectureId, 'speaker')
  const queue = questions.filter((q) => q.status === 'approved')

  return (
    <div className="speaker">
      {error && <p className="error">{error}</p>}
      {queue.length === 0 && <p className="empty">No questions yet.</p>}
      <ol>
        {queue.map((q) => (
          <li key={q.id}>
            <p>{q.text}</p>
            <small>{q.name}</small>
            <button
              className="primary"
              onClick={() =>
                void updateQuestion('speaker', q.id, { status: 'answered' }).catch(console.error)
              }
            >
              Answered
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
