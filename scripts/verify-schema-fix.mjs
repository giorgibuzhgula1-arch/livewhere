/** Validates strict OpenAI schema: index must be in city items required array. */
import { readFileSync } from 'fs'
import { resolve } from 'path'

const src = readFileSync(resolve(process.cwd(), 'lib/recommendation/index.ts'), 'utf8')
const match = src.match(
  /items:\s*\{[\s\S]*?required:\s*\[([^\]]+)\][\s\S]*?index:\s*\{\s*type:\s*"integer"\s*\}/
)
if (!match) {
  console.error('FAIL: could not parse city items schema from index.ts')
  process.exit(1)
}
const required = match[1]
if (!required.includes('"index"')) {
  console.error('FAIL: index is in properties but not in required (breaks strict: true)')
  process.exit(1)
}
console.log('PASS: index is in required array for strict schema')
