import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const guidesDir = path.join(__dirname, '..', 'content', 'city-guides')
const templatePath = path.join(__dirname, 'templates', 'city-guide.md')

function todayLocalISO() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseArgs(argv) {
  const args = { slug: '', title: '', description: '', cluster: 'Salary Cluster' }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--slug') args.slug = argv[++i]?.trim() ?? ''
    else if (arg === '--title') args.title = argv[++i]?.trim() ?? ''
    else if (arg === '--description') args.description = argv[++i]?.trim() ?? ''
    else if (arg === '--cluster') args.cluster = argv[++i]?.trim() ?? 'Salary Cluster'
    else if (!arg.startsWith('--') && !args.slug) args.slug = arg.trim()
  }
  return args
}

function usage() {
  console.log(`Usage:
  npm run new:city-guide -- --slug <slug> --title "<title>" --description "<description>"
  npm run new:city-guide -- <slug> --title "<title>" --description "<description>"

Date is set automatically from the system clock (today: ${todayLocalISO()}).`)
}

const { slug, title, description, cluster } = parseArgs(process.argv.slice(2))

if (!slug || !title || !description) {
  usage()
  process.exit(1)
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('Error: slug must be kebab-case (e.g. where-does-3000-go-furthest-2026)')
  process.exit(1)
}

const outPath = path.join(guidesDir, `${slug}.md`)
if (fs.existsSync(outPath)) {
  console.error(`Error: ${outPath} already exists`)
  process.exit(1)
}

const template = fs.readFileSync(templatePath, 'utf8')
const date = todayLocalISO()
const body = template
  .replaceAll('{{SLUG}}', slug)
  .replaceAll('{{TITLE}}', title)
  .replaceAll('{{DATE}}', date)
  .replaceAll('{{DESCRIPTION}}', description)
  .replace('cluster: "Salary Cluster"', `cluster: "${cluster}"`)

fs.mkdirSync(guidesDir, { recursive: true })
fs.writeFileSync(outPath, body, 'utf8')

console.log(`Created ${outPath}`)
console.log(`date: "${date}"`)
console.log(`URL: /city-guides/${slug}`)
