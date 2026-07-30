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

const sqQuestions = {
  Behavioral: ['Sjellore', 'Trego për një rast kur e ktheve një problem të paqartë në një plan të qartë.', 'Përdor një situatë të shkurtër, vendimet e tua dhe një rezultat të matshëm.'],
  'Product thinking': ['Mendim produkti', 'Si do të vendosje nëse një veçori e re meriton të shtrihet më gjerësisht?', 'Përcakto nevojën e përdoruesit, metrikën e suksesit dhe një eksperiment.'],
  Collaboration: ['Bashkëpunim', 'Përshkruaj një mosmarrëveshje me një koleg dhe si e zgjidhe.', 'Trego kuriozitet, një veprim konkret dhe çfarë ndryshoi.'],
  Leadership: ['Udhëheqje', 'Trego për një rast kur ndikove në një vendim pa autoritet zyrtar.', 'Shpjego palët e interesuara, arsyetimin tënd dhe rezultatin.'],
  'Problem solving': ['Zgjidhje problemesh', 'Përshkruaj një problem të vështirë ku qasja e parë nuk funksionoi.', 'Trego si e diagnostikove çështjen dhe ndryshove drejtim.'],
  Communication: ['Komunikim', 'Si e ke bërë të kuptueshme një ide komplekse për një audiencë jo-teknike?', 'Përdor një shembull dhe shpjego si e mate kuptueshmërinë.'],
  Execution: ['Zbatim', 'Trego për një rast kur arritët një rezultat të rëndësishëm nën një afat të ngushtë.', 'Fokusoju prioritizimit, kompromiseve dhe rezultatit.'],
  Learning: ['Të mësuarit', 'Përshkruaj një vlerësim që ndryshoi mënyrën si punon.', 'Ndaj vlerësimin, veprimin tënd dhe çfarë u përmirësua.'],
  Strategy: ['Strategji', 'Si do të vendosje cilin nga dy problemet konkurruese të klientëve të zgjidhje i pari?', 'Bëji të qarta kriteret dhe arsyetimin tënd.'],
  'Technical judgment': ['Gjykim teknik', 'Trego për një vendim teknik ku duhej të balancoje shpejtësinë, besueshmërinë dhe mirëmbajtjen.', 'Shpjego kufizimet, kompromisin, vendimin dhe rezultatin.'],
  'Incident response': ['Reagim ndaj incidentit', 'Përshkruaj një problem në prodhim që e hulumtove. Si e gjete shkakun dhe parandalove përsëritjen?', 'Trego arsyetimin, veprimet dhe rezultatin afatgjatë.'],
  'Systems thinking': ['Mendim sistemesh', 'Si do të vendosje nëse duhet të ristrukturosh një shërbim ekzistues apo të publikosh një zgjidhje të përkohshme?', 'Trego provat dhe kompromiset që do të përdorje.']
}
const localizedQuestions = (items, language) => language === 'sq' ? items.map(item => {
  const translated = sqQuestions[item.category]
  return translated ? { category: translated[0], text: translated[1], hint: translated[2] } : item
}) : items

async function readApiResponse(response) {
  try {
    return await response.json()
  } catch {
    return { error: { message: 'The API returned an invalid response. Check that the API server is running.' } }
  }
}

function Icon({ children }) { return <span className="icon" aria-hidden="true">{children}</span> }

function Layout({ children, theme, setTheme, language, setLanguage, user, onLogout }) {
  const albanian = language === 'sq'
  const nav = [['/', albanian ? 'Përmbledhje' : 'Overview', '◌'], ['/practice', albanian ? 'Praktikë' : 'Practice', '◉'], ['/reports', albanian ? 'Raportet' : 'Reports', '▤'], ['/growth', albanian ? 'Zhvillimi' : 'Growth', '⌁']]
  if (user?.role === 'admin') nav.push(['/admin', 'Admin', ''])
  const visibleNav = user?.role === 'admin' ? nav.filter(item => item[0] === '/admin') : nav
  return <div className={`app ${theme}`}>
    <aside className="sidebar">
      <NavLink className="brand" to="/"><span>narrate</span></NavLink>
      <p className="eyebrow rail-label">{albanian ? 'HAPËSIRA JOTE' : 'WORKSPACE'}</p>
      <nav>{visibleNav.map(([to, label, glyph]) => <NavLink end={to === '/'} key={to} to={to} className="nav-item">{glyph && <Icon>{glyph}</Icon>}{label}</NavLink>)}</nav>
      <div className="sidebar-bottom">
        <button className="theme-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><Icon>{theme === 'dark' ? '☼' : '◐'}</Icon>{theme === 'dark' ? (albanian ? 'Modë e çelët' : 'Light mode') : (albanian ? 'Modë e errët' : 'Dark mode')}</button>
        <button className="language-button" onClick={() => setLanguage(albanian ? 'en' : 'sq')} aria-label={albanian ? 'Ndrysho gjuhën' : 'Change language'}>{albanian ? 'English' : 'Shqip'}</button>
        <button className="profile-chip" onClick={onLogout} title={albanian ? 'Dil' : 'Logout'}><span className="avatar">{user?.name?.split(' ').map(part => part[0]).join('').slice(0,2) || 'US'}</span><span><b>{user?.name || 'User'}</b><small>{user?.role === 'admin' ? `Administrator · ${albanian ? 'Dil' : 'Logout'}` : `${albanian ? 'Anëtar' : 'Member'} · ${albanian ? 'Dil' : 'Logout'}`}</small></span><span>⌄</span></button>
      </div>
    </aside>
    <main>{children}</main>
  </div>
}

function ProgressRing({ value = 74, language = 'en' }) { return <div className="progress-ring" style={{ '--progress': `${value * 3.6}deg` }}><div><strong>{value}</strong><span>{language === 'sq' ? 'gatishmëri' : 'readiness'}</span></div></div> }

