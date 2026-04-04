import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

// Simple frontmatter parser (gray-matter may not be importable via tsx in all setups)
function parseFrontmatter(content: string): { data: Record<string, string>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/m)
  if (!match) return { data: {}, body: content }
  const yaml = match[1]
  const body = match[2]
  const data: Record<string, string> = {}
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(\w+):\s*['"]?(.*?)['"]?\s*$/)
    if (m) data[m[1]] = m[2]
  }
  return { data, body }
}

function stripMdx(text: string): string {
  // Remove import/export statements
  text = text.replace(/^(import|export)\s[^\n]*/gm, '')
  // Remove JSX tags
  text = text.replace(/<[A-Z][^>]*\/>/g, '')
  text = text.replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, '')
  text = text.replace(/<[a-z][^>]*>/g, '')
  text = text.replace(/<\/[a-z][^>]*>/g, '')
  // Remove JSX expressions
  text = text.replace(/\{[^}]*\}/g, '')
  // Remove heading markers (but keep text)
  text = text.replace(/^#{1,6}\s+/gm, '')
  // Remove markdown link syntax but keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  // Remove inline code backticks
  text = text.replace(/`[^`]+`/g, (m) => m.slice(1, -1))
  // Remove code fences
  text = text.replace(/```[\s\S]*?```/g, '')
  // Remove bold/italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/\*([^*]+)\*/g, '$1')
  // Collapse whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text
}

interface SearchEntry {
  title: string
  sectionTitle: string
  excerpt: string
  href: string
}

function getAllMdxFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      results.push(...getAllMdxFiles(full))
    } else if (entry.endsWith('.mdx')) {
      results.push(full)
    }
  }
  return results
}

function fileToHref(filePath: string, baseDir: string): string {
  // content/docs/en/ble-integration/gatt-profile.mdx -> /docs/ble-integration/gatt-profile
  const rel = relative(baseDir, filePath)
  // rel = "ble-integration/gatt-profile.mdx"
  const withoutExt = rel.replace(/\.mdx$/, '')
  return `/docs/${withoutExt}`
}

const contentDir = join(process.cwd(), 'content', 'docs', 'en')
const outputPath = join(process.cwd(), 'public', 'search-index.json')

const files = getAllMdxFiles(contentDir)
const entries: SearchEntry[] = []

for (const filePath of files) {
  const raw = readFileSync(filePath, 'utf-8')
  const { data, body } = parseFrontmatter(raw)
  const pageTitle = data.title || 'Untitled'
  const href = fileToHref(filePath, contentDir)

  // Split at ## headings to create sections
  const sectionRegex = /^##\s+(.+)$/m
  const parts = body.split(/(?=^##\s)/m)

  for (const part of parts) {
    const headingMatch = part.match(/^##\s+(.+)/)
    const sectionTitle = headingMatch ? headingMatch[1].trim() : pageTitle

    const stripped = stripMdx(part)
    const excerpt = stripped.replace(/\s+/g, ' ').trim().slice(0, 200)

    if (excerpt.length < 10) continue

    entries.push({
      title: pageTitle,
      sectionTitle,
      excerpt,
      href,
    })
  }
}

writeFileSync(outputPath, JSON.stringify(entries, null, 2))
console.log(`Generated ${entries.length} search entries -> ${outputPath}`)
