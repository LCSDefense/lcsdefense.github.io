import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

const STATUS_COLORS = {
  Open: 'bg-green-100 text-green-700',
  Filled: 'bg-blue-100 text-blue-700',
  'On Hold': 'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const CUSTOMERS = ['All', 'AWS', 'NSA', 'C5ISR', 'Army G6', 'TAC', 'Raven', 'Other'];
const STATUSES = ['All', 'Open', 'Filled', 'On Hold', 'Cancelled'];

export default function Requisitions() {
  const [reqs, setReqs] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadReqs();
  }, []);

  const loadReqs = () => {
    api.getRequisitions().then(setReqs).finally(() => setLoading(false));
  };

  const daysSince = (date) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000);

  const filtered = reqs.filter((r) => {
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (customerFilter !== 'All' && r.customer !== customerFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        r.position.toLowerCase().includes(s) ||
        r.customer.toLowerCase().includes(s) ||
        (r.recruiter || '').toLowerCase().includes(s) ||
        (r.contract || '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Requisitions</h1>
        <button
          onClick={() => navigate('/requisitions/new')}
          className="bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy/90 transition text-sm"
        >
          + New Requisition
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search positions, customers, recruiters..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        >
          {CUSTOMERS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No requisitions found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-navy/5 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Position</th>
                <th className="px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Days Active</th>
                <th className="px-4 py-3 font-medium text-gray-600">Candidates</th>
                <th className="px-4 py-3 font-medium text-gray-600">Recruiter</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => navigate(`/requisitions/${req.id}`)}
                  className="hover:bg-light-gray cursor-pointer transition"
                >
                  <td className="px-4 py-3 font-medium">{req.position}</td>
                  <td className="px-4 py-3">{req.customer}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[req.status] || 'bg-gray-100'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      daysSince(req.createdAt) > 30 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {daysSince(req.createdAt)}d
                    </span>
                  </td>
                  <td className="px-4 py-3">{req.applications?.length || 0}</td>
                  <td className="px-4 py-3 text-gray-500">{req.recruiter || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
