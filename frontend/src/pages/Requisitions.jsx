import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

const STATUS_STYLES = {
  Open: 'bg-emerald-50 text-emerald-700',
  Filled: 'bg-blue-50 text-blue-700',
  'On Hold': 'bg-amber-50 text-amber-700',
  Cancelled: 'bg-red-50 text-red-700',
};

const CUSTOMER_COLORS = {
  AWS: 'bg-orange-50 text-orange-700',
  NSA: 'bg-navy/10 text-navy',
  C5ISR: 'bg-emerald-50 text-emerald-700',
  'Army G6': 'bg-green-50 text-green-700',
  TAC: 'bg-indigo-50 text-indigo-700',
  Raven: 'bg-purple-50 text-purple-700',
};

const CUSTOMERS = ['All', 'AWS', 'NSA', 'C5ISR', 'Army G6', 'TAC', 'Raven', 'Other'];
const STATUSES = ['All', 'Open', 'Filled', 'On Hold', 'Cancelled'];

const daysSince = (date) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
const daysColor = (d) =>
  d >= 90 ? 'bg-red-50 text-red-700' : d >= 60 ? 'bg-orange-50 text-orange-700' : d >= 30 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500';

export default function Requisitions() {
  const [reqs, setReqs] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getRequisitions().then(setReqs).finally(() => setLoading(false));
  }, []);

  const filtered = reqs.filter((r) => {
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (customerFilter !== 'All' && r.customer !== customerFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return r.position.toLowerCase().includes(s) ||
        r.customer.toLowerCase().includes(s) ||
        (r.recruiter || '').toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Requisitions</h1>
          <p className="text-sm text-gray-400 mt-0.5">{reqs.filter(r => r.status === 'Open').length} open positions</p>
        </div>
        <button onClick={() => navigate('/requisitions/new')} className="btn-primary">
          + New Requisition
        </button>
      </div>

      {/* Filters */}
      <div className="card px-5 py-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search positions, customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select">
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="select">
          {CUSTOMERS.map((c) => <option key={c}>{c}</option>)}
        </select>
        {(search || statusFilter !== 'All' || customerFilter !== 'All') && (
          <button onClick={() => { setSearch(''); setStatusFilter('All'); setCustomerFilter('All'); }}
            className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 font-medium">No requisitions found</p>
            <button onClick={() => navigate('/requisitions/new')} className="mt-3 text-sm font-semibold text-navy hover:underline">
              Create your first requisition →
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-50/50">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Active</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidates</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recruiter</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((req) => {
                const days = daysSince(req.dateReceived || req.createdAt);
                return (
                  <tr
                    key={req.id}
                    onClick={() => navigate(`/requisitions/${req.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 group-hover:text-navy transition-colors">{req.position}</div>
                      {req.workLocation && <div className="text-xs text-gray-400 mt-0.5">{req.workLocation}</div>}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`badge ${CUSTOMER_COLORS[req.customer] || 'bg-gray-100 text-gray-600'}`}>
                        {req.customer}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`badge ${STATUS_STYLES[req.status] || 'bg-gray-100 text-gray-600'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`badge ${daysColor(days)}`}>{days}d</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-gray-700">{req.applications?.length || 0}</span>
                    </td>
                    <td className="px-4 py-4 text-gray-500">{req.recruiter || '—'}</td>
                    <td className="px-4 py-4 text-right">
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-navy transition-colors ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
