import { formatDistanceStrict } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { useEffect, useMemo, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { apiRequest } from '../lib/apiClient'
import type { MorningSchedulePayload } from '../types'

function formatServiceTime(startAt: string, timezone: string): string {
  try {
    return formatInTimeZone(startAt, timezone, 'h:mm a')
  } catch {
    return 'Time TBD'
  }
}

function getNextAssignmentCountdown(payload: MorningSchedulePayload | null, now: Date): string | null {
  if (!payload || payload.assignments.length === 0) {
    return null
  }

  const next = payload.assignments.find((assignment) => new Date(assignment.startAt).getTime() > now.getTime())
  if (!next) {
    return null
  }

  return formatDistanceStrict(new Date(next.startAt), now)
}

export function MorningSchedulePage() {
  const [payload, setPayload] = useState<MorningSchedulePayload | null>(null)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    async function loadMorningSchedule() {
      try {
        const response = await apiRequest<MorningSchedulePayload>('/api/morning-schedule')
        setPayload(response)
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Could not load morning schedule'
        setError(message)
      }
    }

    void loadMorningSchedule()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const countdown = useMemo(() => getNextAssignmentCountdown(payload, now), [payload, now])
  const assignments = payload?.assignments ?? []
  const fullSchedule = payload?.fullSchedule ?? []
  const hasAssignments = assignments.length > 0
  const hasFullSchedule = fullSchedule.length > 0
  const timezone = payload?.timezone ?? 'America/New_York'

  return (
    <section className="stack morning-schedule-page">
      <PageIntro
        eyebrow="Morning Schedule"
        title="Wedding Morning Schedule"
        description="Fenway Hotel · Saturday, March 14"
      />

      <article className="card reveal morning-countdown-card">
        <p className="eyebrow">Countdown</p>
        {countdown ? (
          <h3>Your service begins in: {countdown}</h3>
        ) : hasAssignments ? (
          <h3>Your scheduled services are complete.</h3>
        ) : (
          <h3>You do not have hair or makeup scheduled.</h3>
        )}
      </article>

      <article className="card reveal morning-status-strip">
        <p>Arrive 15 minutes early</p>
        <p>Be photo-ready by 2:30 PM</p>
      </article>

      {error ? <p className="error-text">{error}</p> : null}

      {!error && payload?.migrationRequired ? (
        <article className="card reveal">
          <p className="muted">Morning schedule will appear after the latest migration is applied.</p>
        </article>
      ) : null}

      {!error && !payload?.migrationRequired && hasAssignments ? (
        <section className="stack morning-assignment-list">
          {assignments.map((assignment) => (
            <article key={assignment.id} className="card reveal morning-assignment-card">
              <div className="morning-assignment-head">
                <span className="morning-service-chip">{assignment.serviceLabel}</span>
                <p className="morning-assignment-time">
                  {formatServiceTime(assignment.startAt, timezone)}
                </p>
              </div>
              <p className="morning-assignment-artist">with {assignment.artistName}</p>
              <p className="muted">{assignment.location}</p>
              {assignment.notes ? <p className="muted">{assignment.notes}</p> : null}
            </article>
          ))}
        </section>
      ) : null}

      {!error && !payload?.migrationRequired && !hasAssignments ? (
        <article className="card reveal">
          <p>You do not have hair or makeup scheduled.</p>
        </article>
      ) : null}

      {!error && !payload?.migrationRequired ? (
        <section className="stack morning-full-schedule">
          <article className="card reveal">
            <p className="eyebrow">Full Morning Schedule</p>
            <h3>Everyone's timeline at Fenway Hotel</h3>
          </article>

          {hasFullSchedule ? (
            <div className="stack">
              {fullSchedule.map((assignment) => (
                <article
                  key={`${assignment.id}-full`}
                  className="card reveal morning-assignment-card morning-assignment-card-full"
                >
                  <div className="morning-assignment-head">
                    <span className="morning-service-chip">{assignment.serviceLabel}</span>
                    <p className="morning-assignment-time">
                      {formatServiceTime(assignment.startAt, timezone)}
                    </p>
                  </div>
                  <p className="morning-assignment-artist">{assignment.guestName} with {assignment.artistName}</p>
                  <p className="muted">{assignment.location}</p>
                  {assignment.notes ? <p className="muted">{assignment.notes}</p> : null}
                </article>
              ))}
            </div>
          ) : (
            <article className="card reveal">
              <p className="muted">Full schedule is not posted yet.</p>
            </article>
          )}
        </section>
      ) : null}
    </section>
  )
}
