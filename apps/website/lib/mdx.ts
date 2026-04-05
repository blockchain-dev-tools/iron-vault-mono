import fs from 'fs'
import path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'content/docs')

export function getAllSlugs(locale: string = 'en'): string[][] {
  const localeDir = path.join(CONTENT_DIR, locale)
  if (!fs.existsSync(localeDir)) return []
  return walk(localeDir, localeDir)
}

function walk(base: string, dir: string): string[][] {
  const results: string[][] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walk(base, fullPath))
    } else if (entry.name.endsWith('.mdx')) {
      const rel = path.relative(base, fullPath).replace(/\.mdx$/, '')
      results.push(rel.split(path.sep))
    }
  }
  return results
}
