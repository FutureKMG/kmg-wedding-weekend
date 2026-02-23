import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import {
  cleanString,
  ensureDirectory,
  loadEnvFile,
  normalizeNamePart,
  toCsv,
  yyyymmdd,
} from './_lib/rsvpImportUtils.mjs'

const REPORT_DIR = path.resolve(process.cwd(), 'docs/import-reports')
const WEDDING_DATE = '2026-03-14'
const TIMEZONE_OFFSET = '-04:00'
const LOCATION = 'Fenway Hotel'
const BRIDE_FULL_NAME_NORM = 'kara margraf'
const FIRST_NAME_OVERRIDES = {
  katie: 'katie jaffe',
}

const MORNING_ROWS = [
  { artistName: 'Maddie', time: '08:30', serviceType: 'hair', guestFirstName: 'Katie' },
  { artistName: 'Maddie', time: '09:00', serviceType: 'hair', guestFirstName: 'McKenna' },
  { artistName: 'Maddie', time: '09:30', serviceType: 'hair', guestFirstName: 'Nina' },
  { artistName: 'Maddie', time: '10:00', serviceType: 'makeup', guestFirstName: 'Alissa' },
  { artistName: 'Maddie', time: '10:45', serviceType: 'makeup', guestFirstName: 'Heather' },
  { artistName: 'Maddie', time: '11:30', serviceType: 'makeup', guestFirstName: 'Fatima' },
  { artistName: 'Maddie', time: '12:15', serviceType: 'bride_makeup', guestFirstName: 'Kara' },
  { artistName: 'Maddie', time: '13:00', serviceType: 'bride_hair', guestFirstName: 'Kara' },
  { artistName: 'Ayla', time: '09:30', serviceType: 'hair', guestFirstName: 'Alissa' },
  { artistName: 'Ayla', time: '10:15', serviceType: 'hair', guestFirstName: 'Heather' },
  { artistName: 'Ayla', time: '10:45', serviceType: 'hair', guestFirstName: 'Gabrielle' },
  { artistName: 'Ayla', time: '11:15', serviceType: 'hair', guestFirstName: 'Laine' },
  { artistName: 'Ayla', time: '11:45', serviceType: 'hair', guestFirstName: 'Fatima' },
  { artistName: 'Ayla', time: '12:15', serviceType: 'junior_hair', guestFirstName: 'Ainsley' },
  { artistName: 'Ayla', time: '12:45', serviceType: 'hair', guestFirstName: 'Carley' },
  { artistName: 'Ayla', time: '13:15', serviceType: 'hair', guestFirstName: 'Ekaterina' },
  { artistName: 'Hollie', time: '08:30', serviceType: 'makeup', guestFirstName: 'Katie' },
  { artistName: 'Hollie', time: '09:15', serviceType: 'makeup', guestFirstName: 'McKenna' },
  { artistName: 'Hollie', time: '10:00', serviceType: 'makeup', guestFirstName: 'Nina' },
  { artistName: 'Hollie', time: '10:45', serviceType: 'makeup', guestFirstName: 'Gabrielle' },
  { artistName: 'Hollie', time: '11:30', serviceType: 'makeup', guestFirstName: 'Carley' },
  { artistName: 'Hollie', time: '12:15', serviceType: 'makeup', guestFirstName: 'Ekaterina' },
]

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

function toStartIso(time) {
  return `${WEDDING_DATE}T${time}:00${TIMEZONE_OFFSET}`
}

function buildGuestMap(guests) {
  const byFirstName = new Map()
  for (const guest of guests) {
    const key = normalizeNamePart(guest.first_name)
    const existing = byFirstName.get(key)
    if (existing) {
      existing.push(guest)
    } else {
      byFirstName.set(key, [guest])
    }
  }
  return byFirstName
}

function buildGuestByFullNameMap(guests) {
  const byFullName = new Map()
  for (const guest of guests) {
    byFullName.set(normalizeNamePart(guest.full_name_norm), guest)
  }
  return byFullName
}

async function fetchGuests(supabase) {
  let result = await supabase
    .from('guests')
    .select('id, first_name, last_name, full_name_norm, account_type')

  if (result.error?.message?.includes('account_type')) {
    result = await supabase
      .from('guests')
      .select('id, first_name, last_name, full_name_norm')
  }

  if (result.error) {
    throw new Error(`Could not load guests: ${result.error.message}`)
  }

  return (result.data ?? []).filter((guest) => guest.account_type !== 'vendor')
}

