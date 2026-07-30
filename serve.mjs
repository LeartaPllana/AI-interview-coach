import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const root = process.cwd()
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' }
createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname
  const requested = pathname === '/' ? 'index.html' : pathname.slice(1)
  const file = normalize(join(root, requested))
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden') }
  try { const body = await readFile(file); res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }); res.end(body) }
  catch { res.writeHead(404); res.end('Not found') }
}).listen(4173, () => console.log('AI Interview Coach running at http://localhost:4173'))
