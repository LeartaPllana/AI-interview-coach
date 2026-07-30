require('dotenv').config()
const crypto = require('crypto')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const mysql = require('mysql2/promise')

const app = express()
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))
let pool
const databaseName = process.env.DB_NAME || 'ai_interview_coach'

const hash = password => { const salt = crypto.randomBytes(16).toString('hex'); return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}` }
const validPassword = (password, stored) => { const [salt, saved] = String(stored).split(':'); if (!salt || !saved) return false; const actual = crypto.scryptSync(password, salt, 64).toString('hex'); return actual.length === saved.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(saved)) }
const sign = user => { const body = Buffer.from(JSON.stringify({ sub: user.id, exp: Date.now() + 7 * 86400000 })).toString('base64url'); return `${body}.${crypto.createHmac('sha256', process.env.JWT_SECRET).update(body).digest('base64url')}` }
const readToken = token => { try { const [body, signature] = String(token || '').split('.'); const expected = crypto.createHmac('sha256', process.env.JWT_SECRET).update(body || '').digest('base64url'); if (!body || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null; const data = JSON.parse(Buffer.from(body, 'base64url')); return data.exp > Date.now() ? data : null } catch { return null } }
const userView = user => ({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.created_at })
const auth = roles => async (req, res, next) => { try { const token = readToken(req.headers.authorization?.replace(/^Bearer\s+/i, '')); if (!token) return res.status(401).json({ error: { message: 'Please sign in.' } }); const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [token.sub]); if (!rows[0]) return res.status(401).json({ error: { message: 'Account not found.' } }); if (roles && !roles.includes(rows[0].role)) return res.status(403).json({ error: { message: 'Admin access required.' } }); req.user = rows[0]; next() } catch (error) { next(error) } }

function localAnalyse(question, answer) {
  const words = answer.trim().split(/\s+/).filter(Boolean).length
  const hasOutcome = /(%|increased|reduced|grew|saved|result|impact|metric|users?)/i.test(answer)
  const hasStructure = /(situation|context|challenge|first|then|finally|because|result)/i.test(answer)
  const hasAction = /\b(i|i led|i decided|i built|i created|i worked|i changed)\b/i.test(answer)
  const hasDetail = /\b(week|month|day|team|customer|project|launch|deadline|budget|stakeholder)\b/i.test(answer)
  const score = Math.max(20, Math.min(100, Math.round(18 + Math.min(words, 120) * .32 + (hasOutcome ? 22 : 0) + (hasStructure ? 16 : 0) + (hasAction ? 14 : 0) + (hasDetail ? 10 : 0))))
  const improvements = [!hasStructure && 'Start with a short context, then explain the action you took.', !hasAction && 'Use “I” clearly so your individual contribution is visible.', !hasOutcome && 'Finish with a measurable result or concrete impact.', !hasDetail && 'Add one specific detail such as scope, timeline, team, or customer impact.'].filter(Boolean)
  return { score, level: score < 55 ? 'Needs improvement' : score < 75 ? 'Developing well' : 'Interview-ready', summary: `This response is ${score}/100. ${improvements[0] || 'Its structure and impact are clear.'}`, strengths: [hasStructure ? 'Clear story structure.' : 'Focused on the question.', hasAction ? 'Personal contribution is visible.' : 'Concise and direct.'], improvements, professionalRewrite: `“In [specific situation], I was responsible for [your role]. I took [specific action] because [reason]. As a result, [measurable outcome].”`, followUp: `What measurable result came from your work on: “${String(question).slice(0, 80)}”?` }
}
function enrichReview(question, answer, review) {
  const text = String(answer || '').trim()
  const words = text ? text.split(/\s+/).length : 0
  const hasReasoning = /\b(because|therefore|decision|chose|trade-?off|option)\b/i.test(text)
  const hasImpact = /\b\d+(?:\.\d+)?%|\b(increased|reduced|grew|saved|result|impact|metric|users?)\b/i.test(text)
  const questionTerms = String(question || '').toLowerCase().match(/[a-z]{4,}/g) || []
  const answerTerms = new Set(text.toLowerCase().match(/[a-z]{4,}/g) || [])
  const relevance = questionTerms.length ? Math.round(100 * questionTerms.filter(term => answerTerms.has(term)).length / questionTerms.length) : 50
  return { ...review, scoreReason: review.scoreReason || `This ${review.score}/100 reflects ${relevance < 15 ? 'a weak connection to the question' : 'a relevant starting point'}, ${words < 25 ? 'limited supporting detail' : 'enough detail to evaluate'}, ${hasReasoning ? 'some visible reasoning' : 'missing decision reasoning'}, and ${hasImpact ? 'evidence of impact' : 'no measurable outcome yet'}.`, rubric: review.rubric || { relevance, clarity: Math.min(100, 20 + words * 2), structure: /\b(first|then|finally|result|context|situation)\b/i.test(text) ? 70 : 35, technicalAccuracy: 50, reasoning: hasReasoning ? 70 : 30, impact: hasImpact ? 75 : 20 } }
}
function personalisedFallback(question, answer) {
  const base = localAnalyse(question, answer), text = String(answer || '').trim(), words = text.split(/\s+/).filter(Boolean).length
  const questionTerms = String(question || '').toLowerCase().match(/[a-z]{4,}/g) || [], answerTerms = new Set(text.toLowerCase().match(/[a-z]{4,}/g) || [])
  const relevance = questionTerms.length ? questionTerms.filter(term => answerTerms.has(term)).length / questionTerms.length : .5
  const score = Math.max(0, Math.min(100, Math.round(base.score - (words < 18 ? 18 : 0) - (relevance < .12 ? 24 : 0))))
  const missing = [relevance < .12 && 'a direct connection to the interview question', words < 18 && 'enough context to understand the example', !/\b(because|therefore|so that|decision|chose)\b/i.test(text) && 'the reasoning behind your decision', !/(%|increased|reduced|grew|saved|result|impact|metric|users?)/i.test(text) && 'a measurable result'].filter(Boolean)
  const subject = text.split(/\s+/).slice(0, 10).join(' ')
  return { ...base, score, level: score < 45 ? 'Needs improvement' : score < 75 ? 'Developing well' : 'Interview-ready', summary: `Score ${score}/100 because ${relevance < .12 ? 'the response does not directly answer the question' : words < 18 ? 'the answer is too brief to prove your impact' : 'your answer has a useful foundation but needs sharper evidence'}.`, strengths: [relevance >= .12 ? 'You stayed connected to the question.' : 'You provided a starting point for an example.', /\bI\b/.test(text) ? 'Your individual contribution is visible.' : 'Your answer can be strengthened by naming your role.'], improvements: missing.length ? missing.map(item => `Add ${item}.`) : ['Make the outcome more precise and memorable.'], professionalRewrite: `In the situation where ${subject || '[describe the situation]'}, I was responsible for [your role]. I chose [specific action] because [reason]. As a result, [measurable outcome].`, followUp: `What evidence shows that your approach to “${String(question).slice(0, 70)}” was successful?` }
}
async function analyse(question, answer) {
  const fallback = enrichReview(question, answer, personalisedFallback(question, answer))
  if (!process.env.OPENAI_API_KEY) return fallback
  try {
    const prompt = `Act as a rigorous interview evaluator. Evaluate ONLY the current answer against the current question; do not assume it is correct, relevant, or complete. Score it realistically from 0 to 100 using relevance, clarity, structure, domain accuracy, reasoning, concrete examples, and measurable impact. Penalize off-topic, vague, unsupported, or incomplete answers. Return only JSON with score (0-100 integer), level, summary, scoreReason (explain the assigned score), rubric (relevance, clarity, structure, technicalAccuracy, reasoning, impact; each 0-100), strengths (two answer-specific observations), improvements (specific missing elements), professionalRewrite tailored to this answer, and followUp. Never reuse generic feedback or invent facts. Question: ${question}\nAnswer: ${answer}`
    const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', input: prompt, text: { format: { type: 'json_object' } } }) })
    if (!response.ok) return fallback
    const body = await response.json(); const text = body.output_text || body.output?.flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text
    const result = JSON.parse(text); return { ...fallback, ...result, score: Math.max(0, Math.min(100, Number(result.score) || fallback.score)) }
  } catch { return fallback }
}
const dimensions = analyses => { const avg = Math.round(analyses.reduce((sum, item) => sum + item.score, 0) / Math.max(analyses.length, 1)); return { technical: avg, communication: Math.min(100, avg + 4), confidence: Math.max(0, avg - 2), behavioral: avg } }
const answerMetrics = (question, answer, analysis) => {
  const text = String(answer || '')
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lower = text.toLowerCase()
  const hasStructure = /\b(situation|context|challenge|first|then|finally|because|result)\b/i.test(text)
  const hasProblemSolving = /\b(problem|option|decision|decided|solution|trade-?off|prioriti[sz]|analys)/i.test(text)
  const hasMeasurableResult = /\b\d+(?:\.\d+)?%|\b\d+\s*(?:days?|weeks?|months?|users?|customers?)\b|\b(increased|reduced|grew|saved|improved|impact|metric)\b/i.test(text)
  const questionWords = String(question || '').toLowerCase().match(/[a-z]{4,}/g) || []
  const answerWords = new Set(lower.match(/[a-z]{4,}/g) || [])
  const overlap = questionWords.length ? questionWords.filter(word => answerWords.has(word)).length / questionWords.length : .5
  const score = Number(analysis?.score) || 0
  return {
    score,
    communicationClarity: Math.max(0, Math.min(100, Math.round(score * .72 + Math.min(words.length, 90) * .23 + (hasStructure ? 10 : 0)))),
    answerStructure: Math.max(0, Math.min(100, Math.round(score * .62 + (hasStructure ? 30 : 0) + (words.length >= 45 ? 8 : 0)))),
    problemSolving: Math.max(0, Math.min(100, Math.round(score * .65 + (hasProblemSolving ? 25 : 0) + (hasStructure ? 7 : 0)))),
    confidence: Math.max(0, Math.min(100, Math.round(score * .72 + (/\bI\b/.test(text) ? 16 : 0) + (words.length >= 30 ? 7 : 0)))),
    measurableResults: Math.max(0, Math.min(100, Math.round(score * .42 + (hasMeasurableResult ? 48 : 0)))),
    relevance: Math.max(0, Math.min(100, Math.round(score * .7 + overlap * 30))),
  }
}
const safeMetrics = raw => { try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return {} } }
const growthSummary = rows => {
  const points = rows.map(row => ({ createdAt: row.createdAt, ...safeMetrics(row.metrics) })).reverse()
  const metricKeys = ['score', 'communicationClarity', 'answerStructure', 'problemSolving', 'confidence', 'measurableResults', 'relevance']
  const averages = Object.fromEntries(metricKeys.map(key => [key, Math.round(points.reduce((total, point) => total + (Number(point[key]) || 0), 0) / Math.max(points.length, 1))]))
  const recent = points.slice(-5), previous = points.slice(-10, -5)
  const recentScore = recent.reduce((total, point) => total + (point.score || 0), 0) / Math.max(recent.length, 1)
  const previousScore = previous.length ? previous.reduce((total, point) => total + (point.score || 0), 0) / previous.length : recentScore
  const change = Math.round(recentScore - previousScore)
  const trend = points.length < 2 ? 'Stable' : change >= 4 ? 'Improving' : change <= -4 ? 'Needs Attention' : 'Stable'
  const competencies = metricKeys.slice(1).map(key => ({ key, label: key.replace(/([A-Z])/g, ' $1').replace(/^./, value => value.toUpperCase()), value: averages[key] })).sort((a,b) => b.value - a.value)
  const weakest = competencies.slice(-2).reverse(), strongest = competencies.slice(0, 2)
  const recommendationMap = { measurableResults: 'Add one measurable outcome to your next answer.', answerStructure: 'Use a clear context, action, and result structure.', problemSolving: 'Explain the options you considered and why you chose your approach.', communicationClarity: 'Lead with the main point, then support it with one focused example.', confidence: 'State your personal contribution using clear “I” statements.', relevance: 'Answer the exact question before adding supporting context.' }
  return { totals: { evaluatedAnswers: points.length, averageScore: averages.score, trend, change, consistency: Math.min(100, Math.round(Math.min(points.length, 10) * 10 + Math.max(change, 0) / 2)) }, averages, points, strongest, weakest, recommendations: weakest.map(item => recommendationMap[item.key]), latest: points.at(-1) || null }
}

let initialisePromise
function initialise() {
  if (initialisePromise) return initialisePromise
  initialisePromise = (async () => {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.JWT_SECRET) throw new Error('DB_HOST, DB_USER and JWT_SECRET are required in .env')
  if (!/^[A-Za-z0-9_]+$/.test(databaseName)) throw new Error('Invalid DB_NAME')
  const base = { host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD }
  const bootstrap = await mysql.createConnection(base); await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); await bootstrap.end()
  pool = mysql.createPool({ ...base, database: databaseName, waitForConnections: true, connectionLimit: 10, charset: 'utf8mb4' })
  await pool.query(`CREATE TABLE IF NOT EXISTS users (id CHAR(36) PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(190) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, role ENUM('user','admin') NOT NULL DEFAULT 'user', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS interviews (id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, title VARCHAR(190) NOT NULL, status ENUM('draft','completed') NOT NULL DEFAULT 'draft', overall_score TINYINT UNSIGNED NULL, answers JSON NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS reports (id CHAR(36) PRIMARY KEY, interview_id CHAR(36) NOT NULL UNIQUE, user_id CHAR(36) NOT NULL, overall_score TINYINT UNSIGNED NOT NULL, dimensions JSON NOT NULL, analysis JSON NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS answer_evaluations (id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, question TEXT NOT NULL, answer TEXT NOT NULL, score TINYINT UNSIGNED NOT NULL, metrics JSON NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX user_evaluations_created (user_id, created_at))`)
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) { const [found] = await pool.query('SELECT id FROM users WHERE email = ?', [process.env.ADMIN_EMAIL.toLowerCase()]); if (!found[0]) await pool.query('INSERT INTO users (id,name,email,password_hash,role) VALUES (?,?,?,?,?)', [crypto.randomUUID(), process.env.ADMIN_NAME || 'Administrator', process.env.ADMIN_EMAIL.toLowerCase(), hash(process.env.ADMIN_PASSWORD), 'admin']) }
  })()
  return initialisePromise
}

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }))
app.post('/api/v1/auth/register', async (req, res, next) => { try { const { name, email, password } = req.body || {}; if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || !password || password.length < 8) return res.status(400).json({ error: { message: 'Name, valid email, and password of 8+ characters are required.' } }); const user = { id: crypto.randomUUID(), name: name.trim(), email: email.trim().toLowerCase(), role: 'user' }; await pool.query('INSERT INTO users (id,name,email,password_hash,role) VALUES (?,?,?,?,?)', [user.id, user.name, user.email, hash(password), user.role]); res.status(201).json({ data: { token: sign(user), user } }) } catch (error) { if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: { message: 'This email is already registered.' } }); next(error) } })
app.post('/api/v1/auth/login', async (req, res, next) => { try { const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [String(req.body?.email || '').trim().toLowerCase()]); if (!rows[0] || !validPassword(String(req.body?.password || ''), rows[0].password_hash)) return res.status(401).json({ error: { message: 'Email or password is incorrect.' } }); const user = userView(rows[0]); res.json({ data: { token: sign(user), user } }) } catch (error) { next(error) } })
app.get('/api/v1/auth/me', auth(), (req,res) => res.json({ data: userView(req.user) }))
app.post('/api/v1/coach', auth(['user']), async (req,res,next) => { try { const { question, answer } = req.body || {}; if (!String(answer || '').trim()) return res.status(400).json({ error: { message: 'Write an answer first.' } }); const analysis = await analyse(question, answer); const metrics = answerMetrics(question, answer, analysis); await pool.query('INSERT INTO answer_evaluations (id,user_id,question,answer,score,metrics) VALUES (?,?,?,?,?,?)', [crypto.randomUUID(), req.user.id, String(question || '').slice(0, 5000), String(answer).slice(0, 20000), metrics.score, JSON.stringify(metrics)]); const [history] = await pool.query('SELECT score, metrics, created_at AS createdAt FROM answer_evaluations WHERE user_id=? ORDER BY created_at DESC LIMIT 10', [req.user.id]); res.json({ data: { ...analysis, metrics, growth: growthSummary(history) } }) } catch (error) { next(error) } })
app.get('/api/v1/growth', auth(['user']), async (req,res,next) => { try { const [rows] = await pool.query('SELECT score, metrics, created_at AS createdAt FROM answer_evaluations WHERE user_id=? ORDER BY created_at DESC LIMIT 100', [req.user.id]); res.json({ data: growthSummary(rows) }) } catch (error) { next(error) } })
app.get('/api/v1/reports', auth(['user']), async (req,res,next) => { try { const [rows] = await pool.query('SELECT r.id, r.overall_score AS overallScore, r.dimensions, r.analysis, r.created_at AS createdAt, i.id AS interviewId, i.title FROM reports r JOIN interviews i ON i.id=r.interview_id WHERE r.user_id=? ORDER BY r.created_at DESC', [req.user.id]); res.json({ data: rows }) } catch(error){next(error)} })
app.get('/api/v1/reports/:id', auth(['user']), async (req,res,next) => { try { const [rows] = await pool.query('SELECT r.*, i.title, i.answers FROM reports r JOIN interviews i ON i.id=r.interview_id WHERE r.id=? AND r.user_id=?', [req.params.id, req.user.id]); if (!rows[0]) return res.status(404).json({ error: { message: 'Report not found.' } }); res.json({ data: rows[0] }) } catch(error){next(error)} })
app.post('/api/v1/interviews/complete', auth(['user']), async (req,res,next) => { try { const answers = Array.isArray(req.body?.answers) ? req.body.answers.slice(0, 20) : []; if (!answers.length) return res.status(400).json({ error: { message: 'At least one answer is required.' } }); const reviewed = await Promise.all(answers.map(async item => ({ question: String(item.question || ''), answer: String(item.answer || ''), analysis: await analyse(item.question, item.answer) }))); const score = Math.round(reviewed.reduce((sum, item) => sum + item.analysis.score, 0) / reviewed.length); const report = { summary: score >= 75 ? 'Strong practice. Keep making outcomes explicit.' : 'Keep practising with clearer personal actions and outcomes.', strengths: reviewed.flatMap(x => x.analysis.strengths).slice(0, 4), improvements: [...new Set(reviewed.flatMap(x => x.analysis.improvements))].slice(0, 4), professionalRewrite: reviewed[0].analysis.professionalRewrite, answers: reviewed }; const interviewId = crypto.randomUUID(), reportId = crypto.randomUUID(); await pool.query('INSERT INTO interviews (id,user_id,title,status,overall_score,answers) VALUES (?,?,?,?,?,?)', [interviewId, req.user.id, String(req.body?.title || 'Interview practice').slice(0,190), 'completed', score, JSON.stringify(reviewed)]); await pool.query('INSERT INTO reports (id,interview_id,user_id,overall_score,dimensions,analysis) VALUES (?,?,?,?,?,?)', [reportId, interviewId, req.user.id, score, JSON.stringify(dimensions(reviewed.map(x=>x.analysis))), JSON.stringify(report)]); res.status(201).json({ data: { id: reportId, interviewId, overallScore: score, dimensions: dimensions(reviewed.map(x=>x.analysis)), analysis: report } }) } catch(error){next(error)} })
app.get('/api/v1/admin/overview', auth(['admin']), async (_req,res,next) => { try { const [[users],[interviews],[reports],[score],[recent]] = await Promise.all([pool.query('SELECT COUNT(*) total FROM users'),pool.query('SELECT COUNT(*) total FROM interviews'),pool.query('SELECT COUNT(*) total FROM reports'),pool.query('SELECT ROUND(AVG(overall_score)) average FROM reports'),pool.query('SELECT r.id,r.overall_score AS overallScore,r.created_at AS createdAt,i.title,u.name,u.email FROM reports r JOIN interviews i ON i.id=r.interview_id JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC LIMIT 20')]); res.json({data:{totals:{users:users[0].total,interviews:interviews[0].total,reports:reports[0].total,averageScore:score[0].average||0},recent}}) } catch(error){next(error)} })
app.get('/api/v1/admin/users', auth(['admin']), async (_req,res,next)=>{try{const [rows]=await pool.query('SELECT u.id,u.name,u.email,u.role,u.created_at AS createdAt,COUNT(r.id) AS reportCount,ROUND(AVG(r.overall_score)) AS averageScore FROM users u LEFT JOIN reports r ON r.user_id=u.id GROUP BY u.id ORDER BY u.created_at DESC');res.json({data:rows})}catch(error){next(error)}})
app.get('/api/v1/admin/reports', auth(['admin']), async (_req,res,next)=>{try{const [rows]=await pool.query('SELECT r.id,r.overall_score AS overallScore,r.dimensions,r.analysis,r.created_at AS createdAt,i.title,u.name,u.email FROM reports r JOIN interviews i ON i.id=r.interview_id JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC');res.json({data:rows})}catch(error){next(error)}})
app.use((_req,res)=>res.status(404).json({error:{message:'Resource not found.'}}))
app.use((error,_req,res,_next)=>{console.error(error);res.status(500).json({error:{message:'Something went wrong.'}})})
if (require.main === module) {
  initialise()
    .then(() => app.listen(process.env.PORT || 3001, () => console.log(`API listening on ${process.env.PORT || 3001}`)))
    .catch(error => { console.error(`Database startup failed: ${error.message}`); process.exit(1) })
}

module.exports = { app, initialise }