async function main() {
  await loadEnvFile()

  const supabase = createClient(
    getRequiredEnv('SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )

  const guests = await fetchGuests(supabase)
  const byFirstName = buildGuestMap(guests)
  const byFullName = buildGuestByFullNameMap(guests)
  const unresolvedRows = []
  const payload = []

  for (const row of MORNING_ROWS) {
    if (row.serviceType === 'bride_hair' || row.serviceType === 'bride_makeup') {
      const bride = byFullName.get(BRIDE_FULL_NAME_NORM)
      if (!bride) {
        unresolvedRows.push({
          guest_first_name: row.guestFirstName,
          service_type: row.serviceType,
          artist_name: row.artistName,
          time: row.time,
          reason: 'bride_not_found',
          candidate_guests: '',
        })
        continue
      }

      payload.push({
        guest_id: bride.id,
        service_type: row.serviceType,
        artist_name: cleanString(row.artistName),
        start_at: toStartIso(row.time),
        location: LOCATION,
        notes: null,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      continue
    }

    const firstNameKey = normalizeNamePart(row.guestFirstName)
    const overrideFullName = FIRST_NAME_OVERRIDES[firstNameKey]
    if (overrideFullName) {
      const overrideGuest = byFullName.get(overrideFullName)
      if (!overrideGuest) {
        unresolvedRows.push({
          guest_first_name: row.guestFirstName,
          service_type: row.serviceType,
          artist_name: row.artistName,
          time: row.time,
          reason: 'override_guest_not_found',
          candidate_guests: '',
        })
        continue
      }

      payload.push({
        guest_id: overrideGuest.id,
        service_type: row.serviceType,
        artist_name: cleanString(row.artistName),
        start_at: toStartIso(row.time),
        location: LOCATION,
        notes: null,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      continue
    }

    const matches = byFirstName.get(normalizeNamePart(row.guestFirstName)) ?? []
    if (matches.length === 0) {
      unresolvedRows.push({
        guest_first_name: row.guestFirstName,
        service_type: row.serviceType,
        artist_name: row.artistName,
        time: row.time,
        reason: 'no_guest_match',
        candidate_guests: '',
      })
      continue
    }

    if (matches.length > 1) {
      unresolvedRows.push({
        guest_first_name: row.guestFirstName,
        service_type: row.serviceType,
        artist_name: row.artistName,
        time: row.time,
        reason: 'ambiguous_first_name',
        candidate_guests: matches.map((guest) => `${guest.first_name} ${guest.last_name}`).join(' | '),
      })
      continue
    }

    payload.push({
      guest_id: matches[0].id,
      service_type: row.serviceType,
      artist_name: cleanString(row.artistName),
      start_at: toStartIso(row.time),
      location: LOCATION,
      notes: null,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
  }

  const { error: upsertError } = await supabase
    .from('morning_schedule_assignments')
    .upsert(payload, {
      onConflict: 'guest_id,service_type,start_at',
      ignoreDuplicates: false,
    })

  if (upsertError?.message?.includes('relation "public.morning_schedule_assignments" does not exist')) {
    throw new Error('Morning schedule table is not enabled yet. Run migration 2026-02-22-add-morning-schedule.sql')
  }

  if (upsertError) {
    throw new Error(`Morning schedule upsert failed: ${upsertError.message}`)
  }

  await ensureDirectory(REPORT_DIR)
  const stamp = yyyymmdd()
  const summaryPath = path.join(REPORT_DIR, `morning-schedule-summary-${stamp}.json`)
  const unresolvedPath = path.join(REPORT_DIR, `morning-schedule-unresolved-${stamp}.csv`)

  const summary = {
    weddingDate: WEDDING_DATE,
    location: LOCATION,
    importedCount: payload.length,
    unresolvedCount: unresolvedRows.length,
    unresolvedFirstNames: Array.from(new Set(unresolvedRows.map((row) => row.guest_first_name))),
    generatedAt: new Date().toISOString(),
  }

  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  await writeFile(
    unresolvedPath,
    toCsv(unresolvedRows, [
      'guest_first_name',
      'service_type',
      'artist_name',
      'time',
      'reason',
      'candidate_guests',
    ]),
    'utf8',
  )

  console.log('Morning schedule seed complete.')
  console.log(`Imported rows: ${payload.length}`)
  console.log(`Unresolved rows: ${unresolvedRows.length}`)
  console.log(`Summary: ${summaryPath}`)
  console.log(`Unresolved report: ${unresolvedPath}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