function Dashboard({ user, token, language = 'en' }) {
  const navigate = useNavigate()
  const sq = language === 'sq'
  const name = user?.name?.trim() || (sq ? 'aty' : 'there')
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api('/overview', token).then(setOverview).catch(item => setError(item.message)) }, [token])
  const totals = overview?.totals || { evaluatedAnswers: 0, completedInterviews: 0, averageScore: 0, activeDays: 0 }
  const growth = overview?.growth || { change: 0 }
  const activity = overview?.weeklyActivity || []
  const highestActivity = Math.max(...activity.map(item => item.count), 1)
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()
  const readinessMessage = totals.evaluatedAnswers
    ? (sq ? `Gatishmëria jote bazohet në ${totals.evaluatedAnswers} ${totals.evaluatedAnswers === 1 ? 'përgjigje të vlerësuar' : 'përgjigje të vlerësuara'} nga AI dhe përditësohet gjatë praktikës.` : `Your readiness is based on ${totals.evaluatedAnswers} AI-evaluated ${totals.evaluatedAnswers === 1 ? 'answer' : 'answers'} and updates as you practise.`)
    : (sq ? 'Përfundo një përgjigje në Praktikë për të krijuar sinjalin tënd të parë të gatishmërisë.' : 'Complete an answer in Practice to create your first personalised readiness signal.')
  const changeLabel = growth.change === 0 ? (sq ? 'Ende pa ndryshim' : 'No change yet') : `${growth.change > 0 ? '↑' : '↓'} ${Math.abs(growth.change)} ${sq ? 'pikë' : 'points'}`
  return <div className="page dashboard">
    <header className="topbar"><div><p className="eyebrow">{dateLabel}</p><h1>{sq ? 'Përshëndetje' : 'Hello'}, {name}.</h1></div><button className="icon-button" aria-label={sq ? 'Shiko raportet e ruajtura' : 'View saved reports'} title={sq ? 'Shiko raportet e ruajtura' : 'View saved reports'} onClick={() => navigate('/reports')}>▤</button></header>
  <section className="hero-card"><div className="signal signal-a" /><div className="signal signal-b" /><div className="hero-copy"><p className="eyebrow">{sq ? 'SINJALI I KARRIERËS' : 'YOUR CAREER SIGNAL'}</p><h2>{totals.evaluatedAnswers ? (sq ? 'Praktika jote,' : 'Your practice, measured.') : (sq ? 'Gati për bisedën' : 'Ready for the next')}<br/>{totals.evaluatedAnswers ? (sq ? 'e matur me të dhëna.' : 'Keep the momentum.') : (sq ? 'e radhës?' : 'conversation?')}</h2><p>{readinessMessage}</p><button className="primary" onClick={() => navigate('/practice')}>{sq ? 'Fillo praktikën e sotme' : 'Begin today’s practice'} <span>→</span></button></div><div className="hero-score"><ProgressRing value={totals.averageScore} language={language}/><p><span className={growth.change >= 0 ? 'up' : ''}>{changeLabel}</span> {totals.evaluatedAnswers > 1 ? (sq ? 'krahasuar me përgjigjet e mëparshme' : 'versus your previous answers') : (sq ? 'pas vlerësimit të parë' : 'after your first evaluation')}</p></div></section>
    <section className="section-head"><div><p className="eyebrow">{sq ? 'HAPI YT I RADHËS' : 'YOUR NEXT MOVE'}</p><h2>{sq ? 'Praktiko me qëllim' : 'Practice with purpose'}</h2></div><button className="text-button" onClick={() => navigate('/practice')}>{sq ? 'Shiko ushtrimet' : 'View library'} →</button></section>
    <section className="practice-grid">
      <article className="recommend-card featured interactive-card" onClick={() => navigate('/practice')} onKeyDown={event => event.key === 'Enter' && navigate('/practice')} tabIndex="0" role="button"><span className="tag">{sq ? 'REKOMANDUAR' : 'RECOMMENDED'}</span><div className="card-orbit">◌</div><h3>{sq ? 'Udhëhiq përmes paqartësisë' : 'Lead through ambiguity'}</h3><p>{sq ? 'Produkt senior · Sjellore' : 'Senior product · Behavioral'}</p><div className="card-foot"><span>{sq ? '18 min · 5 pyetje' : '18 min · 5 questions'}</span><button onClick={event => { event.stopPropagation(); navigate('/practice') }}>{sq ? 'Fillo' : 'Start'} <span>→</span></button></div></article>
      <article className="recommend-card interactive-card" onClick={() => navigate('/practice')} onKeyDown={event => event.key === 'Enter' && navigate('/practice')} tabIndex="0" role="button"><span className="tag muted">{sq ? 'USHTRIM I SHPEJTË' : 'QUICK DRILL'}</span><h3>{sq ? 'Bëje ndikimin tënd të dukshëm' : 'Make your impact tangible'}</h3><p>{sq ? 'Ktheji përgjegjësitë në rezultate bindëse.' : 'Turn responsibilities into compelling outcomes.'}</p><div className="mini-bar"><i style={{width:'72%'}}/></div><small>{sq ? 'Qartësia e komunikimit · 8 min' : 'Communication clarity · 8 min'}</small></article>
      <article className="recommend-card interactive-card" onClick={() => navigate('/practice')} onKeyDown={event => event.key === 'Enter' && navigate('/practice')} tabIndex="0" role="button"><span className="tag muted">{sq ? 'SIMULIM I ROLIT' : 'ROLE SIMULATION'}</span><h3>{sq ? 'Panel i dizajnit të produktit' : 'Product design panel'}</h3><p>{sq ? 'Intervistë reale me ekipe të ndryshme për rolin tënd.' : 'A realistic cross-functional interview for your target role.'}</p><div className="people"><b>✦</b><b>●</b><b>◆</b><span>{sq ? '3 intervistues' : '3 interviewers'}</span></div><small>{sq ? '45 min · Avancuar' : '45 min · Advanced'}</small></article>
    </section>
    <section className="insight-row"><article className="insight-card"><div><p className="eyebrow">{sq ? 'RITMI JAVOR' : 'WEEKLY RHYTHM'}</p><h3>{totals.activeDays} {sq ? (totals.activeDays === 1 ? 'ditë aktive këtë javë' : 'ditë aktive këtë javë') : `active ${totals.activeDays === 1 ? 'day' : 'days'} this week`}</h3></div><div className="day-bars">{activity.length ? activity.map(item => <i className={item.count === highestActivity && item.count ? 'active' : ''} style={{height: item.count ? Math.max(18, Math.round(item.count / highestActivity * 88)) : 8}} key={item.date} title={`${item.count} ${sq ? 'përgjigje të vlerësuara' : 'evaluated answers'}`}/>) : Array.from({length: 7}, (_, index) => <i style={{height:8}} key={index}/>)}</div><p className="subtle">{totals.completedInterviews ? (sq ? `${totals.completedInterviews} ${totals.completedInterviews === 1 ? 'intervistë e përfunduar' : 'intervista të përfunduara'} të ruajtura në llogarinë tënde.` : `${totals.completedInterviews} completed ${totals.completedInterviews === 1 ? 'interview' : 'interviews'} saved to your account.`) : (sq ? 'Aktiviteti do të shfaqet pas përgjigjes së parë të vlerësuar.' : 'Your activity will appear here after your first evaluated answer.')}</p></article><article className="insight-card coach"><div className="coach-mark">✦</div><div><p className="eyebrow">{sq ? 'SHËNIM NGA COACH' : 'COACH NOTE'}</p><h3>{overview?.focusArea ? (sq ? `Fokusohu te ${overview.focusArea}.` : `Focus on ${overview.focusArea}.`) : (sq ? 'Këshilla jote e radhës fillon këtu.' : 'Your next insight starts here.')}</h3><p className="subtle">{overview?.coachNote || (sq ? 'Po ngarkohet këshilla jote e personalizuar…' : 'Loading your personalised coaching note…')}</p><button className="text-button" onClick={() => navigate('/growth')}>{sq ? 'Shiko zhvillimin →' : 'View your growth →'}</button></div></article></section>
    {error && <p className="subtle">{sq ? 'Përmbledhja e fundit nuk u ngarkua:' : 'Your latest overview could not be loaded:'} {error}</p>}
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

