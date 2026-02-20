import { createClient } from '@supabase/supabase-js'
import { loadEnvFile, normalizeFullName } from './_lib/rsvpImportUtils.mjs'

const VENDORS = [
  'Fenway Hotel',
  'Seashine Weddings',
  "Breezin' Entertainment",
  'Leaf It To Us',
  'Gabro',
  'Hellophoto',
  'Good Times Roll',
  'Femme Akoi Beauty Studio',
  'Fuego Cigar Truck',
]

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
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

  const payload = VENDORS.map((vendorName) => ({
    first_name: vendorName,
    last_name: 'Vendor',
    full_name_norm: normalizeFullName(vendorName, 'Vendor'),
    account_type: 'vendor',
    vendor_name: vendorName,
    can_access_vendor_forum: true,
    can_upload: true,
    is_admin: false,
  }))

  const { error } = await supabase
    .from('guests')
    .upsert(payload, { onConflict: 'full_name_norm', ignoreDuplicates: false })

  if (error?.message?.includes('account_type')) {
    throw new Error('Vendor fields are not enabled yet. Run migration 2026-02-20-add-vendor-access-and-forum.sql')
  }

  if (error) {
    throw new Error(error.message)
  }

  console.log(`Seeded ${payload.length} vendor records.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
