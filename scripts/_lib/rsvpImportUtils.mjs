import { readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

export const DEFAULT_RSVP_PATH = '/Users/kara/Downloads/export (8).csv'

export const RSVP_COLUMNS = {
  firstName: 'First Name',
  lastName: 'Last Name',
  mealChoice: 'Meal Choice',
  diet:
    'Are there any dietary restrictions or allergies we should know about? (Examples: vegetarian, vegan, gluten-free, dairy-free, nut or shellfish allergy.)',
  reception: 'Reception',
}

export const ATTENDANCE_COLUMNS = [
  'Welcome Party: Phillies vs. Orioles Spring Training Game',
  'Ceremony',
  'Cocktail Hour',
  'Reception',
  'After Party',
]

export function normalizeNamePart(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function normalizeFullName(firstName, lastName) {
  return `${normalizeNamePart(firstName)} ${normalizeNamePart(lastName)}`.trim()
}

export function cleanString(value) {
  const trimmed = String(value ?? '').trim()
  return trimmed === '' ? '' : trimmed
}

export function isAttending(value) {
  return cleanString(value).toLowerCase() === 'attending'
}

export function attendingAny(row) {
  return ATTENDANCE_COLUMNS.some((column) => isAttending(row[column]))
}

export function isPlaceholderGuestName(row) {
  return normalizeNamePart(row[RSVP_COLUMNS.firstName]) === 'guest' &&
    normalizeNamePart(row[RSVP_COLUMNS.lastName]) === ''
}

export function normalizeMealSelection(rawValue) {
  const normalized = cleanString(rawValue).toLowerCase()
  if (!normalized || normalized === 'no response') {
    return 'No Selection Submitted'
  }
  if (normalized === 'char-grilled filet mignon') {
    return 'Char-Grilled Filet Mignon'
  }
  if (normalized === 'local fresh catch (gluten-free)') {
    return 'Local Fresh Catch'
  }
  if (normalized === 'airline chicken breast (gluten-free)') {
    return 'Airline Chicken Breast'
  }
  if (normalized === "children's meal: chicken tenders & fries") {
    return "Children's Meal (Chicken Tenders & Fries)"
  }

  return cleanString(rawValue)
}

export function normalizeDietaryRestrictions(rawValue) {
  const normalized = cleanString(rawValue).toLowerCase()
  if (!normalized || normalized === 'no' || normalized === 'no:)' || normalized === 'none') {
    return null
  }
  return cleanString(rawValue)
}

function parseCsvText(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }
    if (char === ',') {
      row.push(field)
      field = ''
      continue
    }
    if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }
    if (char === '\r') {
      continue
    }

    field += char
  }

  row.push(field)
  rows.push(row)

  return rows
}

export async function readRsvpCsv(filePath = DEFAULT_RSVP_PATH) {
  const rawText = (await readFile(filePath, 'utf8')).replace(/^\uFEFF/, '')
  const parsedRows = parseCsvText(rawText).filter((row) => row.some((cell) => String(cell).trim() !== ''))

  if (parsedRows.length < 2) {
    return []
  }

  const headers = parsedRows[0]
  return parsedRows.slice(1).map((values, rowIndex) => {
    const row = { _line: rowIndex + 2 }
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] ?? ''
    })
    return row
  })
}

export function toCsv(rows, headers) {
  const serializedHeader = headers.map((header) => escapeCsvCell(header)).join(',')
  const serializedRows = rows.map((row) =>
    headers.map((header) => escapeCsvCell(row[header] ?? '')).join(','),
  )
  return [serializedHeader, ...serializedRows].join('\n')
}

function escapeCsvCell(value) {
  const text = String(value ?? '')
  if (!text.includes('"') && !text.includes(',') && !text.includes('\n')) {
    return text
  }
  return `"${text.replaceAll('"', '""')}"`
}

export async function ensureDirectory(dirPath) {
  await mkdir(dirPath, { recursive: true })
}

export function yyyymmdd(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

export async function loadEnvFile(filePath = path.resolve(process.cwd(), '.env.local')) {
  try {
    const content = await readFile(filePath, 'utf8')
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) {
        continue
      }
      const separatorIndex = line.indexOf('=')
      if (separatorIndex <= 0) {
        continue
      }
      const key = line.slice(0, separatorIndex).trim()
      const rawValue = line.slice(separatorIndex + 1).trim()
      const value = rawValue.replace(/^['"]|['"]$/g, '')
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // no-op when .env.local is missing
  }
}
