import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const root = process.cwd()
if (existsSync(join(root, '.env'))) {
  for (const line of (await readFile(join(root, '.env'), 'utf8')).split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
}
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' }
const json = (res, status, payload) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(payload)) }
const fallback = ({ question = '', answer = '' }) => {
  const words = answer.trim().split(/\s+/).filter(Boolean).length
  const hasOutcome = /(%|percent|increased|reduced|grew|saved|result|impact|metric|users?)/i.test(answer)
  const hasStructure = /(situation|context|challenge|first|then|finally|because|result)/i.test(answer)
  const hasPersonalAction = /\b(I|I led|I decided|I built|I created|I worked|I changed)\b/i.test(answer)
  const hasSpecificDetail = /\b(week|month|day|team|customer|project|launch|deadline|budget|stakeholder)\b/i.test(answer)
  const score = Math.max(20, Math.min(100, Math.round(18 + Math.min(words, 120) * .32 + (hasOutcome ? 22 : 0) + (hasStructure ? 16 : 0) + (hasPersonalAction ? 14 : 0) + (hasSpecificDetail ? 10 : 0))))
  const gaps = [!hasStructure && 'give the story a clear beginning, action, and ending', !hasPersonalAction && 'make your personal contribution clearer', !hasOutcome && 'finish with a measurable result or concrete change', !hasSpecificDetail && 'add one specific detail that makes the example credible'].filter(Boolean)
  return {
    source: 'local-coach',
    level: score < 55 ? 'Needs improvement' : score < 75 ? 'Developing well' : 'Interview-ready',
    summary: score < 55 ? `This answer is ${score}/100 and needs improvement before an interview. Start by learning to ${gaps[0] || 'make your example more specific'}.` : `This answer is ${score}/100. ${gaps[0] ? `To improve it, ${gaps[0]}.` : 'It has a clear, interview-ready shape.'}`,
    score,
    strengths: [hasStructure ? 'Your answer has a recognizable story shape.' : 'You stayed focused on the question.', hasPersonalAction ? 'You described your own contribution.' : 'You kept the answer concise.'],
    nextStep: gaps[0] ? `Rewrite the answer to ${gaps[0]}.` : 'Keep this structure and make the result the final sentence.',
    rewrite: `Try this structure: “The situation was [specific context]. I decided to [your action] because [reason]. The result was [measurable outcome].”`,
    followUp: `What was the clearest outcome of your work on: “${question.slice(0, 90)}…”?`
  }
}
async function coach(input) {
  if (!process.env.OPENAI_API_KEY) return fallback(input)
  const prompt = `You are a warm, precise interview coach. Evaluate the answer for clear story structure, the candidate's personal action, specific detail, and measurable outcome. Use a rigorous 0-100 score. For scores below 55, say plainly that the response needs improvement before an interview and give one focused action. Do not make hiring predictions or infer personality traits. Return only valid JSON with these fields: level (Needs improvement, Developing well, or Interview-ready), summary (one sentence), score (integer 0-100), strengths (array of two short strings), nextStep (one concrete sentence), rewrite (a concise answer framework), followUp (one focused question).\n\nInterview question: ${input.question}\nCandidate answer: ${input.answer}`
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', input: prompt, text: { format: { type: 'json_object' } } })
  })
  if (!response.ok) throw new Error(`AI provider returned ${response.status}`)
  const data = await response.json()
  const text = data.output_text || data.output?.flatMap(x => x.content || []).find(x => x.type === 'output_text')?.text
  if (!text) throw new Error('AI provider returned no text')
  return { source: 'openai', ...JSON.parse(text) }
}
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname === '/api/health') return json(res, 200, { status: 'ok', ai: process.env.OPENAI_API_KEY ? 'openai' : 'local-coach' })
  if (url.pathname === '/api/coach' && req.method === 'POST') {
    let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 20_000) return json(res, 413, { error: 'Answer is too long.' }) }
    try { const input = JSON.parse(body); if (typeof input.answer !== 'string' || !input.answer.trim()) return json(res, 400, { error: 'Please add an answer first.' }); return json(res, 200, await coach(input)) }
    catch (error) { console.error('Coach request failed:', error.message); return json(res, 200, { ...fallback(JSON.parse(body || '{}')), source: 'local-coach', notice: 'The AI service is unavailable, so we used a private local coaching guide.' }) }
  }
  const requested = url.pathname === '/' ? 'index.html' : url.pathname.slice(1)
  const file = normalize(join(root, requested))
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden') }
  try { const body = await readFile(file); res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }); res.end(body) }
  catch { res.writeHead(404); res.end('Not found') }
}).listen(4173, () => console.log(`AI Interview Coach running at http://localhost:4173 (AI: ${process.env.OPENAI_API_KEY ? 'OpenAI' : 'local coaching fallback'})`))
