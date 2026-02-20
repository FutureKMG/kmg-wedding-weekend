import { formatDistanceToNow } from 'date-fns'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { PageIntro } from '../components/PageIntro'
import { apiRequest } from '../lib/apiClient'
import { useAuth } from '../lib/auth'
import type { VendorForumThread } from '../types'

function isKaraMargraf(firstName: string, lastName: string): boolean {
  return firstName.trim().toLowerCase() === 'kara' && lastName.trim().toLowerCase() === 'margraf'
}

export function VendorForumPage() {
  const { guest } = useAuth()
  const [threads, setThreads] = useState<VendorForumThread[]>([])
  const [error, setError] = useState('')
  const [itemDraft, setItemDraft] = useState('')
  const [messageDraft, setMessageDraft] = useState('')
  const [isPostingThread, setIsPostingThread] = useState(false)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({})
  const [postingReplyThreadId, setPostingReplyThreadId] = useState<string | null>(null)
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null)
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null)

  const canAccess =
    Boolean(guest?.canAccessVendorForum) ||
    Boolean(guest?.canEditContent) ||
    isKaraMargraf(guest?.firstName ?? '', guest?.lastName ?? '')
  const isModerator =
    guest != null &&
    (guest.canEditContent || isKaraMargraf(guest.firstName ?? '', guest.lastName ?? ''))

  const loadThreads = useCallback(async () => {
    try {
      const payload = await apiRequest<{ threads: VendorForumThread[]; migrationRequired?: boolean }>(
        `/api/vendor-forum?limit=60&t=${Date.now()}`,
        { cache: 'no-store' },
      )
      if (payload.migrationRequired) {
        setError('Vendor Forum is not enabled yet. Run the latest Supabase migration.')
        setThreads([])
        return
      }
      setThreads(payload.threads ?? [])
      setError('')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Could not load Vendor Forum'
      setError(message)
      setThreads([])
    }
  }, [])

  useEffect(() => {
    if (canAccess) {
      void loadThreads()
    }
  }, [canAccess, loadThreads])

  async function handlePostThread(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const item = itemDraft.trim()
    const message = messageDraft.trim()
    if (!item || !message) {
      setError('Please include both the topic and details.')
      return
    }

    setError('')
    setIsPostingThread(true)

    try {
      await apiRequest('/api/vendor-forum', {
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
      await apiRequest('/api/vendor-forum/reply', {
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

  async function handleDeleteThread(threadId: string) {
    setError('')
    setDeletingThreadId(threadId)

    try {
      await apiRequest('/api/vendor-forum/thread-delete', {
        method: 'POST',
        body: JSON.stringify({ threadId }),
      })
      await loadThreads()
    } catch (requestError) {
      const messageText = requestError instanceof Error ? requestError.message : 'Could not delete thread'
      setError(messageText)
    } finally {
      setDeletingThreadId(null)
    }
  }

  async function handleDeleteReply(replyId: string, threadId: string) {
    setReplyErrors((current) => ({ ...current, [threadId]: '' }))
    setDeletingReplyId(replyId)

    try {
      await apiRequest('/api/vendor-forum/reply-delete', {
        method: 'POST',
        body: JSON.stringify({ replyId }),
      })
      await loadThreads()
    } catch (requestError) {
      const messageText = requestError instanceof Error ? requestError.message : 'Could not delete reply'
      setReplyErrors((current) => ({ ...current, [threadId]: messageText }))
    } finally {
      setDeletingReplyId(null)
    }
  }

  return (
    <section className="stack vendor-forum-page">
      <PageIntro
        eyebrow="Vendor Forum"
        title="Vendor Forum"
        description="Vendor coordination hub for live updates and operational handoffs."
      />

      {!canAccess ? (
        <article className="card reveal vendor-forum-locked">
          <h3>Access restricted</h3>
          <p className="muted">Vendor Forum is available to vendor accounts and Kara admin access only.</p>
        </article>
      ) : null}

      {canAccess ? (
        <>
          <form className="card stack reveal vendor-forum-compose" onSubmit={handlePostThread}>
            <p className="eyebrow">Start a thread</p>
            <h3>What needs coordination?</h3>
            <label className="field">
              Topic
              <input
                value={itemDraft}
                onChange={(event) => setItemDraft(event.target.value)}
                maxLength={80}
                placeholder="Load-in timing, AV handoff, florals setup..."
              />
            </label>
            <label className="field">
              Details
              <textarea
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                maxLength={500}
                placeholder="Share specific timing, location, and what you need from another vendor."
              />
            </label>
            <p className="muted small-text">{messageDraft.trim().length}/500</p>
            {error ? <p className="error-text">{error}</p> : null}
            <button type="submit" disabled={isPostingThread}>
              {isPostingThread ? 'Posting...' : 'Post thread'}
            </button>
          </form>

          <section className="stack vendor-forum-thread-list">
            {threads.length === 0 ? (
              <article className="card reveal">
                <p className="muted">No vendor threads yet. Start the first one above.</p>
              </article>
            ) : (
              threads.map((thread) => (
                <article key={thread.id} className="card reveal vendor-forum-thread">
                  <header className="vendor-forum-thread-head">
                    <p className="eyebrow">Thread</p>
                    <p className="muted small-text">
                      {thread.postedBy} • {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                    </p>
                    {thread.isOwner || isModerator ? (
                      <button
                        type="button"
                        className="secondary-button vendor-forum-delete-button"
                        onClick={() => void handleDeleteThread(thread.id)}
                        disabled={deletingThreadId === thread.id}
                      >
                        {deletingThreadId === thread.id ? 'Deleting...' : 'Delete thread'}
                      </button>
                    ) : null}
                  </header>
                  <h3>{thread.item}</h3>
                  <p>{thread.message}</p>
                  <section className="vendor-forum-replies">
                    <p className="vendor-forum-replies-title">Replies ({thread.replies.length})</p>
                    {thread.replies.length === 0 ? (
                      <p className="muted small-text">No replies yet.</p>
                    ) : (
                      <div className="vendor-forum-reply-list">
                        {thread.replies.map((reply) => (
                          <article key={reply.id} className="vendor-forum-reply">
                            <p>{reply.message}</p>
                            <div className="vendor-forum-reply-meta">
                              <p className="muted small-text">
                                {reply.postedBy} • {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                              </p>
                              {reply.isOwner || isModerator ? (
                                <button
                                  type="button"
                                  className="secondary-button vendor-forum-delete-button"
                                  onClick={() => void handleDeleteReply(reply.id, thread.id)}
                                  disabled={deletingReplyId === reply.id}
                                >
                                  {deletingReplyId === reply.id ? 'Deleting...' : 'Delete reply'}
                                </button>
                              ) : null}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <form className="stack vendor-forum-reply-form" onSubmit={(event) => handlePostReply(event, thread.id)}>
                    <label className="field">
                      Add a reply
                      <textarea
                        value={replyDrafts[thread.id] ?? ''}
                        onChange={(event) =>
                          setReplyDrafts((current) => ({ ...current, [thread.id]: event.target.value }))
                        }
                        maxLength={320}
                        placeholder="Reply with timing updates, dependencies, or confirmations."
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
