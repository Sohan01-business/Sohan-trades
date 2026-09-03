// Runs after `vite build`. Walks dist/ and writes a manifest of every
// built file so the service worker can precache the exact app shell
// for this build, without needing to know Vite's hashed filenames
// ahead of time.
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const DIST = new URL('../dist', import.meta.url).pathname

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else out.push('./' + relative(DIST, full).split('\\').join('/'))
  }
  return out
}

const files = walk(DIST).filter((f) => !f.endsWith('precache-manifest.json'))
writeFileSync(join(DIST, 'precache-manifest.json'), JSON.stringify({ files, generatedAt: Date.now() }, null, 2))
console.log(`[tradevault] precache manifest written with ${files.length} files`)
