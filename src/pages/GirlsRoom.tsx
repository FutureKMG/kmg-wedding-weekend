import { formatDistanceToNow } from 'date-fns'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { PageIntro } from '../components/PageIntro'
import { apiRequest } from '../lib/apiClient'
import { useAuth } from '../lib/auth'
import type { GirlsRoomThread } from '../types'

export function GirlsRoomPage() {
  const { guest } = useAuth()
  const [threads, setThreads] = useState<GirlsRoomThread[]>([])
  const [error, setError] = useState('')
  const [itemDraft, setItemDraft] = useState('')
  const [messageDraft, setMessageDraft] = useState('')
  const [isPostingThread, setIsPostingThread] = useState(false)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({})
  const [postingReplyThreadId, setPostingReplyThreadId] = useState<string | null>(null)

  const canAccess = guest?.canAccessGirlsRoom ?? true

  const loadThreads = useCallback(async () => {
    try {
      const payload = await apiRequest<{ threads: GirlsRoomThread[]; migrationRequired?: boolean }>(
        '/api/girls-room?limit=60',
      )
      if (payload.migrationRequired) {
        setError('Girls Room is not enabled yet. Run the latest Supabase migration.')
        setThreads([])
        return
      }
      setThreads(payload.threads ?? [])
      setError('')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Could not load Girls Room'
      setError(message)
      setThreads([])
    }
  }, [])

  useEffect(() => {
    void loadThreads()
  }, [loadThreads])

  async function handlePostThread(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const item = itemDraft.trim()
    const message = messageDraft.trim()
    if (!item || !message) {
      setError('Please include both the item and what you need.')
      return
    }

    setError('')
    setIsPostingThread(true)

    try {
      await apiRequest('/api/girls-room', {
        method: 'POST',
        body: JSON.stringify({ item, message }),
      })
      setItemDraft('')
      setMessageDraft('')
      await loadThreads()
    } catch (requestError) {
      const messageText = requestError instanceof Error ? requestError.message : 'Could not post thread'
      setError(messageText)
    } finally {
      setIsPostingThread(false)
    }
  }

  async function handlePostReply(event: FormEvent<HTMLFormElement>, threadId: string) {
    event.preventDefault()
    const draft = replyDrafts[threadId]?.trim() ?? ''
    if (!draft) {
      setReplyErrors((current) => ({ ...current, [threadId]: 'Write a quick reply first.' }))
      return
    }

    setReplyErrors((current) => ({ ...current, [threadId]: '' }))
    setPostingReplyThreadId(threadId)

    try {
      await apiRequest('/api/girls-room/reply', {
        method: 'POST',
        body: JSON.stringify({ threadId, message: draft }),
      })
      setReplyDrafts((current) => ({ ...current, [threadId]: '' }))
      await loadThreads()
    } catch (requestError) {
      const messageText = requestError instanceof Error ? requestError.message : 'Could not post reply'
      setReplyErrors((current) => ({ ...current, [threadId]: messageText }))
    } finally {
      setPostingReplyThreadId(null)
    }
  }

  return (
    <section className="stack girls-room-page">
      <PageIntro
        eyebrow="Girls Room"
        title="Girls Room"
        description="Forgot a travel essential? Ask here and guests can jump in with help."
      />

      {!canAccess ? (
        <article className="card reveal girls-room-locked">
          <h3>Access coming soon</h3>
          <p className="muted">
            This room will soon be visible only to selected guests. For now, ask Kara if you need access.
          </p>
        </article>
      ) : null}

      {canAccess ? (
        <>
          <form className="card stack reveal girls-room-compose" onSubmit={handlePostThread}>
            <p className="eyebrow">Start a thread</p>
            <h3>What do you need?</h3>
            <label className="field">
              Item
              <input
                value={itemDraft}
                onChange={(event) => setItemDraft(event.target.value)}
                maxLength={80}
                placeholder="Bobby pins, hairspray, steamer, heels..."
              />
            </label>
            <label className="field">
              Details
              <textarea
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                maxLength={500}
                placeholder="Share what you forgot, where you are, and when you need it."
              />
            </label>
            <p className="muted small-text">{messageDraft.trim().length}/500</p>
            {error ? <p className="error-text">{error}</p> : null}
            <button type="submit" disabled={isPostingThread}>
              {isPostingThread ? 'Posting...' : 'Post request'}
            </button>
          </form>

          <section className="stack girls-room-thread-list">
            {threads.length === 0 ? (
              <article className="card reveal">
                <p className="muted">No requests yet. Start the first thread above.</p>
              </article>
            ) : (
              threads.map((thread) => (
                <article key={thread.id} className="card reveal girls-room-thread">
                  <header className="girls-room-thread-head">
                    <p className="eyebrow">Request</p>
                    <p className="muted small-text">
                      {thread.postedBy} • {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                    </p>
                  </header>
                  <h3>{thread.item}</h3>
                  <p>{thread.message}</p>
                  <section className="girls-room-replies">
                    <p className="girls-room-replies-title">Thread replies ({thread.replies.length})</p>
                    {thread.replies.length === 0 ? (
                      <p className="muted small-text">No replies yet.</p>
                    ) : (
                      <div className="girls-room-reply-list">
                        {thread.replies.map((reply) => (
                          <article key={reply.id} className="girls-room-reply">
                            <p>{reply.message}</p>
                            <p className="muted small-text">
                              {reply.postedBy} • {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                            </p>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <form className="stack girls-room-reply-form" onSubmit={(event) => handlePostReply(event, thread.id)}>
                    <label className="field">
                      Add a reply
                      <textarea
                        value={replyDrafts[thread.id] ?? ''}
                        onChange={(event) =>
                          setReplyDrafts((current) => ({ ...current, [thread.id]: event.target.value }))
                        }
                        maxLength={320}
                        placeholder="I have this and can bring it. Message me here."
                      />
                    </label>
                    <p className="muted small-text">{(replyDrafts[thread.id]?.trim().length ?? 0)}/320</p>
                    {replyErrors[thread.id] ? <p className="error-text">{replyErrors[thread.id]}</p> : null}
                    <button type="submit" disabled={postingReplyThreadId === thread.id}>
                      {postingReplyThreadId === thread.id ? 'Replying...' : 'Post reply'}
                    </button>
                  </form>
                </article>
              ))
            )}
          </section>
        </>
      ) : null}
    </section>
  )
}
