import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './styles.css'

const questions = [
  { category: 'Behavioral', text: 'Tell me about a time you turned an ambiguous problem into a clear plan.', hint: 'Use a concise situation, your decisions, and a measurable outcome.' },
  { category: 'Product thinking', text: 'How would you decide whether a new feature has earned a wider rollout?', hint: 'Frame the user need, success metric, and an experiment.' },
  { category: 'Collaboration', text: 'Describe a disagreement with a teammate and how you resolved it.', hint: 'Show curiosity, a concrete action, and what changed.' }
]
const questionPool = [...questions,
  { category: 'Leadership', text: 'Tell me about a time you influenced a decision without formal authority.', hint: 'Explain the stakeholders, your reasoning, and the result.' },
  { category: 'Problem solving', text: 'Describe a difficult problem where the first approach did not work.', hint: 'Show how you diagnosed the issue and changed course.' },
  { category: 'Communication', text: 'How have you made a complex idea understandable for a non-technical audience?', hint: 'Use one example and explain how you measured understanding.' },
  { category: 'Execution', text: 'Tell me about a time you delivered an important result under a tight deadline.', hint: 'Focus on prioritization, trade-offs, and the outcome.' },
  { category: 'Learning', text: 'Describe feedback that changed how you work.', hint: 'Share the feedback, your action, and what improved.' },
  { category: 'Strategy', text: 'How would you decide which of two competing customer problems to solve first?', hint: 'Make your criteria and reasoning explicit.' }
]
const engineeringQuestions = [
  { category: 'Technical judgment', text: 'Tell me about a technical decision where you had to balance speed, reliability, and maintainability.', hint: 'Explain the constraints, trade-off, decision, and outcome.' },
  { category: 'Incident response', text: 'Describe a production issue you investigated. How did you isolate the cause and prevent recurrence?', hint: 'Show your reasoning, actions, and lasting result.' },
  { category: 'Collaboration', text: 'How did you explain a technical risk to a non-technical stakeholder and influence the plan?', hint: 'Make the options and decision clear.' },
  { category: 'Systems thinking', text: 'How would you decide whether to refactor an existing service or ship a targeted workaround?', hint: 'State the evidence and trade-offs you would use.' }
]

async function readApiResponse(response) {
  try {
    return await response.json()
  } catch {
    return { error: { message: 'The API returned HTML instead of JSON. Check that the Netlify API function is deployed and its redirect is active.' } }
  }
}

function Icon({ children }) { return <span className="icon" aria-hidden="true">{children}</span> }

function Layout({ children, theme, setTheme, user, onLogout }) {
  const nav = [['/', 'Overview', '◌'], ['/practice', 'Practice', '◉'], ['/reports', 'Reports', '▤'], ['/growth', 'Growth', '⌁']]
  if (user?.role === 'admin') nav.push(['/admin', 'Admin', 'âœ¦'])
  const visibleNav = user?.role === 'admin' ? nav.filter(item => item[0] === '/admin') : nav
  return <div className={`app ${theme}`}>
    <aside className="sidebar">
      <NavLink className="brand" to="/"><span className="brand-mark">✦</span><span>narrate</span></NavLink>
      <p className="eyebrow rail-label">WORKSPACE</p>
      <nav>{visibleNav.map(([to, label, glyph]) => <NavLink end={to === '/'} key={to} to={to} className="nav-item"><Icon>{glyph}</Icon>{label}</NavLink>)}</nav>
      <div className="sidebar-bottom">
        <button className="theme-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><Icon>{theme === 'dark' ? '☼' : '◐'}</Icon>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
        <button className="profile-chip" onClick={onLogout} title="Logout"><span className="avatar">{user?.name?.split(' ').map(part => part[0]).join('').slice(0,2) || 'US'}</span><span><b>{user?.name || 'User'}</b><small>{user?.role === 'admin' ? 'Administrator · Logout' : 'Member · Logout'}</small></span><span>⌄</span></button>
      </div>
    </aside>
    <main>{children}</main>
  </div>
}

function ProgressRing({ value = 74 }) { return <div className="progress-ring" style={{ '--progress': `${value * 3.6}deg` }}><div><strong>{value}</strong><span>readiness</span></div></div> }

