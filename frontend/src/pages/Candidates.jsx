import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const CLEARANCE_COLORS = {
  'None': 'bg-gray-100 text-gray-600',
  'Secret': 'bg-blue-100 text-blue-700',
  'TS': 'bg-purple-100 text-purple-700',
  'TS/SCI': 'bg-orange-100 text-orange-700',
  'TS/SCI w/FSP': 'bg-red-100 text-red-700',
};

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getCandidates().then(setCandidates).finally(() => setLoading(false));
  }, []);

  const filtered = candidates.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      (c.email || '').toLowerCase().includes(s) ||
      (c.currentPosition || '').toLowerCase().includes(s) ||
      (c.currentCompany || '').toLowerCase().includes(s) ||
      (c.clearanceLevel || '').toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Candidates</h1>
        <button
          onClick={() => navigate('/candidates/new')}
          className="bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy/90 transition text-sm"
        >
          + New Candidate
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <input
          type="text"
          placeholder="Search by name, email, position, company, clearance..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No candidates found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-navy/5 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Clearance</th>
                <th className="px-4 py-3 font-medium text-gray-600">Current Role</th>
                <th className="px-4 py-3 font-medium text-gray-600">Salary Exp.</th>
                <th className="px-4 py-3 font-medium text-gray-600">Source</th>
                <th className="px-4 py-3 font-medium text-gray-600">Applications</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/candidates/${c.id}`)}
                  className="hover:bg-light-gray cursor-pointer transition"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.email || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${CLEARANCE_COLORS[c.clearanceLevel] || 'bg-gray-100 text-gray-600'}`}>
                      {c.clearanceLevel || 'None'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.currentPosition ? `${c.currentPosition} @ ${c.currentCompany || '?'}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.salaryExpectation || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.sourcedBy || '—'}</td>
                  <td className="px-4 py-3">{c.applications?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
