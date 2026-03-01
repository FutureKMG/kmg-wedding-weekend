import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createClient } from '@supabase/supabase-js'
import {
  cleanString,
  ensureDirectory,
  loadEnvFile,
  normalizeFullName,
  toCsv,
  yyyymmdd,
} from './_lib/rsvpImportUtils.mjs'

const execFileAsync = promisify(execFile)

const DEFAULT_XLSX_PATH = '/Users/kara/Desktop/Seating Groups.xlsx'
const REPORT_DIR = path.resolve(process.cwd(), 'docs/import-reports')

const TABLE_CAPACITY = {
  Sweetheart: 2,
  'Table 1': 10,
  'Table 2': 18,
  'Table 3': 10,
  'Table 4': 18,
  'Table 5': 10,
  'Table 6': 10,
  'Table 7': 12,
  'Table 8': 12,
  'Table 9': 10,
}

const LEFT_ZONE_TABLES = new Set(['Table 1', 'Table 2', 'Table 5', 'Table 7'])
const RIGHT_CLUSTER_TABLES = new Set(['Table 3', 'Table 4', 'Table 6', 'Table 8', 'Table 9'])

const PLAN_SEGMENTS = [
  { tableLabel: 'Sweetheart', group: '', seats: 2 },
  { tableLabel: 'Table 2', group: 'Bridal Party', seats: 18 },
  { tableLabel: 'Table 4', group: 'Kara', seats: 18 },
  { tableLabel: 'Table 7', group: 'Work', seats: 12 },
  { tableLabel: 'Table 8', group: 'Kevin-OG', seats: 12 },
  { tableLabel: 'Table 6', group: 'BD', seats: 10 },
  { tableLabel: 'Table 3', group: 'Kara', seats: 9 },
  { tableLabel: 'Table 9', group: 'Kevin-Kyle', seats: 3 },
  { tableLabel: 'Table 9', group: 'Katie', seats: 4 },
  { tableLabel: 'Table 9', group: 'BD', seats: 2 },
  { tableLabel: 'Table 1', group: 'Work', seats: 2 },
  { tableLabel: 'Table 1', group: 'Bridal Party', seats: 4 },
  { tableLabel: 'Table 5', group: 'Kevin-OG', seats: 5 },
]

const EXPECTED_GROUP_COUNTS = {
  '': 2,
  'Bridal Party': 22,
  Kara: 27,
  'Kevin-OG': 17,
  Work: 14,
  BD: 12,
  'Kevin-Kyle': 3,
  Katie: 4,
}

const POPULATION_NAME_ALIASES = {
  'katie margraf': ['katie jaffe'],
  'katie jaffe': ['katie margraf'],
  "elle' tallent": ['elle schacter'],
  'elle schacter': ["elle' tallent"],
}

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

function parseArgs(argv) {
  const options = {
    inputPath: DEFAULT_XLSX_PATH,
    apply: false,
  }

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index]

    if (token === '--apply') {
      options.apply = true
      continue
    }

    if (token === '--dry-run') {
      options.apply = false
      continue
    }

    if (token === '--input' && argv[index + 1]) {
      options.inputPath = argv[index + 1]
      index += 1
      continue
    }

    if (!token.startsWith('--')) {
      options.inputPath = token
      continue
    }
  }

  return options
}

function decodeXmlText(value) {
  return String(value ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function columnLettersToIndex(value) {
  let total = 0
  for (const char of value) {
    total = total * 26 + (char.charCodeAt(0) - 64)
  }
  return total
}

function extractSharedStrings(xml) {
  const strings = []
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g
  let siMatch = siRegex.exec(xml)

  while (siMatch) {
    const textParts = []
    const tRegex = /<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g
    let tMatch = tRegex.exec(siMatch[1])
    while (tMatch) {
      textParts.push(decodeXmlText(tMatch[1]))
      tMatch = tRegex.exec(siMatch[1])
    }
    strings.push(textParts.join(''))
    siMatch = siRegex.exec(xml)
  }

  return strings
}

function extractRows(worksheetXml, sharedStrings) {
  const rows = []
  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g
  let rowMatch = rowRegex.exec(worksheetXml)

  while (rowMatch) {
    const rowXml = rowMatch[1]
    const rowValues = {}
    const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/g
    let cellMatch = cellRegex.exec(rowXml)

    while (cellMatch) {
      const attributes = cellMatch[1]
      const content = cellMatch[2]
      const referenceMatch = /r="([A-Z]+)\d+"/.exec(attributes)
      if (!referenceMatch) {
        cellMatch = cellRegex.exec(rowXml)
        continue
      }

      const columnIndex = columnLettersToIndex(referenceMatch[1])
      const cellTypeMatch = /t="([^"]+)"/.exec(attributes)
      const cellType = cellTypeMatch ? cellTypeMatch[1] : ''
      const valueMatch = /<v>([\s\S]*?)<\/v>/.exec(content)
      const inlineTextMatch = /<is>[\s\S]*?<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>[\s\S]*?<\/is>/.exec(content)

      let resolved = ''
      if (cellType === 's' && valueMatch) {
        const index = Number.parseInt(valueMatch[1], 10)
        resolved = sharedStrings[index] ?? ''
      } else if (cellType === 'inlineStr' && inlineTextMatch) {
        resolved = decodeXmlText(inlineTextMatch[1])
      } else if (valueMatch) {
        resolved = decodeXmlText(valueMatch[1])
      }

      rowValues[columnIndex] = cleanString(resolved)
      cellMatch = cellRegex.exec(rowXml)
    }

    rows.push(rowValues)
    rowMatch = rowRegex.exec(worksheetXml)
  }

  return rows
}

