import { useState, useEffect } from 'react';
import { api } from '../api';

const PIPELINE_STAGES = [
  'Initial Contact', 'Interested', 'LCS Interview', 'Sent to Client',
  'Client Interview', 'Offer', 'Hired', 'Rejected', 'Withdrawn',
];

const STAGE_COLORS = {
  'Initial Contact': '#9CA3AF',
  'Interested': '#3B82F6',
  'LCS Interview': '#F59E0B',
  'Sent to Client': '#8B5CF6',
  'Client Interview': '#F97316',
  'Offer': '#10B981',
  'Hired': '#059669',
  'Rejected': '#EF4444',
  'Withdrawn': '#6B7280',
};

const CLEARANCES = ['None', 'Secret', 'TS', 'TS/SCI', 'TS/SCI w/FSP'];

export default function Reports() {
  const [apps, setApps] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getApplications(),
      api.getRequisitions(),
      api.getCandidates(),
    ]).then(([a, r, c]) => {
      setApps(a);
      setReqs(r);
      setCandidates(c);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  // Pipeline stage counts
  const stageCounts = {};
  PIPELINE_STAGES.forEach((s) => { stageCounts[s] = 0; });
  apps.forEach((a) => { stageCounts[a.pipelineStage] = (stageCounts[a.pipelineStage] || 0) + 1; });
  const maxCount = Math.max(...Object.values(stageCounts), 1);

  // Open reqs with days active
  const daysSince = (date) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  const openReqs = reqs.filter((r) => r.status === 'Open').sort((a, b) =>
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Clearance breakdown
  const clearanceCounts = {};
  CLEARANCES.forEach((c) => { clearanceCounts[c] = 0; });
  candidates.forEach((c) => {
    const lvl = c.clearanceLevel || 'None';
    clearanceCounts[lvl] = (clearanceCounts[lvl] || 0) + 1;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Stages */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-navy mb-4">Pipeline by Stage</h2>
          <div className="space-y-3">
            {PIPELINE_STAGES.map((stage) => (
              <div key={stage} className="flex items-center gap-3">
                <span className="text-sm w-32 text-gray-600 truncate">{stage}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                  <div
                    className="h-6 rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium transition-all"
                    style={{
                      width: `${Math.max((stageCounts[stage] / maxCount) * 100, stageCounts[stage] > 0 ? 15 : 0)}%`,
                      backgroundColor: STAGE_COLORS[stage],
                    }}
                  >
                    {stageCounts[stage] > 0 && stageCounts[stage]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clearance Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-navy mb-4">Clearance Breakdown</h2>
          <div className="space-y-3">
            {CLEARANCES.map((level) => (
              <div key={level} className="flex items-center justify-between p-3 bg-light-gray rounded-lg">
                <span className="text-sm font-medium">{level}</span>
                <span className="text-lg font-bold text-navy">{clearanceCounts[level]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Total Candidates</span>
            <span className="text-lg font-bold text-navy">{candidates.length}</span>
          </div>
        </div>

        {/* Open Reqs */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-navy mb-4">Open Requisitions</h2>
          {openReqs.length === 0 ? (
            <p className="text-gray-400 text-sm">No open requisitions</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-navy/5 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-600">Position</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Days Active</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Open Slots</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Candidates</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Recruiter</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {openReqs.map((req) => {
                  const days = daysSince(req.createdAt);
                  return (
                    <tr key={req.id}>
                      <td className="px-4 py-2 font-medium">{req.position}</td>
                      <td className="px-4 py-2">{req.customer}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          days > 30 ? 'bg-red-100 text-red-700' : days > 14 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {days}d
                        </span>
                      </td>
                      <td className="px-4 py-2">{req.openSlots}</td>
                      <td className="px-4 py-2">{req.applications?.length || 0}</td>
                      <td className="px-4 py-2 text-gray-500">{req.recruiter || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
