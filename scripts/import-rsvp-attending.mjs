import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import {
  DEFAULT_RSVP_PATH,
  RSVP_COLUMNS,
  attendingAny,
  cleanString,
  ensureDirectory,
  isPlaceholderGuestName,
  loadEnvFile,
  normalizeDietaryRestrictions,
  normalizeFullName,
  normalizeMealSelection,
  readRsvpCsv,
  toCsv,
  yyyymmdd,
} from './_lib/rsvpImportUtils.mjs'

const REPORT_DIR = path.resolve(process.cwd(), 'docs/import-reports')

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

function buildBaseRecord(row) {
  return {
    lineNumber: row._line,
    firstName: cleanString(row[RSVP_COLUMNS.firstName]),
    lastName: cleanString(row[RSVP_COLUMNS.lastName]),
    fullNameNorm: normalizeFullName(row[RSVP_COLUMNS.firstName], row[RSVP_COLUMNS.lastName]),
    mealRaw: cleanString(row[RSVP_COLUMNS.mealChoice]),
    dietaryRaw: cleanString(row[RSVP_COLUMNS.diet]),
    reception: cleanString(row[RSVP_COLUMNS.reception]),
    sourceRow: row,
  }
}

function buildStatusFingerprint(record) {
  return [
    cleanString(record.sourceRow['Welcome Party: Phillies vs. Orioles Spring Training Game']).toLowerCase(),
    cleanString(record.sourceRow.Ceremony).toLowerCase(),
    cleanString(record.sourceRow['Cocktail Hour']).toLowerCase(),
    cleanString(record.sourceRow.Reception).toLowerCase(),
    cleanString(record.sourceRow['After Party']).toLowerCase(),
    record.mealRaw.toLowerCase(),
  ].join('|')
}

function renameStephenBoydJr(records) {
  const stephenRows = records.filter((record) => record.fullNameNorm === 'stephen boyd')
  if (stephenRows.length !== 2) {
    return { applied: false, lineNumber: null, reason: 'no_two_stephen_boyd_rows' }
  }

  const sarahBoyd = records.find((record) => record.fullNameNorm === 'sarah boyd')
  let jrTarget = stephenRows[0]

  if (sarahBoyd) {
    const sarahFingerprint = buildStatusFingerprint(sarahBoyd)
    const matchingStephen = stephenRows.find(
      (record) => buildStatusFingerprint(record) === sarahFingerprint,
    )
    if (matchingStephen) {
      jrTarget = matchingStephen
    }
  }

  jrTarget.lastName = 'Boyd Jr'
  jrTarget.fullNameNorm = normalizeFullName(jrTarget.firstName, jrTarget.lastName)
  return { applied: true, lineNumber: jrTarget.lineNumber, reason: sarahBoyd ? 'matched_sarah' : 'default_first_row' }
}

function renameDuplicateAsJr(records, fullNameNorm) {
  const duplicateRows = records
    .filter((record) => record.fullNameNorm === fullNameNorm)
    .sort((left, right) => right.lineNumber - left.lineNumber)

  if (duplicateRows.length !== 2) {
    return { applied: false, lineNumber: null, reason: 'no_two_duplicate_rows' }
  }

  const jrTarget = duplicateRows[0]
  const baseLastName = cleanString(jrTarget.lastName).replace(/\s+jr$/i, '').trim()
  jrTarget.lastName = `${baseLastName} Jr`
  jrTarget.fullNameNorm = normalizeFullName(jrTarget.firstName, jrTarget.lastName)

  return { applied: true, lineNumber: jrTarget.lineNumber, reason: 'latest_row' }
}

function chunk(items, size) {
  const batches = []
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size))
  }
  return batches
}

