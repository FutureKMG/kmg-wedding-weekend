import { execFile as execFileCallback } from 'node:child_process'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { promisify } from 'node:util'
import path from 'node:path'
import os from 'node:os'
import sharp from 'sharp'

const execFile = promisify(execFileCallback)

const outputDir = path.resolve('public/theme')
const defaultInputs = {
  hero: '/Users/kara/Downloads/IMG_4521_websize.jpg',
  portraitOne: '/Users/kara/Downloads/IMG_4635_websize.jpg',
  portraitTwo: '/Users/kara/Downloads/IMG_4643_websize.jpg',
}

function parseOverrideArgs() {
  const args = process.argv.slice(2)
  const overrides = {}

  for (const arg of args) {
    if (!arg.startsWith('--')) {
      continue
    }

    const [key, value] = arg.slice(2).split('=')
    if (key && value) {
      overrides[key] = value
    }
  }

  return overrides
}

async function ensureReadableBySharp(input) {
  const ext = path.extname(input).toLowerCase()

  if (ext === '.heic' || ext === '.heif') {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'home-lounge-'))
    const converted = path.join(tempDir, 'source.png')
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

async function writeResponsiveVariants(input, filePrefix, widthDesktop, widthMobile) {
  const baseDesktop = sharp(input)
    .resize({ width: widthDesktop, withoutEnlargement: true })
    .rotate()
  const baseMobile = sharp(input)
    .resize({ width: widthMobile, withoutEnlargement: true })
    .rotate()

  await baseDesktop
    .clone()
    .avif({ quality: 62, effort: 6 })
    .toFile(path.join(outputDir, `${filePrefix}.avif`))
  await baseDesktop
    .clone()
    .webp({ quality: 82 })
    .toFile(path.join(outputDir, `${filePrefix}.webp`))
  await baseDesktop
    .clone()
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, `${filePrefix}.png`))

  await baseMobile
    .clone()
    .avif({ quality: 60, effort: 6 })
    .toFile(path.join(outputDir, `${filePrefix}-mobile.avif`))
  await baseMobile
    .clone()
    .webp({ quality: 80 })
    .toFile(path.join(outputDir, `${filePrefix}-mobile.webp`))
  await baseMobile
    .clone()
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, `${filePrefix}-mobile.png`))
}

async function main() {
  await mkdir(outputDir, { recursive: true })
  const overrides = parseOverrideArgs()
  const inputs = {
    hero: overrides.hero ?? defaultInputs.hero,
    portraitOne: overrides.portraitOne ?? defaultInputs.portraitOne,
    portraitTwo: overrides.portraitTwo ?? defaultInputs.portraitTwo,
  }

  const prepared = await Promise.all([
    ensureReadableBySharp(inputs.hero),
    ensureReadableBySharp(inputs.portraitOne),
    ensureReadableBySharp(inputs.portraitTwo),
  ])

  try {
    await writeResponsiveVariants(prepared[0].source, 'home-lounge-hero', 1600, 900)
    await writeResponsiveVariants(prepared[1].source, 'home-lounge-portrait-one', 1000, 700)
    await writeResponsiveVariants(prepared[2].source, 'home-lounge-portrait-two', 1000, 700)

    console.log('Home lounge assets generated:')
    console.log('- public/theme/home-lounge-hero(.avif|.webp|.png + mobile variants)')
    console.log('- public/theme/home-lounge-portrait-one(.avif|.webp|.png + mobile variants)')
    console.log('- public/theme/home-lounge-portrait-two(.avif|.webp|.png + mobile variants)')
  } finally {
    await Promise.all(prepared.map((item) => item.cleanup()))
  }
}

main().catch((error) => {
  console.error('Failed to generate home lounge assets:', error.message)
  process.exitCode = 1
})