function InlineCoachFeedback({ feedback, onClose, language = 'en' }) {
  if (!feedback) return null
  const sq = language === 'sq'
  const score = Math.min(100, Math.max(0, feedback.score || 0))
  return <section className="coach-inline-wrap" aria-live="polite"><section className="coach-feedback-card"><div className="coach-feedback-heading"><span>{sq ? 'Trajneri AI' : 'AI Coach'}</span><button type="button" aria-label={sq ? 'Mbyll vlerësimin' : 'Close feedback'} onClick={onClose}>×</button></div><div className="coach-score-panel"><p>{sq ? 'Rezultati' : 'Score'}</p><strong>{score}<small>/100</small></strong><i><b style={{width:`${score}%`}}/></i></div>{feedback.growth?.totals && <p className="coach-momentum">{feedback.growth.totals.trend} {sq ? 'zhvillim:' : 'growth:'} {feedback.growth.totals.change >= 0 ? '+' : ''}{feedback.growth.totals.change} {sq ? 'pikë në përgjigjet e fundit' : 'points across your latest answers'}</p>}<div><p className="coach-label">{sq ? 'Pse ky rezultat' : 'Why this score'}</p><p>{feedback.scoreReason || feedback.summary || (sq ? 'Përgjigjja jote u vlerësua.' : 'Your answer has been reviewed.')}</p></div><div><p className="coach-label">{sq ? 'Çfarë bëre mirë' : 'What you did well'}</p><p>{(feedback.strengths || []).join(' ') || (sq ? 'Përgjigjja jote ka një bazë të mirë.' : 'Your response has a foundation to build on.')}</p></div><div className="coach-improvements"><p className="coach-label">{sq ? 'Çfarë të përmirësosh' : 'What to improve'}</p><ul>{(feedback.improvements || []).slice(0, 3).map(item => <li key={item}>{item}</li>)}</ul></div><div className="coach-rewrite"><p className="coach-label">{sq ? 'Version më i mirë' : 'Better version'}</p><p>{feedback.professionalRewrite || (sq ? 'Shto një veprim konkret dhe një rezultat të matshëm.' : 'Add a concrete action and measurable result.')}</p></div></section></section>
}