function Dashboard() {
  const navigate = useNavigate()
  return <div className="page dashboard">
    <header className="topbar"><div><p className="eyebrow">THURSDAY, JULY 30</p><h1>Good morning, Emese.</h1></div><button className="icon-button" aria-label="Notifications">◌<i /></button></header>
    <section className="hero-card"><div className="signal signal-a" /><div className="signal signal-b" /><div className="hero-copy"><p className="eyebrow">YOUR CAREER SIGNAL</p><h2>Ready for the next<br/>conversation?</h2><p>Your communication clarity is trending upward. One focused practice could move your readiness into the strong range.</p><button className="primary" onClick={() => navigate('/practice')}>Begin today’s practice <span>→</span></button></div><div className="hero-score"><ProgressRing/><p><span className="up">↑ 8 points</span> from your last comparable session</p></div></section>
    <section className="section-head"><div><p className="eyebrow">YOUR NEXT MOVE</p><h2>Practice with purpose</h2></div><button className="text-button" onClick={() => navigate('/practice')}>View library →</button></section>
    <section className="practice-grid">
      <article className="recommend-card featured"><span className="tag">RECOMMENDED</span><div className="card-orbit">◌</div><h3>Lead through ambiguity</h3><p>Senior product · Behavioral</p><div className="card-foot"><span>18 min · 5 questions</span><button onClick={() => navigate('/practice')}>Start <span>→</span></button></div></article>
      <article className="recommend-card"><span className="tag muted">QUICK DRILL</span><h3>Make your impact tangible</h3><p>Turn responsibilities into compelling outcomes.</p><div className="mini-bar"><i style={{width:'72%'}}/></div><small>Communication clarity · 8 min</small></article>
      <article className="recommend-card"><span className="tag muted">ROLE SIMULATION</span><h3>Product design panel</h3><p>A realistic cross-functional interview for your target role.</p><div className="people"><b>✦</b><b>●</b><b>◆</b><span>3 interviewers</span></div><small>45 min · Advanced</small></article>
    </section>
    <section className="insight-row"><article className="insight-card"><div><p className="eyebrow">WEEKLY RHYTHM</p><h3>3 of 4 focused days</h3></div><div className="day-bars">{[36,64,88,42,12,8,6].map((h,i)=><i className={i===2?'active':''} style={{height:h}} key={i}/>)}</div><p className="subtle">Your strongest sessions happen before 11:00.</p></article><article className="insight-card coach"><div className="coach-mark">✦</div><div><p className="eyebrow">COACH NOTE</p><h3>Pause one beat before your conclusion.</h3><p className="subtle">Your ideas are strong. A small pause makes the final point land with more confidence.</p><button className="text-button">Why this note? →</button></div></article></section>
  </div>
}

function ReviewDetails({ feedback }) {
  if (!feedback) return null
  return <section className="review-details" aria-live="polite">
    <div className="review-score"><span>Realistic score</span><strong>{feedback.score}<small>/100</small></strong></div>
    <div><p className="coach-label">Why this score</p><p>{feedback.scoreReason || feedback.summary}</p></div>
    <div><p className="coach-label">What you did well</p><p>{(feedback.strengths || []).join(' ')}</p></div>
    <div><p className="coach-label">What is missing</p><ul>{(feedback.improvements || []).slice(0, 3).map(item => <li key={item}>{item}</li>)}</ul></div>
    {feedback.professionalRewrite && <div className="review-rewrite"><p className="coach-label">Stronger response</p><p>{feedback.professionalRewrite}</p></div>}
  </section>
}