async function unzipText(filePath, entryPath) {
  const { stdout } = await execFileAsync('unzip', ['-p', filePath, entryPath], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  })
  return stdout
}

async function readAttendingRowsFromXlsx(inputPath) {
  const sharedStringsXml = await unzipText(inputPath, 'xl/sharedStrings.xml')
  const worksheetXml = await unzipText(inputPath, 'xl/worksheets/sheet1.xml')
  const sharedStrings = extractSharedStrings(sharedStringsXml)
  const rows = extractRows(worksheetXml, sharedStrings)

  if (rows.length < 2) {
    throw new Error('Workbook is missing guest rows.')
  }

  const headers = rows[0]
  const headerByName = new Map()
  for (const [columnIndexText, value] of Object.entries(headers)) {
    const columnIndex = Number.parseInt(columnIndexText, 10)
    if (value) {
      headerByName.set(value, columnIndex)
    }
  }

  const requiredHeaders = ['Table Grouping', 'First Name', 'Last Name', 'Suffix', 'Reception']
  for (const requiredHeader of requiredHeaders) {
    if (!headerByName.has(requiredHeader)) {
      throw new Error(`Missing required column in seating spreadsheet: ${requiredHeader}`)
    }
  }

  const tableGroupingColumn = headerByName.get('Table Grouping')
  const firstNameColumn = headerByName.get('First Name')
  const lastNameColumn = headerByName.get('Last Name')
  const suffixColumn = headerByName.get('Suffix')
  const receptionColumn = headerByName.get('Reception')

  const records = []
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]
    const receptionStatus = cleanString(row[receptionColumn]).toLowerCase()
    if (receptionStatus !== 'attending') {
      continue
    }

    const firstName = cleanString(row[firstNameColumn])
    const lastName = cleanString(row[lastNameColumn])
    const suffix = cleanString(row[suffixColumn])
    const group = cleanString(row[tableGroupingColumn])
    const lastWithSuffix = suffix ? `${lastName} ${suffix}`.trim() : lastName
    const fullNameNorm = normalizeFullName(firstName, lastWithSuffix)

    records.push({
      lineNumber: rowIndex + 1,
      firstName,
      lastName: lastWithSuffix,
      group,
      fullNameNorm,
      receptionStatus,
    })
  }

  return records
}

