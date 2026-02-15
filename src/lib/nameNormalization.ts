const SPACE_REGEX = /\s+/g

export function normalizeNamePart(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(SPACE_REGEX, ' ')
}

export function normalizeFullName(firstName: string, lastName: string): string {
  return `${normalizeNamePart(firstName)} ${normalizeNamePart(lastName)}`.trim()
}