function Practice() {
  const [step, setStep] = useState(0); const [answer, setAnswer] = useState(''); const [answers, setAnswers] = useState([]); const [feedback, setFeedback] = useState(null); const [saving, setSaving] = useState(false); const [started, setStarted] = useState(false); const [listening, setListening] = useState(false); const [role, setRole] = useState('Product'); const [experience, setExperience] = useState('Mid-level'); const [sessionQuestions, setSessionQuestions] = useState([]); const [notice, setNotice] = useState(''); const navigate = useNavigate(); const recognitionRef = useRef(null); const q = sessionQuestions[step]; const questions = sessionQuestions; const evaluatedAnswerRef = useRef('')
  const startInterview = () => { const pool = role === 'Engineering' ? engineeringQuestions : questionPool; const ordered = [...pool].sort(() => Math.random() - .5); setSessionQuestions(ordered.slice(0, 3)); setStarted(true) }
  useEffect(() => {
    if (!feedback) return
    const dialog = document.createElement('section')
    dialog.className = 'coach-inline-wrap'
    const card = document.createElement('section'); card.className = 'coach-feedback-card'
    const heading = document.createElement('div'); heading.className = 'coach-feedback-heading'; heading.innerHTML = '<span>AI Coach</span><button aria-label="Close feedback">×</button>'
    const close = () => setFeedback(null)
    heading.querySelector('button').addEventListener('click', close)
    const add = (tag, value, className = '') => { const block = document.createElement('div'); if (className) block.className = className; const label = document.createElement('p'); label.className = 'coach-label'; label.textContent = tag; const body = document.createElement('p'); body.textContent = value; block.append(label, body); card.append(block) }
    const score = document.createElement('div'); score.className = 'coach-score-panel'; score.innerHTML = `<p>Score</p><strong>${feedback.score || 0}<small>/100</small></strong><i><b style="width:${Math.min(100, Math.max(0, feedback.score || 0))}%"></b></i>`; card.append(heading, score)
    if (feedback.growth?.totals) { const momentum = document.createElement('p'); momentum.className = 'coach-momentum'; const delta = feedback.growth.totals.change || 0; momentum.textContent = `${feedback.growth.totals.trend} growth: ${delta >= 0 ? '+' : ''}${delta} points across your latest answers`; card.append(momentum) }
    add('Why this score', feedback.scoreReason || feedback.summary || 'Your answer has been reviewed.')
    add('What you did well', (feedback.strengths || []).join(' ') || 'Your response has a foundation to build on.')
    const improvements = document.createElement('div'); improvements.className = 'coach-improvements'; const improvementTitle = document.createElement('p'); improvementTitle.className = 'coach-label'; improvementTitle.textContent = 'What to improve'; const list = document.createElement('ul'); ;(feedback.improvements || []).slice(0, 3).forEach(item => { const li = document.createElement('li'); li.textContent = item; list.append(li) }); improvements.append(improvementTitle, list); card.append(improvements)
    add('Better version', feedback.professionalRewrite || 'Add a concrete action and measurable result.', 'coach-rewrite')
    const continueButton = document.createElement('button'); continueButton.className = 'primary coach-continue'; continueButton.textContent = 'Continue →'; continueButton.addEventListener('click', close); card.append(continueButton)
    dialog.append(card); document.querySelector('.answer-box')?.insertAdjacentElement('afterend', dialog)
    return () => { dialog.remove() }
  }, [feedback])
  const evaluate = async (answerToEvaluate = answer) => {
    const session = JSON.parse(localStorage.getItem('interviewCoachSession') || 'null')
    if (!session?.token || !answerToEvaluate.trim() || saving || !q) return
    setSaving(true)
    try { const response = await fetch('/api/v1/coach', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ question: q.text, answer: answerToEvaluate, role, experience, previousAnswers: answers.map(item => ({ score: item.analysis?.score, question: item.question })) }) }); const body = await readApiResponse(response); if (!response.ok || body.error) throw new Error(body.error?.message); evaluatedAnswerRef.current = answerToEvaluate; setFeedback(body.data); if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const speech = new SpeechSynthesisUtterance(`Score ${body.data.score} out of 100. ${body.data.scoreReason || body.data.summary}. Strengths: ${(body.data.strengths || []).join(' ')}. Improvements: ${(body.data.improvements || []).join(' ')}`); speech.rate = 1.03; window.speechSynthesis.speak(speech) } } catch (error) { setNotice(error.message || 'AI analysis could not be completed.') } finally { setSaving(false) }
  }
  const startVoice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return setNotice('Voice input is not supported by this browser. Please type your answer or use Chrome or Edge.')
    if (listening) return recognitionRef.current?.stop()
    const recognition = new Recognition(); recognition.lang = 'en-US'; recognition.interimResults = true; recognition.continuous = false
    recognitionRef.current = recognition
    recognition.onstart = () => setListening(true)
    recognition.onresult = event => { const transcript = Array.from(event.results).map(result => result[0].transcript).join(' '); setAnswer(current => `${current}${current ? ' ' : ''}${transcript}`) }
    recognition.onerror = () => { setListening(false); setNotice('We could not transcribe that response. Please try again or type your answer.') }; recognition.onend = () => setListening(false); recognition.start()
  }
  useEffect(() => { const button = document.querySelector('.mic'); if (!button) return; button.title = listening ? 'Listening… click to stop' : 'Answer by voice'; const handler = event => { event.preventDefault(); startVoice() }; button.addEventListener('click', handler); return () => button.removeEventListener('click', handler) }, [started, listening])
  useEffect(() => { if (feedback && answer !== evaluatedAnswerRef.current) setFeedback(null) }, [answer, feedback])
  useEffect(() => { if (!started || !q || !answer.trim() || saving || answer === evaluatedAnswerRef.current) return; const timer = setTimeout(() => evaluate(answer), 1000); return () => clearTimeout(timer) }, [answer, started, saving, q?.text])
  useEffect(() => { if (!saving) return; const state = document.createElement('div'); state.className = 'ai-analysis-state'; state.textContent = 'AI is analyzing your answer…'; document.querySelector('.answer-box')?.insertAdjacentElement('afterend', state); return () => state.remove() }, [saving])
  const next = async () => {
    const session = JSON.parse(localStorage.getItem('interviewCoachSession') || 'null')
    if (!session?.token) return navigate('/')
    if (!feedback) return evaluate()
    const completedAnswers = [...answers, { question: q.text, answer, analysis: feedback }]
    if (step < questions.length - 1) { setAnswers(completedAnswers); setStep(step + 1); setAnswer(''); setFeedback(null); return }
    setSaving(true); try { const response = await fetch('/api/v1/interviews/complete', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ title: 'Lead through ambiguity', answers: completedAnswers }) }); const body = await readApiResponse(response); if (!response.ok || body.error) throw new Error(body.error?.message); localStorage.setItem('latestInterviewReport', JSON.stringify(body.data)); navigate('/reports') } catch (error) { alert(error.message || 'The report could not be saved.') } finally { setSaving(false) }
  }
  if (!started) return <div className="page practice-intro"><div className="back">← Back to workspace</div><div className="intro-card"><span className="live-dot">✦</span><p className="eyebrow">ADAPTIVE INTERVIEW PRACTICE</p><h1>Practice for your next conversation.</h1><p className="intro-copy">Pick your role and experience level. Every session uses fresh questions and feedback is based only on your current answer.</p><div className="interview-settings"><label>Target role<select value={role} onChange={e => setRole(e.target.value)}><option>Product</option><option>Engineering</option></select></label><label>Experience<select value={experience} onChange={e => setExperience(e.target.value)}><option>Entry-level</option><option>Mid-level</option><option>Senior</option></select></label></div><div className="prep"><span>◎ Voice or text</span><span>◌ Inline AI review</span><span>⌁ Stored progress</span></div><button className="primary large" onClick={startInterview}>Enter the interview <span>→</span></button></div></div>
  return <div className="interview page"><header className="interview-top"><button className="close" onClick={() => navigate('/')}>×</button><div className="interview-meta"><span className="live"><i/> LIVE PRACTICE</span><span>·</span><span>16:42 remaining</span></div><button className="end" onClick={() => navigate('/reports')}>End session</button></header><div className="interview-body"><aside className="question-rail"><p className="eyebrow">INTERVIEW FLOW</p>{questions.map((item,i)=><div className={`question-step ${i===step?'current':''} ${i<step?'done':''}`} key={item.category}><i>{i<step?'✓':i+1}</i><span>{item.category}</span></div>)}<div className="privacy-note">⌁ Your responses are used only to create this coaching report.</div></aside><section className="conversation"><div className="ai-presence"><div className="pulse one"/><div className="pulse two"/><div className="core">✦</div></div><p className="eyebrow">NARRATE COACH</p><h1>Let’s start with a story.</h1><div className="question-card"><span>{q.category}</span><p>{q.text}</p></div><p className="hint">Coach hint: {q.hint}</p><div className="answer-box"><textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Type your answer, or use the microphone…" autoFocus/><div><button className="mic" aria-label="Start voice answer">◉</button><span>{answer.length} characters</span><button className="submit-answer" disabled={!answer.trim()} onClick={next}>{step === questions.length - 1 ? 'Finish interview' : 'Continue'} <b>→</b></button></div></div></section><aside className="live-rail"><p className="eyebrow">IN THE MOMENT</p><div className="live-metric"><span>Answer pace</span><strong>Calm</strong><div><i style={{width:'68%'}}/></div></div><div className="live-metric"><span>Answer shape</span><strong>Building</strong><div><i style={{width:'45%'}}/></div></div><p className="live-copy">Live guidance stays light so you can keep your train of thought.</p></aside></div></div>
}

