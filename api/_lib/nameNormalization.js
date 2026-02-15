const SPACE_REGEX = /\s+/g

export function normalizeNamePart(input) {
  return String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(SPACE_REGEX, ' ')
}

export function normalizeFullName(firstName, lastName) {
  return `${normalizeNamePart(firstName)} ${normalizeNamePart(lastName)}`.trim()
}
