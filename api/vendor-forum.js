import { z } from 'zod'
import { formatGuestDisplayName } from './_lib/displayName.js'
import { methodNotAllowed, readJson, sendJson, setNoStore, unauthorized } from './_lib/http.js'
import { canAccessVendorForum } from './_lib/moderation.js'
import { requireGuest } from './_lib/guest.js'
import { getSupabaseAdminClient } from './_lib/supabaseAdmin.js'

const createThreadSchema = z.object({
  item: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(500),
})

function getQueryLimit(req) {
  const raw = Array.isArray(req.query?.limit) ? req.query.limit[0] : req.query?.limit
  const parsed = Number.parseInt(raw ?? '40', 10)
  if (Number.isNaN(parsed)) {
    return 40
  }

  return Math.max(1, Math.min(parsed, 100))
}

export default async function handler(req, res) {
  const guest = await requireGuest(req)
  if (!guest) {
    return unauthorized(res)
  }

  if (!canAccessVendorForum(guest)) {
    return sendJson(res, 403, { message: 'Only vendors can access Vendor Forum.' })
  }

  const supabase = getSupabaseAdminClient()

  if (req.method === 'GET') {
    const limit = getQueryLimit(req)
    const threadsResult = await supabase
      .from('vendor_forum_threads')
      .select('id, guest_id, item, message, created_at, guests(first_name,last_name,account_type,vendor_name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (threadsResult.error?.message?.includes('relation "public.vendor_forum_threads" does not exist')) {
      return sendJson(res, 200, { threads: [], migrationRequired: true })
    }

    if (threadsResult.error) {
      return sendJson(res, 500, { message: 'Could not load Vendor Forum threads' })
    }

    const threadRows = threadsResult.data ?? []
    const threadIds = threadRows.map((thread) => thread.id)
    const repliesByThreadId = new Map()

    if (threadIds.length > 0) {
      const repliesResult = await supabase
        .from('vendor_forum_replies')
        .select('id, thread_id, guest_id, message, created_at, guests(first_name,last_name,account_type,vendor_name)')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: true })

      if (repliesResult.error?.message?.includes('relation "public.vendor_forum_replies" does not exist')) {
        return sendJson(res, 200, { threads: [], migrationRequired: true })
      }

      if (repliesResult.error) {
        return sendJson(res, 500, { message: 'Could not load Vendor Forum replies' })
      }

      for (const reply of repliesResult.data ?? []) {
        const owner = Array.isArray(reply.guests) ? reply.guests[0] : reply.guests
        const formattedReply = {
          id: reply.id,
          threadId: reply.thread_id,
          message: reply.message,
          createdAt: reply.created_at,
          postedBy: formatGuestDisplayName(owner),
          isOwner: reply.guest_id === guest.id,
        }

        const existingThreadReplies = repliesByThreadId.get(reply.thread_id)
        if (existingThreadReplies) {
          existingThreadReplies.push(formattedReply)
        } else {
          repliesByThreadId.set(reply.thread_id, [formattedReply])
        }
      }
    }

    const threads = threadRows.map((thread) => {
      const owner = Array.isArray(thread.guests) ? thread.guests[0] : thread.guests

      return {
        id: thread.id,
        item: thread.item,
        message: thread.message,
        createdAt: thread.created_at,
        postedBy: formatGuestDisplayName(owner),
        isOwner: thread.guest_id === guest.id,
        replies: repliesByThreadId.get(thread.id) ?? [],
      }
    })

    setNoStore(res)
    return sendJson(res, 200, { threads })
  }

  if (req.method === 'POST') {
    const payload = await readJson(req)
    const parsed = createThreadSchema.safeParse(payload)

    if (!parsed.success) {
      return sendJson(res, 400, { message: 'Please add an item name and details.' })
    }

    const { error } = await supabase.from('vendor_forum_threads').insert({
      guest_id: guest.id,
      item: parsed.data.item,
      message: parsed.data.message,
    })

    if (error?.message?.includes('relation "public.vendor_forum_threads" does not exist')) {
      return sendJson(res, 503, {
        message: 'Vendor Forum is not enabled yet. Run the latest Supabase migration.',
      })
    }

    if (error) {
      return sendJson(res, 500, { message: 'Could not post to Vendor Forum' })
    }

    setNoStore(res)
    return sendJson(res, 200, { ok: true })
  }

  return methodNotAllowed(res)
}
