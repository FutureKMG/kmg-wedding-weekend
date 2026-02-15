const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SESSION_SECRET',
]

export function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export function assertRequiredEnv() {
  for (const name of requiredEnvVars) {
    getRequiredEnv(name)
  }
}