function Practice({ language = 'en' }) {
  const sq = language === 'sq'
  const [step, setStep] = useState(0); const [answer, setAnswer] = useState(''); const [answers, setAnswers] = useState([]); const [feedback, setFeedback] = useState(null); const [saving, setSaving] = useState(false); const [started, setStarted] = useState(false); const [listening, setListening] = useState(false); const [role, setRole] = useState('Product'); const [experience, setExperience] = useState('Mid-level'); const [sessionQuestions, setSessionQuestions] = useState([]); const [notice, setNotice] = useState(''); const navigate = useNavigate(); const recognitionRef = useRef(null); const q = sessionQuestions[step]; const questions = sessionQuestions; const evaluatedAnswerRef = useRef('')
  const startInterview = () => { const pool = role === 'Engineering' || role === 'Inxhinieri' ? engineeringQuestions : questionPool; const ordered = [...localizedQuestions(pool, language)].sort(() => Math.random() - .5); setSessionQuestions(ordered.slice(0, 3)); setStarted(true) }
  const evaluate = async (answerToEvaluate = answer) => {
    const session = JSON.parse(localStorage.getItem('interviewCoachSession') || 'null')
    if (!session?.token || !answerToEvaluate.trim() || saving || !q) return
    setSaving(true)
    try { const response = await fetch('/api/v1/coach', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ question: q.text, answer: answerToEvaluate, role, experience, language, previousAnswers: answers.map(item => ({ score: item.analysis?.score, question: item.question })) }) }); const body = await readApiResponse(response); if (!response.ok || body.error) throw new Error(body.error?.message); evaluatedAnswerRef.current = answerToEvaluate; setFeedback(body.data); if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const speech = new SpeechSynthesisUtterance(`${body.data.score}. ${body.data.scoreReason || body.data.summary}. ${(body.data.strengths || []).join(' ')}. ${(body.data.improvements || []).join(' ')}`); speech.lang = language === 'sq' ? 'sq-AL' : 'en-US'; speech.rate = 1.03; window.speechSynthesis.speak(speech) } } catch (error) { setNotice(error.message || (sq ? 'Analiza nga AI nuk mund të përfundohej.' : 'AI analysis could not be completed.')) } finally { setSaving(false) }
  }
  const startVoice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return setNotice(sq ? 'Hyrja me zë nuk mbështetet nga ky shfletues. Shkruaj përgjigjen ose përdor Chrome apo Edge.' : 'Voice input is not supported by this browser. Please type your answer or use Chrome or Edge.')
    if (listening) return recognitionRef.current?.stop()
    const recognition = new Recognition(); recognition.lang = sq ? 'sq-AL' : 'en-US'; recognition.interimResults = true; recognition.continuous = false
    recognitionRef.current = recognition
    recognition.onstart = () => setListening(true)
    recognition.onresult = event => { const transcript = Array.from(event.results).map(result => result[0].transcript).join(' '); setAnswer(current => `${current}${current ? ' ' : ''}${transcript}`) }
    recognition.onerror = () => { setListening(false); setNotice(sq ? 'Nuk mund ta transkriptonim përgjigjen. Provo përsëri ose shkruaje.' : 'We could not transcribe that response. Please try again or type your answer.') }; recognition.onend = () => setListening(false); recognition.start()
  }
  useEffect(() => { if (feedback && answer !== evaluatedAnswerRef.current) setFeedback(null) }, [answer, feedback])
  const next = async () => {
    const session = JSON.parse(localStorage.getItem('interviewCoachSession') || 'null')
    if (!session?.token) return navigate('/')
    if (!feedback) return evaluate()
    const completedAnswers = [...answers, { question: q.text, answer, analysis: feedback }]
    if (step < questions.length - 1) { setAnswers(completedAnswers); setStep(step + 1); setAnswer(''); setFeedback(null); return }
    setSaving(true); try { const response = await fetch('/api/v1/interviews/complete', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ title: sq ? 'Udhëheqje në paqartësi' : 'Lead through ambiguity', language, answers: completedAnswers }) }); const body = await readApiResponse(response); if (!response.ok || body.error) throw new Error(body.error?.message); localStorage.setItem('latestInterviewReport', JSON.stringify(body.data)); navigate('/reports') } catch (error) { alert(error.message || (sq ? 'Raporti nuk mund të ruhej.' : 'The report could not be saved.')) } finally { setSaving(false) }
  }
  if (!started) return <div className="page practice-intro"><button className="back" onClick={() => navigate('/')}>← {sq ? 'Kthehu te hapësira jote' : 'Back to workspace'}</button><div className="intro-card"><span className="live-dot">✦</span><p className="eyebrow">{sq ? 'PRAKTIKË INTERVISTE ADAPTIVE' : 'ADAPTIVE INTERVIEW PRACTICE'}</p><h1>{sq ? 'Praktiko për bisedën tënde të radhës.' : 'Practice for your next conversation.'}</h1><p className="intro-copy">{sq ? 'Zgjidh rolin dhe nivelin e përvojës. Çdo seancë ka pyetje të reja dhe feedback-u bazohet vetëm në përgjigjen tënde.' : 'Pick your role and experience level. Every session uses fresh questions and feedback is based only on your current answer.'}</p><div className="interview-settings"><label>{sq ? 'Roli i synuar' : 'Target role'}<select value={role} onChange={e => setRole(e.target.value)}><option>{sq ? 'Produkt' : 'Product'}</option><option>{sq ? 'Inxhinieri' : 'Engineering'}</option></select></label><label>{sq ? 'Përvoja' : 'Experience'}<select value={experience} onChange={e => setExperience(e.target.value)}><option>{sq ? 'Fillestar' : 'Entry-level'}</option><option>{sq ? 'Niveli mesatar' : 'Mid-level'}</option><option>{sq ? 'Senior' : 'Senior'}</option></select></label></div><div className="prep"><span>◎ {sq ? 'Me zë ose tekst' : 'Voice or text'}</span><span>◌ {sq ? 'Vlerësim AI në faqe' : 'Inline AI review'}</span><span>⌁ {sq ? 'Zhvillim i ruajtur' : 'Stored progress'}</span></div><button className="primary large" onClick={startInterview}>{sq ? 'Hyr në intervistë' : 'Enter the interview'} <span>→</span></button></div></div>
  return <div className="interview page"><header className="interview-top"><button className="close" aria-label={sq ? 'Largohu nga praktika' : 'Leave practice'} title={sq ? 'Largohu nga praktika' : 'Leave practice'} onClick={() => navigate('/')}>×</button><div className="interview-meta"><span className="live"><i/> {sq ? 'PRAKTIKË LIVE' : 'LIVE PRACTICE'}</span><span>·</span><span>{sq ? '16:42 të mbetura' : '16:42 remaining'}</span></div><button className="end" onClick={() => navigate('/reports')}>{sq ? 'Shiko raportet e ruajtura' : 'View saved reports'}</button></header><div className="interview-body"><aside className="question-rail"><p className="eyebrow">{sq ? 'RRJEDHA E INTERVISTËS' : 'INTERVIEW FLOW'}</p>{questions.map((item,i)=><div className={`question-step ${i===step?'current':''} ${i<step?'done':''}`} key={item.category}><i>{i<step?'✓':i+1}</i><span>{item.category}</span></div>)}<div className="privacy-note">⌁ {sq ? 'Përgjigjet e tua përdoren vetëm për të krijuar këtë raport udhëzues.' : 'Your responses are used only to create this coaching report.'}</div></aside><section className="conversation"><div className="ai-presence"><div className="pulse one"/><div className="pulse two"/><div className="core">✦</div></div><p className="eyebrow">{sq ? 'TRAJNERI NARRATE' : 'NARRATE COACH'}</p><h1>{sq ? 'Le të fillojmë me një histori.' : 'Let’s start with a story.'}</h1><div className="question-card"><span>{q.category}</span><p>{q.text}</p></div><p className="hint">{sq ? 'Sugjerim nga trajneri:' : 'Coach hint:'} {q.hint}</p><div className="answer-box"><textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder={sq ? 'Shkruaj përgjigjen, ose përdor mikrofonin…' : 'Type your answer, or use the microphone…'} autoFocus/><div><button className={`mic ${listening ? 'listening' : ''}`} type="button" aria-label={listening ? (sq ? 'Ndalo hyrjen me zë' : 'Stop voice input') : (sq ? 'Fillo hyrjen me zë' : 'Start voice input')} title={listening ? (sq ? 'Po dëgjon… kliko për të ndalur' : 'Listening… click to stop') : (sq ? 'Përgjigju me zë' : 'Answer by voice')} onClick={startVoice}>◉</button><span>{answer.length} {sq ? 'karaktere' : 'characters'}</span><button className="submit-answer" disabled={!answer.trim() || saving} onClick={next}>{saving ? (sq ? 'AI po analizon…' : 'AI is analyzing…') : step === questions.length - 1 ? (sq ? 'Përfundo intervistën' : 'Finish interview') : feedback ? (sq ? 'Vazhdo' : 'Continue') : (sq ? 'Analizo përgjigjen' : 'Analyze answer')} <b>→</b></button></div></div>{saving && <p className="analysis-status" role="status">{sq ? 'AI po analizon përgjigjen tënde…' : 'AI is analyzing your answer…'}</p>}<InlineCoachFeedback feedback={feedback} onClose={() => setFeedback(null)} language={language}/>{notice && <p className="inline-error" role="alert">{notice}</p>}</section><aside className="live-rail"><p className="eyebrow">{sq ? 'NË KËTË MOMENT' : 'IN THE MOMENT'}</p><div className="live-metric"><span>{sq ? 'Ritmi i përgjigjes' : 'Answer pace'}</span><strong>{sq ? 'I qetë' : 'Calm'}</strong><div><i style={{width:'68%'}}/></div></div><div className="live-metric"><span>{sq ? 'Struktura e përgjigjes' : 'Answer shape'}</span><strong>{sq ? 'Në ndërtim' : 'Building'}</strong><div><i style={{width:'45%'}}/></div></div><p className="live-copy">{sq ? 'Udhëzimet live qëndrojnë të lehta që të ruash vijën e mendimit.' : 'Live guidance stays light so you can keep your train of thought.'}</p></aside></div></div>
}