async function main() {
  const inputPath = process.argv[2] ?? DEFAULT_RSVP_PATH
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

  const rows = await readRsvpCsv(inputPath)
  const skippedRows = []
  const candidateRecords = []

  for (const row of rows) {
    if (!attendingAny(row)) {
      skippedRows.push({
        line_number: row._line,
        reason: 'not_attending',
        first_name: cleanString(row[RSVP_COLUMNS.firstName]),
        last_name: cleanString(row[RSVP_COLUMNS.lastName]),
        full_name_norm: normalizeFullName(row[RSVP_COLUMNS.firstName], row[RSVP_COLUMNS.lastName]),
        reception: cleanString(row[RSVP_COLUMNS.reception]),
        meal_choice: cleanString(row[RSVP_COLUMNS.mealChoice]),
        dietary_raw: cleanString(row[RSVP_COLUMNS.diet]),
      })
      continue
    }

    if (isPlaceholderGuestName(row)) {
      skippedRows.push({
        line_number: row._line,
        reason: 'placeholder_guest_name',
        first_name: cleanString(row[RSVP_COLUMNS.firstName]),
        last_name: cleanString(row[RSVP_COLUMNS.lastName]),
        full_name_norm: normalizeFullName(row[RSVP_COLUMNS.firstName], row[RSVP_COLUMNS.lastName]),
        reception: cleanString(row[RSVP_COLUMNS.reception]),
        meal_choice: cleanString(row[RSVP_COLUMNS.mealChoice]),
        dietary_raw: cleanString(row[RSVP_COLUMNS.diet]),
      })
      continue
    }

    candidateRecords.push(buildBaseRecord(row))
  }

  const stephenRename = renameStephenBoydJr(candidateRecords)
  const robertRename = renameDuplicateAsJr(candidateRecords, 'robert kidd')
  const ericRename = renameDuplicateAsJr(candidateRecords, 'eric sennott')

  const groups = new Map()
  for (const record of candidateRecords) {
    const group = groups.get(record.fullNameNorm)
    if (group) {
      group.push(record)
    } else {
      groups.set(record.fullNameNorm, [record])
    }
  }

  const duplicateRows = []
  const importableRecords = []

  for (const [fullNameNorm, groupedRecords] of groups.entries()) {
    if (groupedRecords.length === 1) {
      importableRecords.push(groupedRecords[0])
      continue
    }

    for (const record of groupedRecords) {
      duplicateRows.push({
        line_number: record.lineNumber,
        duplicate_group_key: fullNameNorm,
        first_name: record.firstName,
        last_name: record.lastName,
        full_name_norm: record.fullNameNorm,
        reception: record.reception,
        meal_choice: record.mealRaw,
        dietary_raw: record.dietaryRaw,
      })
    }
  }

  const upsertPayload = importableRecords.map((record) => ({
    first_name: record.firstName,
    last_name: record.lastName,
    full_name_norm: record.fullNameNorm,
    meal_selection: normalizeMealSelection(record.mealRaw),
    dietary_restrictions: normalizeDietaryRestrictions(record.dietaryRaw),
    rsvp_reception: record.reception || null,
  }))

  for (const batch of chunk(upsertPayload, 200)) {
    const { error } = await supabase.from('guests').upsert(batch, {
      onConflict: 'full_name_norm',
      ignoreDuplicates: false,
    })
    if (error) {
      throw new Error(`Supabase upsert failed: ${error.message}`)
    }
  }

  await ensureDirectory(REPORT_DIR)
  const stamp = yyyymmdd()
  const summaryPath = path.join(REPORT_DIR, `rsvp-import-summary-${stamp}.json`)
  const skippedPath = path.join(REPORT_DIR, `rsvp-skipped-rows-${stamp}.csv`)
  const duplicatePath = path.join(REPORT_DIR, `rsvp-duplicates-needing-review-${stamp}.csv`)

  const summary = {
    inputPath,
    importedCount: upsertPayload.length,
    skippedCount: skippedRows.length,
    duplicateSkippedCount: duplicateRows.length,
    unresolvedDuplicateGroups: Array.from(new Set(duplicateRows.map((row) => row.duplicate_group_key))),
    stephenBoydJrRename: stephenRename,
    robertKiddJrRename: robertRename,
    ericSennottJrRename: ericRename,
    generatedAt: new Date().toISOString(),
  }

  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  await writeFile(
    skippedPath,
    toCsv(skippedRows, [
      'line_number',
      'reason',
      'first_name',
      'last_name',
      'full_name_norm',
      'reception',
      'meal_choice',
      'dietary_raw',
    ]),
    'utf8',
  )
  await writeFile(
    duplicatePath,
    toCsv(duplicateRows, [
      'line_number',
      'duplicate_group_key',
      'first_name',
      'last_name',
      'full_name_norm',
      'reception',
      'meal_choice',
      'dietary_raw',
    ]),
    'utf8',
  )

  console.log(`RSVP import completed.`)
  console.log(`Imported rows: ${upsertPayload.length}`)
  console.log(`Skipped rows: ${skippedRows.length}`)
  console.log(`Duplicate rows skipped: ${duplicateRows.length}`)
  console.log(`Summary: ${summaryPath}`)
  console.log(`Skipped report: ${skippedPath}`)
  console.log(`Duplicate report: ${duplicatePath}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