function Reports() { return <div className="page report"><header className="topbar"><div><p className="eyebrow">INTERVIEW REPORT · JULY 30</p><h1>Clarity under pressure.</h1><p className="subtle">Lead through ambiguity · 18 minutes · 5 questions</p></div><button className="secondary">Export report</button></header><section className="report-hero"><div className="score-block"><ProgressRing value={82}/><div><p className="eyebrow">OVERALL READINESS</p><h2>Strong foundation.</h2><p>You communicate with thoughtful structure. The next gain is making outcomes more explicit.</p></div></div><div className="delta"><span>+8</span><p>points from your last comparable practice</p></div></section><section className="metric-grid">{[['Technical depth','78','▲ 5'],['Communication','88','▲ 12'],['Confidence','81','▲ 7'],['Behavioral','80','▲ 6']].map(([n,s,d])=><article key={n}><p>{n}</p><strong>{s}</strong><span>{d}</span><div><i style={{width:`${s}%`}}/></div></article>)}</section><section className="report-columns"><article><p className="eyebrow">WHAT LANDED</p><h2>Strengths to repeat</h2><div className="evidence"><b>01</b><div><h3>You create a clear decision path</h3><p>In your rollout example, you moved naturally from uncertainty to a testable plan.</p><button className="text-button">See evidence →</button></div></div><div className="evidence"><b>02</b><div><h3>Your tone stays collaborative</h3><p>You described conflict as a shared problem, which signals senior-level partnership.</p></div></div></article><article className="plan"><p className="eyebrow">YOUR NEXT 7 DAYS</p><h2>Make impact impossible to miss.</h2><p>In two answers, the result arrived late. Practice putting the outcome in the first 20 seconds.</p><ol><li><i>1</i> Try the “impact first” quick drill <span>8 min</span></li><li><i>2</i> Revisit this question with a metric <span>12 min</span></li><li><i>3</i> Retake this interview next week <span>18 min</span></li></ol><button className="primary">Start first drill <span>→</span></button></article></section></div> }

