import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const KPI_CONFIG = [
  { key: 'activeReqs', label: 'Active Requisitions', color: 'bg-navy', icon: '📋' },
  { key: 'pipeline', label: 'In Pipeline', color: 'bg-blue-600', icon: '🔄' },
  { key: 'interviews', label: 'Interviews', color: 'bg-gold', icon: '🎤' },
  { key: 'offers', label: 'Pending Offers', color: 'bg-green-600', icon: '💰' },
  { key: 'agedReqs', label: 'Aged Reqs (30d+)', color: 'bg-red-600', icon: '⚠️' },
];

const STAGE_COLORS = {
  'Initial Contact': 'bg-gray-200 text-gray-700',
  'Interested': 'bg-blue-100 text-blue-700',
  'LCS Interview': 'bg-yellow-100 text-yellow-700',
  'Sent to Client': 'bg-purple-100 text-purple-700',
  'Client Interview': 'bg-orange-100 text-orange-700',
  'Offer': 'bg-green-100 text-green-700',
  'Hired': 'bg-green-200 text-green-800',
  'Rejected': 'bg-red-100 text-red-700',
  'Withdrawn': 'bg-gray-300 text-gray-600',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!data) return <div className="text-center py-12 text-red-500">Failed to load dashboard</div>;

  const daysSince = (date) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {KPI_CONFIG.map((kpi) => (
          <div key={kpi.key} className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{kpi.icon}</span>
              <span className={`${kpi.color} text-white text-2xl font-bold rounded-lg px-3 py-1`}>
                {data.kpis[kpi.key]}
              </span>
            </div>
            <p className="text-sm text-gray-600">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-navy mb-4">Recent Applications</h2>
          {data.recentApplications.length === 0 ? (
            <p className="text-gray-400 text-sm">No applications yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentApplications.map((app) => (
                <Link
                  key={app.id}
                  to={`/applications/${app.id}`}
                  className="flex items-center justify-between p-3 rounded hover:bg-light-gray transition"
                >
                  <div>
                    <p className="font-medium text-sm">{app.candidate.name}</p>
                    <p className="text-xs text-gray-500">
                      {app.requisition.position} — {app.requisition.customer}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${STAGE_COLORS[app.pipelineStage] || 'bg-gray-100'}`}>
                    {app.pipelineStage}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Aged Requisitions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-navy mb-4">Aged Requisitions (30+ days)</h2>
          {data.agedReqsList.length === 0 ? (
            <p className="text-gray-400 text-sm">No aged requisitions</p>
          ) : (
            <div className="space-y-3">
              {data.agedReqsList.map((req) => (
                <Link
                  key={req.id}
                  to={`/requisitions/${req.id}`}
                  className="flex items-center justify-between p-3 rounded hover:bg-light-gray transition"
                >
                  <div>
                    <p className="font-medium text-sm">{req.position}</p>
                    <p className="text-xs text-gray-500">{req.customer}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      {daysSince(req.createdAt)}d
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{req.applications.length} candidates</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
