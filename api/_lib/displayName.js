export function formatGuestDisplayName(guestRow) {
  if (!guestRow) {
    return 'Guest'
  }

  if (guestRow.account_type === 'vendor' && guestRow.vendor_name) {
    return guestRow.vendor_name
  }

  if (guestRow.first_name || guestRow.last_name) {
    return `${guestRow.first_name ?? ''} ${guestRow.last_name ?? ''}`.trim()
  }

  return 'Guest'
}