function Growth() { const points = useMemo(()=>[40,48,45,58,59,67,74],[]); return <div className="page growth"><header className="topbar"><div><p className="eyebrow">YOUR TRAJECTORY</p><h1>Progress you can feel.</h1></div><button className="secondary">Last 90 days⌄</button></header><section className="growth-hero"><article><p className="eyebrow">INTERVIEW READINESS</p><strong>74</strong><span>+19 since your baseline</span><div className="line-chart">{points.map((p,i)=><i key={i} style={{height:p}}><b/></i>)}</div></article><article><p className="eyebrow">CURRENT STREAK</p><div className="streak">4 <span>days</span></div><p className="subtle">Two more focused practices to match your best week.</p></article></section><section className="skill-map"><div><p className="eyebrow">SKILL CONSTELLATION</p><h2>Your signal is getting clearer.</h2><p className="subtle">Tap any dimension to see the answers that shaped it.</p></div><div className="skill-list">{[['Communication',88],['Problem solving',76],['Technical depth',78],['Behavioral',80],['Delivery',69]].map(([n,v])=><div key={n}><span>{n}</span><i><b style={{width:`${v}%`}}/></i><strong>{v}</strong></div>)}</div></section></div> }

const api = async (path, token) => {
  const response = await fetch(`/api/v1${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const body = await readApiResponse(response)
  if (!response.ok || body.error) throw new Error(body.error?.message || 'Request failed')
  return body.data
}

function GrowthTracking({ token }) {
  const [growth, setGrowth] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api('/growth', token).then(setGrowth).catch(item => setError(item.message)) }, [token])
  if (error) return <div className="page growth"><p className="eyebrow">GROWTH TRACKING</p><h1>Progress unavailable.</h1><p className="subtle">{error}</p></div>
  if (!growth) return <div className="page growth"><p className="eyebrow">GROWTH TRACKING</p><h1>Loading your progress...</h1></div>
  const hasData = growth.totals.evaluatedAnswers > 0
  const trendClass = growth.totals.trend.toLowerCase().replace(/\s/g, '-')
  return <div className="page growth growth-tracking"><header className="topbar"><div><p className="eyebrow">GROWTH TRACKING</p><h1>Progress backed by every answer.</h1><p className="subtle">Metrics update immediately after each AI evaluation.</p></div></header>{!hasData ? <section className="growth-empty"><span>✦</span><h2>Your first signal starts here.</h2><p>Complete an AI evaluation in Practice and your trends, competencies, and recommendations will appear here.</p></section> : <><section className="growth-summary"><article><p className="eyebrow">AVERAGE AI SCORE</p><strong>{growth.totals.averageScore}</strong><span>/100 across {growth.totals.evaluatedAnswers} evaluated answers</span></article><article><p className="eyebrow">CURRENT TREND</p><strong className={trendClass}>{growth.totals.trend}</strong><span>{growth.totals.change >= 0 ? '+' : ''}{growth.totals.change} points versus recent history</span></article><article><p className="eyebrow">CONSISTENCY REWARD</p><strong>{growth.totals.consistency}%</strong><span>Built from regular practice and positive momentum</span></article></section><section className="growth-chart-card"><div><p className="eyebrow">ANSWER-BY-ANSWER TREND</p><h2>Your latest performance</h2></div><div className="growth-bars">{growth.points.slice(-16).map((point, index) => <div key={`${point.createdAt}-${index}`} title={`${point.score}/100`}><i style={{height:`${Math.max(point.score, 8)}%`}}/><span>{index + 1}</span></div>)}</div></section><section className="growth-detail-grid"><article className="competency-card"><p className="eyebrow">COMPETENCY MAP</p><h2>Strengths and opportunities</h2>{Object.entries(growth.averages).filter(([key]) => key !== 'score').map(([key, value]) => <div className="competency-row" key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><i><b style={{width:`${value}%`}}/></i><strong>{value}</strong></div>)}</article><article className="recommendations-card"><p className="eyebrow">PERSONALIZED NEXT STEPS</p><h2>Focus your next answer.</h2>{growth.recommendations.map((item, index) => <p key={item}><b>{String(index + 1).padStart(2, '0')}</b>{item}</p>)}<div className="growth-strengths"><span>Strongest: {growth.strongest.map(item => item.label).join(' and ')}</span><span>Focus area: {growth.weakest[0]?.label}</span></div></article></section></>}</div>
}

function AdminDashboard({ token }) {
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    api('/admin/overview', token).then(setOverview).catch(error => setError(error.message))
    api('/admin/users', token).then(setUsers).catch(() => {})
  }, [token])
  if (error) return <div className="page"><h1>Admin access required.</h1><p className="subtle">{error}</p></div>
  if (!overview) return <div className="page"><p className="eyebrow">ADMINISTRATION</p><h1>Loading dashboard...</h1></div>
  const totals = overview.totals
  return <div className="page report"><header className="topbar"><div><p className="eyebrow">ADMINISTRATION</p><h1>Workspace overview.</h1><p className="subtle">Users, interviews, and recent activity.</p></div></header><section className="metric-grid">{[['Registered users', totals.users], ['All interviews', totals.interviews], ['Completed', totals.completed], ['Average score', totals.averageScore]].map(([label, value]) => <article key={label}><p>{label}</p><strong>{value}</strong><div><i style={{width:'100%'}}/></div></article>)}</section><section className="report-columns"><article><p className="eyebrow">RECENT ACTIVITY</p><h2>Latest interviews</h2>{overview.recent.length ? overview.recent.map((item, index) => <div className="evidence" key={item.id}><b>{String(index + 1).padStart(2, '0')}</b><div><h3>{item.title}</h3><p>{item.name} · {item.email} · {item.status}{item.overallScore !== null ? ` · ${item.overallScore}/100` : ''}</p></div></div>) : <p className="subtle">No interviews yet.</p>}</article><article className="plan"><p className="eyebrow">USERS</p><h2>Registered accounts</h2>{users.slice(0, 6).map(user => <div className="evidence" key={user.id}><b>{user.role === 'admin' ? 'AD' : 'US'}</b><div><h3>{user.name}</h3><p>{user.email} · {user.interviewCount} interviews</p></div></div>)}</article></section></div>
}

function ProfessionalAdminDashboard({ token }) {
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [reports, setReports] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([api('/admin/overview', token), api('/admin/users', token), api('/admin/reports', token)])
      .then(([overviewData, userData, reportData]) => { setOverview(overviewData); setUsers(userData); setReports(reportData) })
      .catch(error => setError(error.message))
  }, [token])
  if (error) return <div className="page"><p className="eyebrow">ADMINISTRATION</p><h1>Access unavailable.</h1><p className="subtle">{error}</p></div>
  if (!overview) return <div className="page"><p className="eyebrow">ADMINISTRATION</p><h1>Loading system data...</h1></div>
  const totals = overview.totals
  return <div className="page report admin-dashboard"><header className="topbar"><div><p className="eyebrow">ADMIN CONTROL CENTER</p><h1>Platform intelligence.</h1><p className="subtle">A complete view of users, practice reports, and AI coaching activity.</p></div><button className="secondary" onClick={() => window.location.reload()}>Refresh data</button></header><section className="report-hero"><div className="score-block"><ProgressRing value={Math.min(totals.averageScore || 0, 100)}/><div><p className="eyebrow">AVERAGE READINESS</p><h2>{totals.averageScore || 0}/100 across the platform.</h2><p>{totals.reports} complete AI reports are securely stored and available for review.</p></div></div></section><section className="metric-grid">{[['Total users', totals.users], ['Practice sessions', totals.interviews], ['AI reports', totals.reports], ['Average score', totals.averageScore || 0]].map(([label, value]) => <article key={label}><p>{label}</p><strong>{value}</strong><div><i style={{width:'100%'}}/></div></article>)}</section><section className="report-columns"><article><p className="eyebrow">ALL USERS</p><h2>Account directory</h2><div className="admin-list">{users.map(user => <div className="evidence" key={user.id}><b>{user.role === 'admin' ? 'AD' : 'US'}</b><div><h3>{user.name}</h3><p>{user.email} · {user.role} · {user.reportCount} reports · average {user.averageScore || 0}/100</p></div></div>)}</div></article><article className="plan"><p className="eyebrow">ALL AI REPORTS</p><h2>Practice activity</h2><div className="admin-list">{reports.map(report => <div className="evidence" key={report.id}><b>{report.overallScore}</b><div><h3>{report.title}</h3><p>{report.name} · {report.email}</p><p>{new Date(report.createdAt).toLocaleString()}</p></div></div>)}{!reports.length && <p className="subtle">No reports have been created yet.</p>}</div></article></section></div>
}

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login'), [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const submit = async event => {
    event.preventDefault(); setMessage('')
    if (mode === 'register' && name.trim().length < 2) return setMessage('Emri duhet të ketë të paktën 2 karaktere.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setMessage('Shkruani një adresë email të vlefshme.')
    if (password.length < 8) return setMessage('Fjalëkalimi duhet të ketë të paktën 8 karaktere.')
    setBusy(true)
    try {
      const response = await fetch(`/api/v1/auth/${mode}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name, email, password}) })
      const body = await readApiResponse(response); if (!response.ok || body.error) throw new Error(body.error?.message || 'Unable to continue.')
      localStorage.setItem('interviewCoachSession', JSON.stringify(body.data)); onAuthenticated(body.data)
    } catch (error) { setMessage(error.message); setBusy(false) }
  }
  return <div className="page practice-intro"><div className="intro-card"><span className="live-dot">âœ¦</span><p className="eyebrow">YOUR PRIVATE WORKSPACE</p><h1>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1><p className="intro-copy">{mode === 'login' ? 'Sign in to continue your interview practice.' : 'Your interview answers and reports stay connected to your account.'}</p><form className="auth-form" onSubmit={submit}>{mode === 'register' && <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required/>}<input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email address" required/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" minLength="8" placeholder="Password (8+ characters)" required/>{message && <p className="subtle">{message}</p>}<button className="primary large" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</button></form><button className="text-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage('') }}>{mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button></div></div>
}

