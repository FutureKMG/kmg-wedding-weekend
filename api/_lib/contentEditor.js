const CONTENT_EDITOR_FULL_NAME_NORM = 'kara margraf'

export function canEditContentByFullNameNorm(fullNameNorm) {
  return (fullNameNorm ?? '') === CONTENT_EDITOR_FULL_NAME_NORM
}