function Reports() { return <div className="page report"><header className="topbar"><div><p className="eyebrow">INTERVIEW REPORT · JULY 30</p><h1>Clarity under pressure.</h1><p className="subtle">Lead through ambiguity · 18 minutes · 5 questions</p></div><button className="secondary">Export report</button></header><section className="report-hero"><div className="score-block"><ProgressRing value={82}/><div><p className="eyebrow">OVERALL READINESS</p><h2>Strong foundation.</h2><p>You communicate with thoughtful structure. The next gain is making outcomes more explicit.</p></div></div><div className="delta"><span>+8</span><p>points from your last comparable practice</p></div></section><section className="metric-grid">{[['Technical depth','78','▲ 5'],['Communication','88','▲ 12'],['Confidence','81','▲ 7'],['Behavioral','80','▲ 6']].map(([n,s,d])=><article key={n}><p>{n}</p><strong>{s}</strong><span>{d}</span><div><i style={{width:`${s}%`}}/></div></article>)}</section><section className="report-columns"><article><p className="eyebrow">WHAT LANDED</p><h2>Strengths to repeat</h2><div className="evidence"><b>01</b><div><h3>You create a clear decision path</h3><p>In your rollout example, you moved naturally from uncertainty to a testable plan.</p><button className="text-button">See evidence →</button></div></div><div className="evidence"><b>02</b><div><h3>Your tone stays collaborative</h3><p>You described conflict as a shared problem, which signals senior-level partnership.</p></div></div></article><article className="plan"><p className="eyebrow">YOUR NEXT 7 DAYS</p><h2>Make impact impossible to miss.</h2><p>In two answers, the result arrived late. Practice putting the outcome in the first 20 seconds.</p><ol><li><i>1</i> Try the “impact first” quick drill <span>8 min</span></li><li><i>2</i> Revisit this question with a metric <span>12 min</span></li><li><i>3</i> Retake this interview next week <span>18 min</span></li></ol><button className="primary">Start first drill <span>→</span></button></article></section></div> }

function Growth() { const points = useMemo(()=>[40,48,45,58,59,67,74],[]); return <div className="page growth"><header className="topbar"><div><p className="eyebrow">YOUR TRAJECTORY</p><h1>Progress you can feel.</h1></div><button className="secondary">Last 90 days⌄</button></header><section className="growth-hero"><article><p className="eyebrow">INTERVIEW READINESS</p><strong>74</strong><span>+19 since your baseline</span><div className="line-chart">{points.map((p,i)=><i key={i} style={{height:p}}><b/></i>)}</div></article><article><p className="eyebrow">CURRENT STREAK</p><div className="streak">4 <span>days</span></div><p className="subtle">Two more focused practices to match your best week.</p></article></section><section className="skill-map"><div><p className="eyebrow">SKILL CONSTELLATION</p><h2>Your signal is getting clearer.</h2><p className="subtle">Tap any dimension to see the answers that shaped it.</p></div><div className="skill-list">{[['Communication',88],['Problem solving',76],['Technical depth',78],['Behavioral',80],['Delivery',69]].map(([n,v])=><div key={n}><span>{n}</span><i><b style={{width:`${v}%`}}/></i><strong>{v}</strong></div>)}</div></section></div> }