function SavedReports() {
  const [reports, setReports] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('interviewCoachSession') || 'null')
    if (!session?.token) { setError('Sign in to view your saved practice reports.'); return }
    api('/reports', session.token).then(items => { setReports(items); const latest = JSON.parse(localStorage.getItem('latestInterviewReport') || 'null'); setSelected(latest || items[0] || null) }).catch(e => setError(e.message))
  }, [])
  const analysis = selected?.analysis || {}
  const dimensions = selected?.dimensions || {}
  return <div className="page report"><header className="topbar"><div><p className="eyebrow">YOUR SAVED REPORTS</p><h1>Practice history.</h1><p className="subtle">Every completed practice and AI analysis is stored securely in your account.</p></div></header>{error ? <p className="subtle">{error}</p> : !selected ? <p className="subtle">No completed practices yet. Start a practice to create your first report.</p> : <><section className="report-hero"><div className="score-block"><ProgressRing value={selected.overallScore || selected.overall_score || 0}/><div><p className="eyebrow">OVERALL READINESS</p><h2>{analysis.summary || 'Your latest practice.'}</h2><p>{selected.title || 'Interview practice'}</p></div></div></section><section className="metric-grid">{Object.entries(dimensions).map(([label, value]) => <article key={label}><p>{label}</p><strong>{value}</strong><div><i style={{width:`${value}%`}}/></div></article>)}</section><section className="report-columns"><article><p className="eyebrow">AI COACHING</p><h2>What to improve</h2>{(analysis.improvements || []).map((item, index) => <div className="evidence" key={item}><b>{String(index + 1).padStart(2, '0')}</b><div><p>{item}</p></div></div>)}<div className="evidence"><b>PRO</b><div><h3>Professional formulation</h3><p>{analysis.professionalRewrite}</p></div></div></article><article className="plan"><p className="eyebrow">PAST REPORTS</p><h2>All practices</h2>{reports.map(report => <button className="text-button" style={{display:'block', padding:'10px 0'}} key={report.id} onClick={() => setSelected(report)}>{report.title} · {report.overallScore}/100</button>)}</article></section></>}</div>
}

