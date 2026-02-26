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
  { time: '8:30 AM', service: 'Hair', name: 'Katie Jaffe', artist: 'Maddie' },
  { time: '8:30 AM', service: 'Makeup', name: 'Katie Jaffe', artist: 'Hollie' },
  { time: '9:00 AM', service: 'Hair', name: 'McKenna Magriples', artist: 'Maddie' },
  { time: '9:15 AM', service: 'Makeup', name: 'McKenna Magriples', artist: 'Hollie' },
  { time: '9:30 AM', service: 'Hair', name: 'Nina Sennott', artist: 'Maddie' },
  { time: '9:30 AM', service: 'Hair', name: 'Alissa Murphy', artist: 'Ayla' },
  { time: '10:00 AM', service: 'Makeup', name: 'Alissa Murphy', artist: 'Maddie' },
  { time: '10:00 AM', service: 'Makeup', name: 'Nina Sennott', artist: 'Hollie' },
  { time: '10:15 AM', service: 'Hair', name: 'Heather Margraf', artist: 'Ayla' },
  { time: '10:45 AM', service: 'Makeup', name: 'Heather Margraf', artist: 'Maddie' },
  { time: '10:45 AM', service: 'Hair', name: 'Gabrielle Jackson', artist: 'Ayla' },
  { time: '10:45 AM', service: 'Makeup', name: 'Gabrielle Jackson', artist: 'Hollie' },
  { time: '11:15 AM', service: 'Hair', name: 'Laine Kenny', artist: 'Ayla' },
  { time: '11:30 AM', service: 'Makeup', name: 'Fatima Asis', artist: 'Maddie' },
  { time: '11:30 AM', service: 'Makeup', name: 'Carley Maleri', artist: 'Hollie' },
  { time: '11:45 AM', service: 'Hair', name: 'Fatima Asis', artist: 'Ayla' },
  { time: '12:15 PM', service: 'Junior Hair', name: 'Ainsley Lang', artist: 'Ayla' },
  { time: '12:15 PM', service: 'Makeup', name: 'Ekaterina Scorcia', artist: 'Hollie' },
  { time: '12:15 PM', service: 'Bride Makeup', name: 'Kara Margraf', artist: 'Maddie' },
  { time: '12:45 PM', service: 'Hair', name: 'Carley Maleri', artist: 'Ayla' },
  { time: '1:00 PM', service: 'Bride Hair', name: 'Kara Margraf', artist: 'Maddie' },
  { time: '1:15 PM', service: 'Hair', name: 'Ekaterina Scorcia', artist: 'Ayla' },
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