const api = async (path, token) => {
  const response = await fetch(`/api/v1${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const body = await readApiResponse(response)
  if (!response.ok || body.error) throw new Error(body.error?.message || 'Request failed')
  return body.data
}

function GrowthTracking({ token, language = 'en' }) {
  const sq = language === 'sq'
  const [growth, setGrowth] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api('/growth', token).then(setGrowth).catch(item => setError(item.message)) }, [token])
  if (error) return <div className="page growth"><p className="eyebrow">{sq ? 'NDJEKJA E ZHVILLIMIT' : 'GROWTH TRACKING'}</p><h1>{sq ? 'Zhvillimi nuk është i disponueshëm.' : 'Progress unavailable.'}</h1><p className="subtle">{error}</p></div>
  if (!growth) return <div className="page growth"><p className="eyebrow">{sq ? 'NDJEKJA E ZHVILLIMIT' : 'GROWTH TRACKING'}</p><h1>{sq ? 'Po ngarkohet zhvillimi yt...' : 'Loading your progress...'}</h1></div>
  const hasData = growth.totals.evaluatedAnswers > 0
  const trendClass = growth.totals.trend.toLowerCase().replace(/\s/g, '-')
  return <div className="page growth growth-tracking"><header className="topbar"><div><p className="eyebrow">{sq ? 'NDJEKJA E ZHVILLIMIT' : 'GROWTH TRACKING'}</p><h1>{sq ? 'Zhvillim i mbështetur nga çdo përgjigje.' : 'Progress backed by every answer.'}</h1><p className="subtle">{sq ? 'Metrikat përditësohen pas çdo vlerësimi nga AI.' : 'Metrics update immediately after each AI evaluation.'}</p></div></header>{!hasData ? <section className="growth-empty"><span>✦</span><h2>{sq ? 'Sinjali yt i parë fillon këtu.' : 'Your first signal starts here.'}</h2><p>{sq ? 'Përfundo një vlerësim AI te Praktika dhe trendet, kompetencat dhe rekomandimet e tua do të shfaqen këtu.' : 'Complete an AI evaluation in Practice and your trends, competencies, and recommendations will appear here.'}</p></section> : <><section className="growth-summary"><article><p className="eyebrow">{sq ? 'REZULTATI MESATAR I AI' : 'AVERAGE AI SCORE'}</p><strong>{growth.totals.averageScore}</strong><span>/100 {sq ? `nga ${growth.totals.evaluatedAnswers} përgjigje të vlerësuara` : `across ${growth.totals.evaluatedAnswers} evaluated answers`}</span></article><article><p className="eyebrow">{sq ? 'TRENდი AKTUAL' : 'CURRENT TREND'}</p><strong className={trendClass}>{growth.totals.trend}</strong><span>{growth.totals.change >= 0 ? '+' : ''}{growth.totals.change} {sq ? 'pikë krahasuar me historikun e fundit' : 'points versus recent history'}</span></article><article><p className="eyebrow">{sq ? 'KONSISTENCA' : 'CONSISTENCY REWARD'}</p><strong>{growth.totals.consistency}%</strong><span>{sq ? 'Ndërtuar nga praktika e rregullt dhe përparimi pozitiv' : 'Built from regular practice and positive momentum'}</span></article></section><section className="growth-chart-card"><div><p className="eyebrow">{sq ? 'TRENDI PËRGJIGJE PAS PËRGJIGJEJE' : 'ANSWER-BY-ANSWER TREND'}</p><h2>{sq ? 'Performanca jote e fundit' : 'Your latest performance'}</h2></div><div className="growth-bars">{growth.points.slice(-16).map((point, index) => <div key={`${point.createdAt}-${index}`} title={`${point.score}/100`}><i style={{height:`${Math.max(point.score, 8)}%`}}/><span>{index + 1}</span></div>)}</div></section><section className="growth-detail-grid"><article className="competency-card"><p className="eyebrow">{sq ? 'HARTA E KOMPETENCAVE' : 'COMPETENCY MAP'}</p><h2>{sq ? 'Pikat e forta dhe mundësitë' : 'Strengths and opportunities'}</h2>{Object.entries(growth.averages).filter(([key]) => key !== 'score').map(([key, value]) => <div className="competency-row" key={key}><span>{key.replace(/([A-Z])/g, ' ')}</span><i><b style={{width:`${value}%`}}/></i><strong>{value}</strong></div>)}</article><article className="recommendations-card"><p className="eyebrow">{sq ? 'HAPAT E PERSONALIZUAR' : 'PERSONALIZED NEXT STEPS'}</p><h2>{sq ? 'Fokuso përgjigjen tënde të radhës.' : 'Focus your next answer.'}</h2>{growth.recommendations.map((item, index) => <p key={item}><b>{String(index + 1).padStart(2, '0')}</b>{item}</p>)}<div className="growth-strengths"><span>{sq ? 'Më e forta: ' : 'Strongest: '}{growth.strongest.map(item => item.label).join(sq ? ' dhe ' : ' and ')}</span><span>{sq ? 'Fusha për fokus: ' : 'Focus area: '}{growth.weakest[0]?.label}</span></div></article></section></>}</div>
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

function ProfessionalAdminDashboard({ token, language = 'en' }) {
  const sq = language === 'sq'
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [reports, setReports] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([api('/admin/overview', token), api('/admin/users', token), api('/admin/reports', token)])
      .then(([overviewData, userData, reportData]) => { setOverview(overviewData); setUsers(userData); setReports(reportData) })
      .catch(error => setError(error.message))
  }, [token])
  if (error) return <div className="page"><p className="eyebrow">{sq ? 'ADMINISTRIM' : 'ADMINISTRATION'}</p><h1>{sq ? 'Qasja nuk është e disponueshme.' : 'Access unavailable.'}</h1><p className="subtle">{error}</p></div>
  if (!overview) return <div className="page"><p className="eyebrow">{sq ? 'ADMINISTRIM' : 'ADMINISTRATION'}</p><h1>{sq ? 'Po ngarkohen të dhënat e sistemit...' : 'Loading system data...'}</h1></div>
  const totals = overview.totals
  return <div className="page report admin-dashboard"><header className="topbar"><div><p className="eyebrow">{sq ? 'QENDRA E ADMINISTRIMIT' : 'ADMIN CONTROL CENTER'}</p><h1>{sq ? 'Të dhënat e platformës.' : 'Platform intelligence.'}</h1><p className="subtle">{sq ? 'Pamje e plotë e përdoruesve, raporteve dhe aktivitetit të AI.' : 'A complete view of users, practice reports, and AI coaching activity.'}</p></div><button className="secondary" onClick={() => window.location.reload()}>{sq ? 'Rifresko të dhënat' : 'Refresh data'}</button></header><section className="report-hero"><div className="score-block"><ProgressRing value={Math.min(totals.averageScore || 0, 100)}/><div><p className="eyebrow">{sq ? 'GATISHMËRIA MESATARE' : 'AVERAGE READINESS'}</p><h2>{totals.averageScore || 0}/100 {sq ? 'në platformë.' : 'across the platform.'}</h2><p>{totals.reports} {sq ? 'raporte të plota AI janë ruajtur dhe janë gati për shqyrtim.' : 'complete AI reports are securely stored and available for review.'}</p></div></div></section><section className="metric-grid">{[[sq ? 'Përdorues gjithsej' : 'Total users', totals.users], [sq ? 'Seanca praktike' : 'Practice sessions', totals.interviews], [sq ? 'Raporte AI' : 'AI reports', totals.reports], [sq ? 'Rezultati mesatar' : 'Average score', totals.averageScore || 0]].map(([label, value]) => <article key={label}><p>{label}</p><strong>{value}</strong><div><i style={{width:'100%'}}/></div></article>)}</section><section className="report-columns"><article><p className="eyebrow">{sq ? 'TË GJITHË PËRDORUESIT' : 'ALL USERS'}</p><h2>{sq ? 'Lista e llogarive' : 'Account directory'}</h2><div className="admin-list">{users.map(user => <div className="evidence" key={user.id}><b>{user.role === 'admin' ? 'AD' : 'US'}</b><div><h3>{user.name}</h3><p>{user.email} · {user.role} · {user.reportCount} {sq ? 'raporte' : 'reports'} · {sq ? 'mesatarja' : 'average'} {user.averageScore || 0}/100</p></div></div>)}</div></article><article className="plan"><p className="eyebrow">{sq ? 'TË GJITHA RAPORTET AI' : 'ALL AI REPORTS'}</p><h2>{sq ? 'Aktiviteti i praktikës' : 'Practice activity'}</h2><div className="admin-list">{reports.map(report => <div className="evidence" key={report.id}><b>{report.overallScore}</b><div><h3>{report.title}</h3><p>{report.name} · {report.email}</p><p>{new Date(report.createdAt).toLocaleString()}</p></div></div>)}{!reports.length && <p className="subtle">{sq ? 'Nuk ka raporte të krijuara ende.' : 'No reports have been created yet.'}</p>}</div></article></section></div>
}

function AuthPage({ onAuthenticated, language = 'en', setLanguage }) {
  const sq = language === 'sq'
  const [mode, setMode] = useState('login'), [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const submit = async event => {
    event.preventDefault(); setMessage('')
    if (mode === 'register' && name.trim().length < 2) return setMessage(sq ? 'Emri duhet të ketë të paktën 2 karaktere.' : 'Name must have at least 2 characters.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setMessage(sq ? 'Shkruani një adresë email të vlefshme.' : 'Enter a valid email address.')
    if (password.length < 8) return setMessage(sq ? 'Fjalëkalimi duhet të ketë të paktën 8 karaktere.' : 'Password must have at least 8 characters.')
    setBusy(true)
    try {
      const response = await fetch(`/api/v1/auth/${mode}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name, email, password}) })
      const body = await readApiResponse(response); if (!response.ok || body.error) throw new Error(body.error?.message || 'Unable to continue.')
      localStorage.setItem('interviewCoachSession', JSON.stringify(body.data)); onAuthenticated(body.data)
    } catch (error) { setMessage(error.message); setBusy(false) }
  }
  return <div className="page practice-intro"><div className="intro-card"><button className="language-button" type="button" onClick={() => setLanguage?.(sq ? 'en' : 'sq')} aria-label={sq ? 'Ndrysho gjuhën' : 'Change language'}>{sq ? 'English' : 'Shqip'}</button><span className="live-dot">✦</span><p className="eyebrow">{sq ? 'HAPËSIRA JOTE PRIVATE' : 'YOUR PRIVATE WORKSPACE'}</p><h1>{mode === 'login' ? (sq ? 'Mirë se u ktheve.' : 'Welcome back.') : (sq ? 'Krijo llogarinë tënde.' : 'Create your account.')}</h1><p className="intro-copy">{mode === 'login' ? (sq ? 'Hyr për të vazhduar praktikën e intervistës.' : 'Sign in to continue your interview practice.') : (sq ? 'Përgjigjet dhe raportet e intervistës qëndrojnë të lidhura me llogarinë tënde.' : 'Your interview answers and reports stay connected to your account.')}</p><form className="auth-form" onSubmit={submit}>{mode === 'register' && <input value={name} onChange={e=>setName(e.target.value)} placeholder={sq ? 'Emri yt' : 'Your name'} required/>}<input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder={sq ? 'Adresa e emailit' : 'Email address'} required/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" minLength="8" placeholder={sq ? 'Fjalëkalimi (8+ karaktere)' : 'Password (8+ characters)'} required/>{message && <p className="subtle">{message}</p>}<button className="primary large" disabled={busy}>{busy ? (sq ? 'Ju lutem prisni...' : 'Please wait...') : mode === 'login' ? (sq ? 'Hyr' : 'Sign in') : (sq ? 'Krijo llogari' : 'Create account')}</button></form><button className="text-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage('') }}>{mode === 'login' ? (sq ? 'I ri këtu? Krijo llogari' : 'New here? Create an account') : (sq ? 'Ke llogari? Hyr' : 'Already have an account? Sign in')}</button></div></div>
}

