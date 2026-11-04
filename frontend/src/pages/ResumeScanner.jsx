import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://backend-production-45d16.up.railway.app';
const authHeaders = () => {
  const token = localStorage.getItem('lcs_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const tierColor = (tier) => {
  if (tier === 'Strong') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (tier === 'Moderate') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-red-100 text-red-800 border-red-200';
};

const scoreColor = (score) => {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-500';
};

const clearanceBadge = (match) => {
  if (!match) return null;
  const map = {
    exact: { label: 'Clearance Match', cls: 'bg-blue-100 text-blue-800' },
    exceeds: { label: 'Clearance Exceeds', cls: 'bg-purple-100 text-purple-800' },
    partial: { label: 'Clearance Partial', cls: 'bg-amber-100 text-amber-800' },
    none: { label: 'No Clearance', cls: 'bg-red-100 text-red-800' },
  };
  return map[match] || null;
};

function ScoreRing({ score }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="52" height="52" className="flex-shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
      <circle
        cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 26 26)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{pct}</text>
    </svg>
  );
}

function ResultCard({ result, sessionRequisitionId, onApply }) {
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);
  const cb = clearanceBadge(result.clearanceMatch);

  const handleApply = async () => {
    setApplying(true);
    await onApply(result);
    setApplying(false);
  };

  return (
    <div className="border border-slate-200 rounded-xl bg-white hover:shadow-md transition-shadow">
      {/* Header */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <ScoreRing score={result.score} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 truncate">{result.candidateName}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${tierColor(result.tier)}`}>
              {result.tier}
            </span>
            {cb && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cb.cls}`}>{cb.label}</span>
            )}
            {result.applicationId && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                ✓ In Pipeline
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5 truncate">{result.filename || 'Existing candidate'}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {sessionRequisitionId && !result.applicationId && (
            <button
              onClick={(e) => { e.stopPropagation(); handleApply(); }}
              disabled={applying}
              className="text-xs font-medium px-3 py-1.5 bg-gold text-navy-dark rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {applying ? '…' : 'Push to Pipeline'}
            </button>
          )}
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          {/* Summary */}
          <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Requirements Met */}
            {result.requirementsMet.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                  ✓ Requirements Met
                </h4>
                <ul className="space-y-1">
                  {result.requirementsMet.map((r, i) => (
                    <li key={i} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-emerald-500 flex-shrink-0">✓</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements Missed */}
            {result.requirementsMissed.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
                  ✗ Requirements Missed
                </h4>
                <ul className="space-y-1">
                  {result.requirementsMissed.map((r, i) => (
                    <li key={i} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-red-400 flex-shrink-0">✗</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-slate-700">• {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {result.gaps.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                  Gaps
                </h4>
                <ul className="space-y-1">
                  {result.gaps.map((g, i) => (
                    <li key={i} className="text-sm text-slate-700">• {g}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {result.candidate && (
            <a
              href={`/candidates/${result.candidate.id}`}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
            >
              View candidate profile →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function SessionView({ sessionId, onClose }) {
  const [session, setSession] = useState(null);
  const [applyError, setApplyError] = useState('');
  const pollRef = useRef(null);

  const fetchSession = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/resume-scanner/sessions/${sessionId}`, { headers: authHeaders() });
      const data = await r.json();
      setSession(data);
      return data;
    } catch { return null; }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
    pollRef.current = setInterval(async () => {
      const data = await fetchSession();
      if (data && (data.status === 'complete' || data.status === 'error')) {
        clearInterval(pollRef.current);
      }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [fetchSession]);

  const handleApply = async (result) => {
    setApplyError('');
    try {
      const r = await fetch(
        `${API}/api/resume-scanner/sessions/${sessionId}/results/${result.id}/apply`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({}) }
      );
      if (!r.ok) {
        const e = await r.json();
        setApplyError(e.error || 'Failed to push to pipeline');
      } else {
        await fetchSession();
      }
    } catch (err) {
      setApplyError(err.message);
    }
  };

  const exportCSV = () => {
    if (!session?.results) return;
    const rows = [
      ['Name', 'Score', 'Tier', 'Clearance Match', 'Requirements Met', 'Requirements Missed', 'Summary'],
      ...session.results.map((r) => [
        r.candidateName,
        r.score,
        r.tier,
        r.clearanceMatch || '',
        r.requirementsMet.join('; '),
        r.requirementsMissed.join('; '),
        r.summary.replace(/"/g, '""'),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-results-${sessionId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!session) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full" />
    </div>
  );

  const isRunning = session.status === 'running';
  const strong = session.results?.filter((r) => r.tier === 'Strong').length || 0;
  const moderate = session.results?.filter((r) => r.tier === 'Moderate').length || 0;

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm">
          ← Back
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">
            {session.name || (session.requisition ? `${session.requisition.position} — ${session.requisition.customer}` : 'Resume Scan')}
          </h2>
          <p className="text-sm text-slate-500">{new Date(session.createdAt).toLocaleString()}</p>
        </div>
        <button
          onClick={exportCSV}
          className="text-sm font-medium px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Progress / stats */}
      {isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            <span className="text-sm font-medium text-blue-800">
              Scanning… {session.processedCount} of {session.totalCount} complete
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${session.totalCount ? (session.processedCount / session.totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary stats */}
      {session.results && session.results.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700">{strong}</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">Strong Match</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">{moderate}</div>
            <div className="text-xs text-amber-600 font-medium mt-1">Moderate Match</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-slate-700">{session.results.length}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Total Scanned</div>
          </div>
        </div>
      )}

      {applyError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{applyError}</div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {session.results?.map((result) => (
          <ResultCard
            key={result.id}
            result={result}
            sessionRequisitionId={session.requisitionId}
            onApply={handleApply}
          />
        ))}
        {isRunning && session.processedCount < session.totalCount && (
          <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-sm text-slate-400">
            Results appear as each resume finishes…
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ResumeScanner() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('new'); // 'new' | 'history'
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Form state
  const [jdSource, setJdSource] = useState('text'); // 'text' | 'file' | 'requisition'
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [requisitions, setRequisitions] = useState([]);
  const [selectedReqId, setSelectedReqId] = useState('');
  const [candidateSource, setCandidateSource] = useState('upload'); // 'upload' | 'pool'
  const [resumeFiles, setResumeFiles] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [clearanceFilter, setClearanceFilter] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // History
  const [sessions, setSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/requisitions`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setRequisitions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (candidateSource === 'pool') {
      const params = clearanceFilter ? `?clearance=${encodeURIComponent(clearanceFilter)}` : '';
      fetch(`${API}/api/candidates${params}`, { headers: authHeaders() })
        .then((r) => r.json())
        .then((data) => setCandidates(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [candidateSource, clearanceFilter]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const r = await fetch(`${API}/api/resume-scanner/sessions`, { headers: authHeaders() });
      const data = await r.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch { }
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const form = new FormData();
      if (sessionName) form.append('name', sessionName);

      // Job description
      if (jdSource === 'text') {
        if (!jdText.trim()) throw new Error('Please enter a job description');
        form.append('jobDescText', jdText);
      } else if (jdSource === 'file') {
        if (!jdFile) throw new Error('Please upload a job description file');
        form.append('jobDescFile', jdFile);
      } else if (jdSource === 'requisition') {
        if (!selectedReqId) throw new Error('Please select a requisition');
        form.append('requisitionId', selectedReqId);
        // Get JD from the selected requisition's applications if available, or use the position/notes as JD
        const req = requisitions.find((r) => String(r.id) === String(selectedReqId));
        if (req) {
          form.append('jobDescText', `Position: ${req.position}\nCustomer: ${req.customer}\nLocation: ${req.workLocation || ''}\nContract: ${req.contract || ''}\nNotes: ${req.notes || ''}`);
        }
      }

      // Resumes
      if (candidateSource === 'upload') {
        if (resumeFiles.length === 0) throw new Error('Please upload at least one resume');
        resumeFiles.forEach((f) => form.append('resumes', f));
      } else {
        if (selectedCandidateIds.length === 0) throw new Error('Please select at least one candidate');
        form.append('candidateIds', JSON.stringify(selectedCandidateIds.map(Number)));
      }

      const r = await fetch(`${API}/api/resume-scanner/sessions`, {
        method: 'POST',
        headers: authHeaders(),
        body: form,
      });

      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || 'Failed to start scan');
      }

      const session = await r.json();
      setActiveSessionId(session.id);
      setTab('view');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCandidate = (id) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedCandidateIds(candidates.map((c) => c.id));
  const clearAll = () => setSelectedCandidateIds([]);

  // ── View active session
  if (tab === 'view' && activeSessionId) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Resume Scanner</h1>
        </div>
        <SessionView sessionId={activeSessionId} onClose={() => { setTab('new'); setActiveSessionId(null); }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Resume Scanner</h1>
        <p className="text-sm text-slate-500 mt-1">AI-powered resume screening against job requirements</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {['new', 'history'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-gold text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'new' ? 'New Scan' : 'History'}
          </button>
        ))}
      </div>

      {/* ── New Scan ── */}
      {tab === 'new' && (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
          {/* Session name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Scan Name (optional)</label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g. Systems Engineer III — Nov 2026"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          {/* ── Job Description ── */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Job Description</h2>
            <div className="flex gap-2 flex-wrap">
              {[['text', 'Paste / Type'], ['file', 'Upload File'], ['requisition', 'From Requisition']].map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setJdSource(v)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    jdSource === v ? 'bg-navy-dark text-white border-navy-dark' : 'border-slate-300 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {jdSource === 'text' && (
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={8}
                placeholder="Paste the full job description here…"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-y"
              />
            )}

            {jdSource === 'file' && (
              <div>
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-gold transition-colors">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-slate-500">
                    {jdFile ? jdFile.name : 'Upload PDF, Word, or text file'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => setJdFile(e.target.files[0])}
                  />
                </label>
              </div>
            )}

            {jdSource === 'requisition' && (
              <select
                value={selectedReqId}
                onChange={(e) => setSelectedReqId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="">Select a requisition…</option>
                {requisitions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.position} — {r.customer}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ── Candidate Source ── */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Candidates</h2>
            <div className="flex gap-2">
              {[['upload', 'Upload Resumes'], ['pool', 'Scan Candidate Pool']].map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCandidateSource(v)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    candidateSource === v ? 'bg-navy-dark text-white border-navy-dark' : 'border-slate-300 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {candidateSource === 'upload' && (
              <div>
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-gold transition-colors">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-slate-500">
                    {resumeFiles.length > 0
                      ? `${resumeFiles.length} file${resumeFiles.length > 1 ? 's' : ''} selected`
                      : 'Upload up to 50 resumes (PDF, Word)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    multiple
                    className="hidden"
                    onChange={(e) => setResumeFiles(Array.from(e.target.files).slice(0, 50))}
                  />
                </label>
                {resumeFiles.length > 0 && (
                  <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                    {resumeFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setResumeFiles((prev) => prev.filter((_, j) => j !== i))}
                          className="text-slate-400 hover:text-red-500 ml-2 flex-shrink-0"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {candidateSource === 'pool' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <select
                    value={clearanceFilter}
                    onChange={(e) => setClearanceFilter(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                  >
                    <option value="">All clearance levels</option>
                    <option value="Secret">Secret</option>
                    <option value="Top Secret">Top Secret</option>
                    <option value="TS/SCI">TS/SCI</option>
                    <option value="TS/SCI w/ Poly">TS/SCI w/ Poly</option>
                  </select>
                  <button type="button" onClick={selectAll} className="text-xs text-indigo-600 hover:underline">Select All</button>
                  <button type="button" onClick={clearAll} className="text-xs text-slate-500 hover:underline">Clear</button>
                  <span className="text-xs text-slate-400 ml-auto">{selectedCandidateIds.length} selected</span>
                </div>

                <div className="border border-slate-200 rounded-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {candidates.length === 0 ? (
                    <div className="p-4 text-sm text-slate-400 text-center">No candidates found</div>
                  ) : (
                    candidates.map((c) => {
                      const hasResume = c.resumes?.length > 0;
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 ${!hasResume ? 'opacity-40' : ''}`}
                        >
                          <input
                            type="checkbox"
                            disabled={!hasResume}
                            checked={selectedCandidateIds.includes(c.id)}
                            onChange={() => toggleCandidate(c.id)}
                            className="accent-gold"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800">{c.name}</div>
                            <div className="text-xs text-slate-500">
                              {c.clearanceLevel || 'No clearance listed'}
                              {!hasResume && ' — no stored resume'}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-slate-400">Only candidates with stored resumes can be scanned from the pool.</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gold text-navy-dark font-semibold rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-navy-dark border-t-transparent rounded-full" />
                Starting scan…
              </>
            ) : (
              'Start Scan'
            )}
          </button>
        </form>
      )}

      {/* ── History ── */}
      {tab === 'history' && (
        <div>
          {loadingHistory ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-6 h-6 border-4 border-gold border-t-transparent rounded-full" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-sm">No scan history yet. Run your first scan to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => {
                const statusColor = s.status === 'complete' ? 'text-emerald-600' : s.status === 'running' ? 'text-blue-600' : 'text-red-500';
                return (
                  <div
                    key={s.id}
                    onClick={() => { setActiveSessionId(s.id); setTab('view'); }}
                    className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">
                        {s.name || (s.requisition ? `${s.requisition.position} — ${s.requisition.customer}` : `Scan #${s.id}`)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {new Date(s.createdAt).toLocaleString()} · {s._count?.results || 0} candidates
                      </div>
                    </div>
                    <span className={`text-xs font-semibold capitalize ${statusColor}`}>{s.status}</span>
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
