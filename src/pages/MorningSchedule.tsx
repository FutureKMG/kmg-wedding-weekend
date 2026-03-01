import { formatDistanceStrict } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { DecoDivider } from '../components/DecoDivider'
import { PageIntro } from '../components/PageIntro'
import {
  MORNING_SCHEDULE_SOURCE,
  normalizeScheduleName,
  scheduleTimeToMinutes,
  toWeddingStartAtIso,
} from '../content/morningSchedule'
import { useAuth } from '../lib/auth'
import { isBridalPartyGuest } from '../lib/guestRole'

function getNextAssignmentCountdown(times: string[], now: Date): string | null {
  if (times.length === 0) {
    return null
  }

  const nextTime = times.find((time) => new Date(toWeddingStartAtIso(time)).getTime() > now.getTime())
  if (!nextTime) {
    return null
  }

  return formatDistanceStrict(new Date(toWeddingStartAtIso(nextTime)), now)
}

export function MorningSchedulePage() {
  const { guest } = useAuth()
  const [now, setNow] = useState(() => new Date())

  if (!isBridalPartyGuest(guest)) {
    return <Navigate to="/" replace />
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const fullSchedule = useMemo(
    () =>
      [...MORNING_SCHEDULE_SOURCE].sort(
        (a, b) => scheduleTimeToMinutes(a.time) - scheduleTimeToMinutes(b.time),
      ),
    [],
  )

  const guestName = useMemo(
    () => normalizeScheduleName(`${guest?.firstName ?? ''} ${guest?.lastName ?? ''}`),
    [guest?.firstName, guest?.lastName],
  )

  const yourSchedule = useMemo(
    () => fullSchedule.filter((entry) => normalizeScheduleName(entry.name) === guestName),
    [fullSchedule, guestName],
  )

  const countdown = useMemo(
    () => getNextAssignmentCountdown(yourSchedule.map((entry) => entry.time), now),
    [yourSchedule, now],
  )

  const hasAssignments = yourSchedule.length > 0

  return (
    <section className="stack morning-schedule-page">
      <PageIntro
        eyebrow="Morning Schedule"
        title="Wedding Morning Schedule"
        description="Saturday, March 14, 2026"
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
        <p>Finish Time: 2:15 PM</p>
        <p>Photo Ready: 2:30 PM</p>
      </article>

      <section className="stack morning-assignment-list" role="region" aria-label="Your Schedule">
        <article className="card reveal morning-section-head">
          <p className="eyebrow">Your Schedule</p>
          <h3>Your Schedule</h3>
        </article>

        {hasAssignments ? (
          yourSchedule.map((assignment, index) => (
            <article
              key={`${assignment.name}-${assignment.time}-${assignment.service}-${index}`}
              className="card reveal morning-assignment-card"
            >
              <div className="morning-assignment-head">
                <span className="morning-service-chip">{assignment.service}</span>
                <p className="morning-assignment-time">{assignment.time}</p>
              </div>
              <p className="morning-assignment-artist">with {assignment.artist}</p>
            </article>
          ))
        ) : (
          <article className="card reveal">
            <p>You do not have hair or makeup scheduled.</p>
          </article>
        )}
      </section>

      <DecoDivider />

      <section className="stack morning-full-schedule" role="region" aria-label="Full Morning Schedule">
        <article className="card reveal morning-section-head">
          <h3>Full Morning Schedule</h3>
          <p className="muted">Everyone&apos;s Timeline</p>
        </article>

        <div className="card reveal morning-full-table-wrap">
          <table className="morning-full-table" aria-label="Full Morning Schedule">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Service</th>
                <th scope="col">Name</th>
                <th scope="col">Artist</th>
              </tr>
            </thead>
            <tbody>
              {fullSchedule.map((entry, index) => (
                <tr key={`${entry.name}-${entry.time}-${entry.service}-${index}`}>
                  <td data-label="Time">{entry.time}</td>
                  <td data-label="Service">{entry.service}</td>
                  <td data-label="Name">{entry.name}</td>
                  <td data-label="Artist">{entry.artist}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