function buildStatusFingerprint(record) {
  return [record.receptionStatus.toLowerCase()].join('|')
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

function assertUniqueFullNames(records) {
  const counts = new Map()
  for (const record of records) {
    counts.set(record.fullNameNorm, (counts.get(record.fullNameNorm) ?? 0) + 1)
  }
  const duplicates = Array.from(counts.entries()).filter(([, count]) => count > 1)
  if (duplicates.length > 0) {
    const duplicateSummary = duplicates.map(([fullNameNorm, count]) => `${fullNameNorm} (${count})`).join(', ')
    throw new Error(`Duplicate attendee names remain after normalization: ${duplicateSummary}`)
  }
}

function buildGroupMap(records) {
  const groups = new Map()
  for (const record of records) {
    const bucket = groups.get(record.group)
    if (bucket) {
      bucket.push(record)
    } else {
      groups.set(record.group, [record])
    }
  }
  return groups
}

function validateInputCounts(groups) {
  for (const [group, expected] of Object.entries(EXPECTED_GROUP_COUNTS)) {
    const actual = (groups.get(group) ?? []).length
    if (actual !== expected) {
      throw new Error(`Group count mismatch for "${group || '(blank)'}": expected ${expected}, got ${actual}`)
    }
  }
}

function assignTables(groups) {
  const mutableGroups = new Map()
  for (const [group, records] of groups.entries()) {
    mutableGroups.set(group, [...records])
  }

  const assignments = []
  for (const segment of PLAN_SEGMENTS) {
    const available = mutableGroups.get(segment.group) ?? []
    if (available.length < segment.seats) {
      throw new Error(
        `Not enough guests in "${segment.group || '(blank)'}" for ${segment.tableLabel}: ` +
          `need ${segment.seats}, have ${available.length}`,
      )
    }

    const selected = available.splice(0, segment.seats)
    mutableGroups.set(segment.group, available)

    for (const record of selected) {
      assignments.push({
        lineNumber: record.lineNumber,
        firstName: record.firstName,
        lastName: record.lastName,
        fullNameNorm: record.fullNameNorm,
        sourceGroup: record.group,
        tableLabel: segment.tableLabel,
      })
    }
  }

  const leftovers = []
  for (const [group, records] of mutableGroups.entries()) {
    if (records.length > 0) {
      leftovers.push(`${group || '(blank)'}:${records.length}`)
    }
  }
  if (leftovers.length > 0) {
    throw new Error(`Unassigned guests remain after plan allocation: ${leftovers.join(', ')}`)
  }

  return assignments
}

function validateTableCapacities(assignments) {
  const countsByTable = new Map()
  for (const assignment of assignments) {
    countsByTable.set(assignment.tableLabel, (countsByTable.get(assignment.tableLabel) ?? 0) + 1)
  }

  for (const [tableLabel, count] of countsByTable.entries()) {
    const capacity = TABLE_CAPACITY[tableLabel]
    if (!capacity) {
      throw new Error(`Unknown table label in plan output: ${tableLabel}`)
    }
    if (count > capacity) {
      throw new Error(`Table over capacity: ${tableLabel} has ${count}, capacity ${capacity}`)
    }
  }

  return countsByTable
}

function validateSocialConstraints(assignments) {
  const tableByGroup = new Map()
  for (const assignment of assignments) {
    const list = tableByGroup.get(assignment.sourceGroup)
    if (list) {
      list.push(assignment.tableLabel)
    } else {
      tableByGroup.set(assignment.sourceGroup, [assignment.tableLabel])
    }
  }

  const workTables = new Set(tableByGroup.get('Work') ?? [])
  const karaTables = new Set(tableByGroup.get('Kara') ?? [])
  const kevinKyleTables = new Set(tableByGroup.get('Kevin-Kyle') ?? [])
  const bdTables = new Set(tableByGroup.get('BD') ?? [])

  for (const tableLabel of workTables) {
    if (!LEFT_ZONE_TABLES.has(tableLabel)) {
      throw new Error(`Constraint failure: Work guest assigned outside left zone at ${tableLabel}`)
    }
  }
  for (const tableLabel of karaTables) {
    if (!RIGHT_CLUSTER_TABLES.has(tableLabel)) {
      throw new Error(`Constraint failure: Kara guest assigned outside right cluster at ${tableLabel}`)
    }
  }
  for (const tableLabel of kevinKyleTables) {
    if (!RIGHT_CLUSTER_TABLES.has(tableLabel)) {
      throw new Error(`Constraint failure: Kevin-Kyle guest assigned outside right cluster at ${tableLabel}`)
    }
  }
  for (const tableLabel of bdTables) {
    if (!RIGHT_CLUSTER_TABLES.has(tableLabel)) {
      throw new Error(`Constraint failure: BD guest assigned outside right cluster at ${tableLabel}`)
    }
  }
}

function summarize(assignments) {
  const byGroup = new Map()
  const byTable = new Map()

  for (const assignment of assignments) {
    byGroup.set(assignment.sourceGroup, (byGroup.get(assignment.sourceGroup) ?? 0) + 1)
    byTable.set(assignment.tableLabel, (byTable.get(assignment.tableLabel) ?? 0) + 1)
  }

  return {
    groupCounts: Object.fromEntries(Array.from(byGroup.entries()).sort((a, b) => a[0].localeCompare(b[0]))),
    tableCounts: Object.fromEntries(Array.from(byTable.entries()).sort((a, b) => a[0].localeCompare(b[0]))),
  }
}

function chunk(items, size) {
  const batches = []
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size))
  }
  return batches
}

