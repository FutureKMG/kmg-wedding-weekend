import { execFile as execFileCallback } from 'node:child_process'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { promisify } from 'node:util'
import path from 'node:path'
import os from 'node:os'
import sharp from 'sharp'

const execFile = promisify(execFileCallback)

const defaultInput = '/Users/kara/Downloads/IMG_4425_websize.jpg'
const sourcePath = process.argv[2] ?? defaultInput
const outputDir = path.resolve('public/theme')

const targets = [
  { suffix: '', width: 1600 },
  { suffix: '-mobile', width: 900 },
]

async function ensureReadableBySharp(input) {
  const ext = path.extname(input).toLowerCase()

  if (ext === '.heic' || ext === '.heif') {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'welcome-theme-'))
    const converted = path.join(tempDir, 'welcome-source.png')
    await execFile('sips', ['-s', 'format', 'png', input, '--out', converted])
    await sharp(converted).metadata()
    return {
      source: converted,
      cleanup: async () => {
        await rm(tempDir, { recursive: true, force: true })
      },
    }
  }

  await sharp(input).metadata()
  return { source: input, cleanup: async () => {} }
}

async function writeVariant(input, suffix, width) {
  const base = sharp(input)
    .resize({
      width,
      withoutEnlargement: true,
    })
    .rotate()

  await base
    .clone()
    .avif({ quality: 62, effort: 6 })
    .toFile(path.join(outputDir, `welcome-party-hero${suffix}.avif`))

  await base
    .clone()
    .webp({ quality: 80 })
    .toFile(path.join(outputDir, `welcome-party-hero${suffix}.webp`))

  await base
    .clone()
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, `welcome-party-hero${suffix}.png`))
}

async function main() {
  await mkdir(outputDir, { recursive: true })
  const prepared = await ensureReadableBySharp(sourcePath)

  try {
    for (const target of targets) {
      await writeVariant(prepared.source, target.suffix, target.width)
    }

    console.log('Welcome party assets generated:')
    console.log('- public/theme/welcome-party-hero.avif|webp|png (desktop)')
    console.log('- public/theme/welcome-party-hero-mobile.avif|webp|png (mobile)')
  } finally {
    await prepared.cleanup()
  }
}

main().catch((error) => {
  console.error('Failed to generate welcome party assets:', error.message)
  process.exitCode = 1
})
