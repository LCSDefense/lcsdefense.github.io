import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const STATUS_COLORS = {
  'Not Started': 'bg-gray-200 text-gray-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  'Complete': 'bg-green-100 text-green-700',
};

export default function Onboarding() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getOnboardingRecords().then(setRecords).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Onboarding</h1>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No onboarding records yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-navy/5 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Employee</th>
                <th className="px-4 py-3 font-medium text-gray-600">Position</th>
                <th className="px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 font-medium text-gray-600">Start Date</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((rec) => {
                const total = rec.checklistItems?.length || 0;
                const done = rec.checklistItems?.filter((i) => i.isComplete).length || 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <tr
                    key={rec.id}
                    onClick={() => navigate(`/onboarding/${rec.id}`)}
                    className="hover:bg-light-gray cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-medium">{rec.employeeName}</td>
                    <td className="px-4 py-3">{rec.position || '—'}</td>
                    <td className="px-4 py-3">{rec.customer || '—'}</td>
                    <td className="px-4 py-3">
                      {rec.startDate ? new Date(rec.startDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[rec.onboardingStatus] || 'bg-gray-100'}`}>
                        {rec.onboardingStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div className="bg-navy rounded-full h-2" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{done}/{total}</span>
                      </div>
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
