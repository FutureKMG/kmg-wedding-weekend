import { createClient } from '@supabase/supabase-js'
import {
  DEFAULT_RSVP_PATH,
  RSVP_COLUMNS,
  attendingAny,
  cleanString,
  isPlaceholderGuestName,
  loadEnvFile,
  normalizeFullName,
  readRsvpCsv,
} from './_lib/rsvpImportUtils.mjs'

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

function countDuplicates(values) {
  const counts = new Map()
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }))
}

async function main() {
  const inputPath = process.argv[2] ?? DEFAULT_RSVP_PATH
  await loadEnvFile()

  const csvRows = await readRsvpCsv(inputPath)
  const csvNames = csvRows
    .filter((row) => attendingAny(row))
    .filter((row) => !isPlaceholderGuestName(row))
    .map((row) => normalizeFullName(row[RSVP_COLUMNS.firstName], row[RSVP_COLUMNS.lastName]))
    .filter(Boolean)

  const csvDuplicates = countDuplicates(csvNames)
  console.log(`CSV duplicate names (attending, non-placeholder): ${csvDuplicates.length}`)
  for (const duplicate of csvDuplicates) {
    console.log(` - ${duplicate.value} (${duplicate.count})`)
  }

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

  const { data, error } = await supabase
    .from('guests')
    .select('full_name_norm')

  if (error) {
    throw new Error(`Supabase lookup failed: ${error.message}`)
  }

  const dbDuplicates = countDuplicates(
    (data ?? [])
      .map((row) => cleanString(row.full_name_norm))
      .filter(Boolean),
  )

  console.log(`DB duplicate full_name_norm values: ${dbDuplicates.length}`)
  for (const duplicate of dbDuplicates) {
    console.log(` - ${duplicate.value} (${duplicate.count})`)
  }

  if (csvDuplicates.length > 0 || dbDuplicates.length > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
