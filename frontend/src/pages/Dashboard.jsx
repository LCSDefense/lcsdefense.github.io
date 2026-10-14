import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const STAGE_STYLES = {
  'Initial Contact': 'stage-initial',
  'Interested': 'stage-interested',
  'LCS Interview': 'stage-lcs',
  'Sent to Client': 'stage-sent',
  'Client Interview': 'stage-client',
  'Offer': 'stage-offer',
  'Hired': 'stage-hired',
  'Rejected': 'stage-rejected',
  'Withdrawn': 'stage-withdrawn',
};

const KPI_CONFIG = [
  {
    key: 'activeReqs',
    label: 'Active Requisitions',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      </svg>
    ),
    iconBg: 'bg-navy/10 text-navy',
    valueColor: 'text-navy',
    border: 'border-t-navy',
  },
  {
    key: 'pipeline',
    label: 'In Pipeline',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/>
      </svg>
    ),
    iconBg: 'bg-blue-50 text-blue-600',
    valueColor: 'text-blue-600',
    border: 'border-t-blue-500',
  },
  {
    key: 'interviews',
    label: 'Active Interviews',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    ),
    iconBg: 'bg-amber-50 text-amber-600',
    valueColor: 'text-amber-600',
    border: 'border-t-amber-500',
  },
  {
    key: 'offers',
    label: 'Pending Offers',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
    iconBg: 'bg-emerald-50 text-emerald-600',
    valueColor: 'text-emerald-600',
    border: 'border-t-emerald-500',
  },
  {
    key: 'agedReqs',
    label: 'Reqs 30d+ Old',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
    ),
    iconBg: 'bg-red-50 text-red-600',
    valueColor: 'text-red-600',
    border: 'border-t-red-500',
  },
];

function KpiCard({ kpi, value }) {
  return (
    <div className={`card border-t-2 ${kpi.border} p-6 flex flex-col gap-4`}>
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${kpi.iconBg}`}>{kpi.icon}</div>
      </div>
      <div>
        <div className={`text-4xl font-bold tracking-tight ${kpi.valueColor}`}>{value ?? '—'}</div>
        <div className="text-sm text-gray-500 font-medium mt-1">{kpi.label}</div>
      </div>
    </div>
  );
}

const daysSince = (date) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000);

const daysColor = (d) =>
  d >= 90 ? 'text-red-600 bg-red-50' : d >= 60 ? 'text-orange-600 bg-orange-50' : 'text-emerald-700 bg-emerald-50';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="card p-12 text-center">
      <p className="text-red-500 font-medium">Failed to load dashboard data</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/candidates/new" className="btn-ghost">+ Candidate</Link>
          <Link to="/requisitions/new" className="btn-primary">+ New Requisition</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {KPI_CONFIG.map((kpi) => (
          <KpiCard key={kpi.key} kpi={kpi} value={data.kpis[kpi.key]} />
        ))}
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="card">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="section-title mb-0">Recent Applications</h2>
            <Link to="/requisitions" className="text-xs font-semibold text-navy hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentApplications.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-gray-400">No applications yet</p>
                <Link to="/candidates/new" className="text-xs font-semibold text-navy mt-2 inline-block hover:underline">Add your first candidate →</Link>
              </div>
            ) : (
              data.recentApplications.map((app) => (
                <Link
                  key={app.id}
                  to={`/applications/${app.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-navy/10 text-navy text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {app.candidate.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-navy transition-colors">{app.candidate.name}</p>
                      <p className="text-xs text-gray-400">{app.requisition.position} · {app.requisition.customer}</p>
                    </div>
                  </div>
                  <span className={`badge ${STAGE_STYLES[app.pipelineStage] || 'stage-initial'}`}>
                    {app.pipelineStage}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Aged Requisitions */}
        <div className="card">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="section-title mb-0">Oldest Open Requisitions</h2>
            <Link to="/requisitions" className="text-xs font-semibold text-navy hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.agedReqsList.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-gray-400">No open requisitions</p>
                <Link to="/requisitions/new" className="text-xs font-semibold text-navy mt-2 inline-block hover:underline">Create one →</Link>
              </div>
            ) : (
              data.agedReqsList.map((req) => {
                const days = daysSince(req.dateReceived || req.createdAt);
                return (
                  <Link
                    key={req.id}
                    to={`/requisitions/${req.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-navy transition-colors">{req.position}</p>
                      <p className="text-xs text-gray-400">{req.customer} · {req.applications?.length ?? 0} candidates</p>
                    </div>
                    <span className={`badge ${daysColor(days)}`}>
                      {days}d
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