function UserOnly({ session, children }) { return session?.user?.role === 'user' ? children : <Navigate to={session?.user?.role === 'admin' ? '/admin' : '/'} replace/> }
function AdminOnly({ session, children }) { return session?.user?.role === 'admin' ? children : <Navigate to="/" replace/> }

function AppContent({ theme, setTheme, session, onAuthenticated, onLogout }) {
  if (!session?.token) return <Routes><Route path="*" element={<AuthPage onAuthenticated={onAuthenticated}/>}/></Routes>
  const home = session.user.role === 'admin' ? <Navigate to="/admin" replace/> : <Dashboard/>
  return <Layout theme={theme} setTheme={setTheme} user={session.user} onLogout={onLogout}><Routes><Route path="/" element={home}/><Route path="/practice" element={<UserOnly session={session}><Practice/></UserOnly>}/><Route path="/reports" element={<UserOnly session={session}><SavedReports/></UserOnly>}/><Route path="/growth" element={<UserOnly session={session}><GrowthTracking token={session.token}/></UserOnly>}/><Route path="/admin" element={<AdminOnly session={session}><ProfessionalAdminDashboard token={session.token}/></AdminOnly>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Layout>
}

function App() {
  const [theme,setTheme] = useState('light')
  const [session, setSession] = useState(() => { try { return JSON.parse(localStorage.getItem('interviewCoachSession')) } catch { return null } })
  const [checkingSession, setCheckingSession] = useState(() => Boolean(session?.token))
  useEffect(() => {
    if (!session?.token) { setCheckingSession(false); return }
    fetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async response => { const body = await readApiResponse(response); if (!response.ok || body.error) throw new Error('Invalid session'); const verified = { ...session, user: body.data }; localStorage.setItem('interviewCoachSession', JSON.stringify(verified)); setSession(verified) })
      .catch(() => { localStorage.removeItem('interviewCoachSession'); setSession(null) })
      .finally(() => setCheckingSession(false))
  }, [])
  const logout = () => { localStorage.removeItem('interviewCoachSession'); localStorage.removeItem('latestInterviewReport'); setSession(null) }
  if (checkingSession) return <div className="session-loading"><span>Loading</span><p>Verifying your session…</p></div>
  return <BrowserRouter><AppContent theme={theme} setTheme={setTheme} session={session} onAuthenticated={setSession} onLogout={logout}/></BrowserRouter>
}
createRoot(document.getElementById('root')).render(<App />)
