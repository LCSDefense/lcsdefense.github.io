import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const CLEARANCE_STYLES = {
  'None': 'bg-gray-100 text-gray-500',
  'Secret': 'bg-blue-50 text-blue-700',
  'TS': 'bg-purple-50 text-purple-700',
  'TS/SCI': 'bg-orange-50 text-orange-700',
  'TS/SCI w/FSP': 'bg-red-50 text-red-700',
};

const CLEARANCES = ['All', 'None', 'Secret', 'TS', 'TS/SCI', 'TS/SCI w/FSP'];

function Initials({ name }) {
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].slice(0, 2);
  return (
    <div className="w-9 h-9 rounded-full bg-navy/10 text-navy text-xs font-bold flex items-center justify-center flex-shrink-0 uppercase">
      {initials}
    </div>
  );
}

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [clearanceFilter, setClearanceFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getCandidates().then(setCandidates).finally(() => setLoading(false));
  }, []);

  const filtered = candidates.filter((c) => {
    if (clearanceFilter !== 'All' && (c.clearanceLevel || 'None') !== clearanceFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      (c.email || '').toLowerCase().includes(s) ||
      (c.currentPosition || '').toLowerCase().includes(s) ||
      (c.currentCompany || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Candidates</h1>
          <p className="text-sm text-gray-400 mt-0.5">{candidates.length} total candidates</p>
        </div>
        <button onClick={() => navigate('/candidates/new')} className="btn-primary">
          + New Candidate
        </button>
      </div>

      {/* Search & Filter */}
      <div className="card px-5 py-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select value={clearanceFilter} onChange={(e) => setClearanceFilter(e.target.value)} className="select">
          {CLEARANCES.map((c) => <option key={c}>{c === 'All' ? 'All Clearances' : c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 font-medium">No candidates found</p>
            <button onClick={() => navigate('/candidates/new')} className="mt-3 text-sm font-semibold text-navy hover:underline">
              Add your first candidate →
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-50/50">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Clearance</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Role</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Salary Exp.</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Apps</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/candidates/${c.id}`)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Initials name={c.name} />
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-navy transition-colors">{c.name}</div>
                        <div className="text-xs text-gray-400">{c.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`badge ${CLEARANCE_STYLES[c.clearanceLevel || 'None']}`}>
                      {c.clearanceLevel || 'None'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {c.currentPosition
                      ? <span>{c.currentPosition}{c.currentCompany ? <span className="text-gray-400"> @ {c.currentCompany}</span> : null}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-4">
                    {c.salaryExpectation
                      ? <span className="font-medium text-emerald-700">{c.salaryExpectation}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-xs">{c.sourcedBy || '—'}</td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-gray-700">{c.applications?.length || 0}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-navy transition-colors ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