function resolveGuestByName(guestByFullName, fullNameNorm) {
  const normalized = cleanString(fullNameNorm)
  const directGuest = guestByFullName.get(normalized)
  if (directGuest) {
    return directGuest
  }

  for (const alias of POPULATION_NAME_ALIASES[normalized] ?? []) {
    const aliasGuest = guestByFullName.get(alias)
    if (aliasGuest) {
      return aliasGuest
    }
  }

  return null
}

async function applyToSupabase(assignments) {
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

  const { data, error } = await supabase.from('guests').select('id, full_name_norm')
  if (error) {
    throw new Error(`Could not load guests from Supabase: ${error.message}`)
  }

  const guestByFullName = new Map((data ?? []).map((row) => [cleanString(row.full_name_norm), row]))
  const resolvedAssignments = assignments.map((assignment) => ({
    assignment,
    guest: resolveGuestByName(guestByFullName, assignment.fullNameNorm),
  }))

  const unmatched = resolvedAssignments
    .filter((item) => !item.guest)
    .map((item) => item.assignment)
  if (unmatched.length > 0) {
    const preview = unmatched.slice(0, 10).map((item) => item.fullNameNorm).join(', ')
    throw new Error(
      `Cannot apply seating plan. ${unmatched.length} attendees were not found in guests table. ` +
        `Examples: ${preview}`,
    )
  }

  const upsertPayload = resolvedAssignments.map(({ assignment, guest }) => ({
    id: guest.id,
    table_label: assignment.tableLabel,
  }))

  for (const batch of chunk(upsertPayload, 200)) {
    const { error: upsertError } = await supabase.from('guests').upsert(batch, {
      onConflict: 'id',
      ignoreDuplicates: false,
    })
    if (upsertError) {
      throw new Error(`Could not update seating labels: ${upsertError.message}`)
    }
  }

  return { updatedCount: upsertPayload.length }
}

async function writeReports(inputPath, assignments, countsByTable, applyResult, renames) {
  await ensureDirectory(REPORT_DIR)
  const stamp = yyyymmdd()
  const summaryPath = path.join(REPORT_DIR, `seating-plan-summary-${stamp}.json`)
  const assignmentsPath = path.join(REPORT_DIR, `seating-plan-assignments-${stamp}.csv`)

  const openSeatsByTable = {}
  for (const [tableLabel, capacity] of Object.entries(TABLE_CAPACITY)) {
    const used = countsByTable.get(tableLabel) ?? 0
    openSeatsByTable[tableLabel] = capacity - used
  }

  const summary = {
    inputPath,
    totalAssigned: assignments.length,
    tableCounts: Object.fromEntries(Array.from(countsByTable.entries()).sort((a, b) => a[0].localeCompare(b[0]))),
    openSeatsByTable,
    applyMode: Boolean(applyResult),
    updatedCount: applyResult?.updatedCount ?? 0,
    renames,
    generatedAt: new Date().toISOString(),
  }

  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  await writeFile(
    assignmentsPath,
    toCsv(assignments, [
      'tableLabel',
      'sourceGroup',
      'firstName',
      'lastName',
      'fullNameNorm',
      'lineNumber',
    ]),
    'utf8',
  )

  return { summaryPath, assignmentsPath }
}

async function main() {
  const options = parseArgs(process.argv)
  const records = await readAttendingRowsFromXlsx(options.inputPath)

  const stephenRename = renameStephenBoydJr(records)
  const robertRename = renameDuplicateAsJr(records, 'robert kidd')
  const ericRename = renameDuplicateAsJr(records, 'eric sennott')

  assertUniqueFullNames(records)

  const groups = buildGroupMap(records)
  validateInputCounts(groups)
  const assignments = assignTables(groups)
  const countsByTable = validateTableCapacities(assignments)
  validateSocialConstraints(assignments)

  const applyResult = options.apply ? await applyToSupabase(assignments) : null
  const reportPaths = await writeReports(options.inputPath, assignments, countsByTable, applyResult, {
    stephenBoydJrRename: stephenRename,
    robertKiddJrRename: robertRename,
    ericSennottJrRename: ericRename,
  })
  const summary = summarize(assignments)

  console.log(`Seating plan validated for ${assignments.length} attendees.`)
  console.log(`Input: ${options.inputPath}`)
  console.log(`Mode: ${options.apply ? 'apply' : 'dry-run'}`)
  console.log(`Table counts: ${JSON.stringify(summary.tableCounts)}`)
  console.log(`Group counts: ${JSON.stringify(summary.groupCounts)}`)
  if (options.apply) {
    console.log(`Updated guests in Supabase: ${applyResult.updatedCount}`)
  }
  console.log(`Summary: ${reportPaths.summaryPath}`)
  console.log(`Assignments: ${reportPaths.assignmentsPath}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