function SavedReports({ language = 'en' }) {
  const sq = language === 'sq'
  const [reports, setReports] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('interviewCoachSession') || 'null')
    if (!session?.token) { setError(sq ? 'Hyr për të parë raportet e ruajtura të praktikës.' : 'Sign in to view your saved practice reports.'); return }
    api('/reports', session.token).then(items => { setReports(items); const latest = JSON.parse(localStorage.getItem('latestInterviewReport') || 'null'); setSelected(latest || items[0] || null) }).catch(e => setError(e.message))
  }, [])
  const analysis = selected?.analysis || {}
  const dimensions = selected?.dimensions || {}
  const metricLabels = { technical: sq ? 'Aftësi teknike' : 'Technical depth', communication: sq ? 'Komunikim' : 'Communication', confidence: sq ? 'Vetëbesim' : 'Confidence', behavioral: sq ? 'Sjellore' : 'Behavioral' }
  const answers = analysis.answers || []
  return <div className="page report"><header className="topbar"><div><p className="eyebrow">{sq ? 'RAPORTET E TUA TË RUAJTURA' : 'YOUR SAVED REPORTS'}</p><h1>{sq ? 'Historia e praktikës.' : 'Practice history.'}</h1><p className="subtle">{sq ? 'Çdo praktikë e përfunduar dhe analizë AI ruhet në llogarinë tënde.' : 'Every completed practice and AI analysis is stored securely in your account.'}</p></div></header>{error ? <p className="subtle">{error}</p> : !selected ? <p className="subtle">{sq ? 'Ende nuk ka praktika të përfunduara. Fillo një praktikë për të krijuar raportin e parë.' : 'No completed practices yet. Start a practice to create your first report.'}</p> : <><section className="report-hero"><div className="score-block"><ProgressRing value={selected.overallScore || selected.overall_score || 0} language={language}/><div><p className="eyebrow">{sq ? 'GATISHMËRIA E PËRGJITHSHME' : 'OVERALL READINESS'}</p><h2>{analysis.summary || (sq ? 'Praktika jote e fundit.' : 'Your latest practice.')}</h2><p>{selected.title || (sq ? 'Praktikë interviste' : 'Interview practice')}</p></div></div></section><section className="metric-grid">{Object.entries(dimensions).map(([label, value]) => <article key={label}><p>{metricLabels[label] || label}</p><strong>{value}</strong><div><i style={{width:`${value}%`}}/></div></article>)}</section><section className="report-columns"><article><p className="eyebrow">{sq ? 'COACHING NGA AI' : 'AI COACHING'}</p><h2>{sq ? 'Plani yt i përmirësimit' : 'Your improvement plan'}</h2>{(analysis.improvements || []).map((item, index) => <div className="evidence" key={item}><b>{String(index + 1).padStart(2, '0')}</b><div><p>{item}</p></div></div>)}<div className="evidence"><b>PRO</b><div><h3>{sq ? 'Formulim profesional' : 'Professional formulation'}</h3><p>{analysis.professionalRewrite}</p></div></div></article><article className="plan"><p className="eyebrow">{sq ? 'RAPORTET E MËPARSHME' : 'PAST REPORTS'}</p><h2>{sq ? 'Të gjitha praktikat' : 'All practices'}</h2>{reports.map(report => <button className="text-button" style={{display:'block', padding:'10px 0'}} key={report.id} onClick={() => setSelected(report)}>{report.title} · {report.overallScore}/100</button>)}</article></section>{answers.length > 0 && <section className="report-columns"><article><p className="eyebrow">{sq ? 'ANALIZA PYETJE PAS PYETJEJE' : 'QUESTION-BY-QUESTION ANALYSIS'}</p><h2>{sq ? 'Përgjigjet e tua' : 'Your responses'}</h2>{answers.map((item, index) => <div className="evidence" key={`${item.question}-${index}`}><b>{item.analysis?.score || 0}</b><div><h3>{item.question}</h3><p>{item.analysis?.scoreReason || item.analysis?.summary}</p><p className="subtle">{sq ? 'Hapi tjetër:' : 'Next step:'} {item.analysis?.improvements?.[0]}</p></div></div>)}</article><article className="plan"><p className="eyebrow">{sq ? 'PIKAT E FORTA' : 'STRENGTHS TO REPEAT'}</p><h2>{sq ? 'Çfarë funksionoi' : 'What worked'}</h2>{(analysis.strengths || []).map((item, index) => <div className="evidence" key={item}><b>{String(index + 1).padStart(2, '0')}</b><div><p>{item}</p></div></div>)}<button className="primary" onClick={() => window.location.assign('/practice')}>{sq ? 'Praktiko përsëri' : 'Practice again'} <span>→</span></button></article></section>}</>}</div>
}

