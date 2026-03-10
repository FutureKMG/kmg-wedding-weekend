export type MorningScheduleEntry = {
  time: string
  service: string
  name: string
  artist: string
}

const WEDDING_DATE = '2026-03-14'
const WEDDING_OFFSET = '-04:00'
const TIME_PATTERN = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i

export const MORNING_SCHEDULE_SOURCE: MorningScheduleEntry[] = [
  { time: '8:00 AM', service: 'Makeup', name: 'Nina Sennott', artist: 'Hollie' },
  { time: '8:15 AM', service: 'Hair', name: 'Katie Margraf', artist: 'Ayla' },
  { time: '8:45 AM', service: 'Makeup', name: 'Gabrielle Jackson', artist: 'Hollie' },
  { time: '9:00 AM', service: 'Hair', name: 'Alissa Murphy', artist: 'Ayla' },
  { time: '9:30 AM', service: 'Hair', name: 'Fatima Asis', artist: 'Ayla' },
  { time: '9:30 AM', service: 'Makeup', name: 'Heather Margraf', artist: 'Hollie' },
  { time: '9:30 AM', service: 'Hair', name: 'McKenna Magriples', artist: 'Maddie' },
  { time: '10:00 AM', service: 'Bride Hair (Pinned)', name: 'Kara Margraf', artist: 'Ayla' },
  { time: '10:00 AM', service: 'Hair', name: 'Nina Sennott', artist: 'Maddie' },
  { time: '10:15 AM', service: 'Makeup', name: 'Katie Margraf', artist: 'Hollie' },
  { time: '10:30 AM', service: 'Hair', name: 'Gabrielle Jackson', artist: 'Maddie' },
  { time: '10:45 AM', service: 'Hair', name: 'Laine Kenny', artist: 'Ayla' },
  { time: '11:00 AM', service: 'Makeup', name: 'Alissa Murphy', artist: 'Hollie' },
  { time: '11:00 AM', service: 'Hair', name: 'Ekaterina Scorcia', artist: 'Maddie' },
  { time: '11:15 AM', service: 'Junior Hair', name: 'Ainsley Lang', artist: 'Ayla' },
  { time: '11:30 AM', service: 'Makeup', name: 'Fatima Asis', artist: 'Maddie' },
  { time: '11:45 AM', service: 'Hair', name: 'Carley Maleri', artist: 'Ayla' },
  { time: '11:45 AM', service: 'Bride Makeup', name: 'Kara Margraf', artist: 'Hollie' },
  { time: '12:15 PM', service: 'Hair', name: 'Heather Margraf', artist: 'Ayla' },
  { time: '12:15 PM', service: 'Makeup', name: 'Ekaterina Scorcia', artist: 'Maddie' },
  { time: '12:30 PM', service: 'Makeup', name: 'McKenna Magriples', artist: 'Hollie' },
  { time: '12:45 PM', service: 'Bride Hair (HW)', name: 'Kara Margraf', artist: 'Ayla' },
  { time: '1:00 PM', service: 'Makeup', name: 'Carley Maleri', artist: 'Maddie' },
  { time: '1:15 PM', service: 'Touchups', name: 'All', artist: 'Hollie' },
  { time: '1:45 PM', service: 'Touchups', name: 'All', artist: 'Maddie' },
  { time: '1:45 PM', service: 'Touchups', name: 'All', artist: 'Ayla' },
  { time: '1:45 PM', service: 'Finish', name: 'All', artist: 'Hollie' },
  { time: '2:15 PM', service: 'Finish', name: 'All', artist: 'Maddie' },
  { time: '2:15 PM', service: 'Finish', name: 'All', artist: 'Ayla' },
]

export function normalizeScheduleName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function scheduleTimeToMinutes(time: string): number {
  const parsed = time.trim().match(TIME_PATTERN)
  if (!parsed) return Number.POSITIVE_INFINITY

  const hourPart = Number(parsed[1])
  const minutePart = Number(parsed[2])
  const meridiem = parsed[3].toUpperCase()

  const hour24 = (hourPart % 12) + (meridiem === 'PM' ? 12 : 0)
  return hour24 * 60 + minutePart
}

export function toWeddingStartAtIso(time: string): string {
  const minutes = scheduleTimeToMinutes(time)
  const hour24 = Math.floor(minutes / 60)
  const minute = minutes % 60

  const hourPart = String(hour24).padStart(2, '0')
  const minutePart = String(minute).padStart(2, '0')
  return `${WEDDING_DATE}T${hourPart}:${minutePart}:00${WEDDING_OFFSET}`
}
