'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import FormField from '@/components/FormField';
import AutoComplete from '@/components/AutoComplete';
import { Award, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';

export default function ScorecardPage() {
  const [scores, setScores] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [period, setPeriod] = useState('current_month');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [scoreData, supervisorData] = await Promise.all([
        api.fetchSupervisorScores({ period }),
        api.fetchSupervisors(),
      ]);

      setScores(scoreData);
      setSupervisors(supervisorData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  const columns = [
    { key: 'supervisorName', label: 'Supervisor' },
    {
      key: 'tasksCompleted',
      label: 'Tasks Completed',
      render: (v) => formatNumber(v),
    },
    {
      key: 'onTimeDelivery',
      label: 'On-time Delivery %',
      render: (v) => `${v}%`,
    },
    {
      key: 'accuracyScore',
      label: 'Accuracy %',
      render: (v) => `${v}%`,
    },
    {
      key: 'qualityScore',
      label: 'Quality Score',
      render: (v) => `${v}/10`,
    },
    {
      key: 'overallScore',
      label: 'Overall Score',
      render: (v) => (
        <span
          className={`px-3 py-1 rounded-full font-bold text-sm ${
            v >= 8
              ? 'bg-green-100 text-green-800'
              : v >= 6
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
          }`}
        >
          {v}/10
        </span>
      ),
    },
    { key: 'period', label: 'Period' },
  ];

  const supervisorOptions = supervisors.map((s) => ({
    id: s.id,
    name: s.supervisorName,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            Supervisor Scorecard
          </h1>
          <p className="text-secondary-600 mt-1">
            Performance metrics and ratings for supervisors
          </p>
        </div>
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <Award size={20} className="text-yellow-600" />
          <div>
            <p className="text-sm text-yellow-600 font-medium">Top Performer</p>
            <p className="text-lg font-bold text-yellow-900">John Doe</p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg border border-secondary-200 p-6">
        <h2 className="font-semibold text-secondary-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Period"
            type="select"
            value={period}
            onChange={handlePeriodChange}
            options={[
              { value: 'current_month', label: 'Current Month' },
              { value: 'last_month', label: 'Last Month' },
              { value: 'last_quarter', label: 'Last Quarter' },
              { value: 'last_year', label: 'Last Year' },
            ]}
          />
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Average Score</p>
          <p className="text-3xl font-bold text-blue-900">7.8/10</p>
          <p className="text-xs text-blue-600 mt-2">+0.3 from last period</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <p className="text-sm text-green-600 font-medium">Avg Completion</p>
          <p className="text-3xl font-bold text-green-900">94%</p>
          <p className="text-xs text-green-600 mt-2">+2% from last period</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">Avg Accuracy</p>
          <p className="text-3xl font-bold text-purple-900">96%</p>
          <p className="text-xs text-purple-600 mt-2">+1% from last period</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
          <p className="text-sm text-orange-600 font-medium">Avg Quality</p>
          <p className="text-3xl font-bold text-orange-900">8.2/10</p>
          <p className="text-xs text-orange-600 mt-2">+0.5 from last period</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={scores}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['supervisorName']}
        pageSize={10}
      />
    </div>
  );
}