function UserOnly({ session, children }) { return session?.user?.role === 'user' ? children : <Navigate to={session?.user?.role === 'admin' ? '/admin' : '/'} replace/> }
function AdminOnly({ session, children }) { return session?.user?.role === 'admin' ? children : <Navigate to="/" replace/> }

function AppContent({ theme, setTheme, language, setLanguage, session, onAuthenticated, onLogout }) {
  if (!session?.token) return <Routes><Route path="*" element={<AuthPage onAuthenticated={onAuthenticated} language={language} setLanguage={setLanguage}/>}/></Routes>
  const home = session.user.role === 'admin' ? <Navigate to="/admin" replace/> : <Dashboard user={session.user} token={session.token} language={language}/>
  return <Layout theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} user={session.user} onLogout={onLogout}><Routes><Route path="/" element={home}/><Route path="/practice" element={<UserOnly session={session}><Practice language={language}/></UserOnly>}/><Route path="/reports" element={<UserOnly session={session}><SavedReports language={language}/></UserOnly>}/><Route path="/growth" element={<UserOnly session={session}><GrowthTracking token={session.token} language={language}/></UserOnly>}/><Route path="/admin" element={<AdminOnly session={session}><ProfessionalAdminDashboard token={session.token} language={language}/></AdminOnly>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Layout>
}

function App() {
  const [theme,setTheme] = useState(() => localStorage.getItem('interviewCoachTheme') || 'light')
  const [language, setLanguage] = useState(() => localStorage.getItem('interviewCoachLanguage') || 'en')
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
  useEffect(() => { localStorage.setItem('interviewCoachLanguage', language); document.documentElement.lang = language === 'sq' ? 'sq' : 'en' }, [language])
  useEffect(() => { localStorage.setItem('interviewCoachTheme', theme) }, [theme])
  if (checkingSession) return <div className="session-loading"><span>{language === 'sq' ? 'Po ngarkohet' : 'Loading'}</span><p>{language === 'sq' ? 'Po verifikohet seanca jote…' : 'Verifying your session…'}</p></div>
  return <BrowserRouter><AppContent theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} session={session} onAuthenticated={setSession} onLogout={logout}/></BrowserRouter>
}
createRoot(document.getElementById('root')).render(<App />)
