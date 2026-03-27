'use client';

import { useState, useEffect } from 'react';
import MetricCard from '@/components/MetricCard';
import Modal from '@/components/Modal';
import {
  Package,
  TrendingUp,
  Truck,
  FileText,
  Activity,
  Plus,
  Eye,
} from 'lucide-react';
import api from '@/lib/api';
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalStockValue: 0,
    pendingGRNs: 0,
    openRequisitions: 0,
    goodsInTransit: 0,
    pendingReconciliation: 0,
  });

  const [stockOverview, setStockOverview] = useState({
    availableStock: 0,
    inTransit: 0,
    fgStock: 0,
    rejected: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [quickActionType, setQuickActionType] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [dashboardMetrics, activity, stock, transit, fgStock, rejectedStock] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.fetchRecentActivity(10).catch(() => []),
        api.getOverallStock().catch(() => []),
        api.getGoodsInTransit().catch(() => []),
        api.getFGStock().catch(() => []),
        api.getRejectedStock().catch(() => []),
      ]);

      if (dashboardMetrics) {
        setMetrics(dashboardMetrics);
      }
      setRecentActivity(Array.isArray(activity) ? activity : []);
      setStockOverview({
        availableStock: Array.isArray(stock) ? stock.length : 0,
        inTransit: Array.isArray(transit) ? transit.length : 0,
        fgStock: Array.isArray(fgStock) ? fgStock.length : 0,
        rejected: Array.isArray(rejectedStock) ? rejectedStock.length : 0,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (actionType) => {
    setQuickActionType(actionType);
    setShowQuickAction(true);
  };

  const activityIcons = {
    grn: Package,
    requisition: FileText,
    dispatch: Truck,
    receipt: Package,
    production: TrendingUp,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600 mt-1">
            Welcome back! Here's your material tracking overview.
          </p>
        </div>
        <div className="text-right text-sm text-secondary-600">
          <p>Last updated: {formatDate(new Date())}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Stock Value"
          value={formatCurrency(metrics.totalStockValue)}
          color="primary"
          icon={Package}
          onClick={() => setSelectedMetric('stock')}
        />
        <MetricCard
          title="Pending GRNs"
          value={metrics.pendingGRNs}
          unit="Items"
          color="blue"
          icon={Truck}
          trend="up"
          trendLabel="+2 today"
          onClick={() => setSelectedMetric('grn')}
        />
        <MetricCard
          title="Open Requisitions"
          value={metrics.openRequisitions}
          unit="Items"
          color="yellow"
          icon={FileText}
          onClick={() => setSelectedMetric('requisition')}
        />
        <MetricCard
          title="Goods in Transit"
          value={metrics.goodsInTransit}
          unit="Packages"
          color="purple"
          icon={Truck}
          onClick={() => setSelectedMetric('transit')}
        />
        <MetricCard
          title="Pending Reconciliation"
          value={metrics.pendingReconciliation}
          unit="Items"
          color="red"
          icon={Activity}
          trend="down"
          trendLabel="-1 today"
          onClick={() => setSelectedMetric('reco')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-secondary-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-secondary-200 bg-secondary-50">
            <h2 className="font-semibold text-secondary-900 flex items-center gap-2">
              <Activity size={20} />
              Recent Activity
            </h2>
          </div>

          {recentActivity.length > 0 ? (
            <div className="divide-y divide-secondary-200 max-h-96 overflow-y-auto">
              {recentActivity.map((activity, index) => {
                const ActivityIcon = activityIcons[activity.type] || Activity;
                return (
                  <div
                    key={activity.id || index}
                    className="px-6 py-4 hover:bg-secondary-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-primary-100 rounded-lg text-primary-600 mt-1">
                        <ActivityIcon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-secondary-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-secondary-600 mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-secondary-500 mt-2">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          activity.status === 'open'
                            ? 'bg-blue-100 text-blue-800'
                            : activity.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {activity.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-secondary-500">
              <Activity size={32} className="mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <h2 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <Plus size={20} />
            Quick Actions
          </h2>

          <div className="space-y-2">
            <button
              onClick={() => handleQuickAction('grn')}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-primary-50 border border-primary-200 text-primary-700 transition-colors font-medium text-sm"
            >
              + Create GRN
            </button>
            <button
              onClick={() => handleQuickAction('requisition')}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 border border-blue-200 text-blue-700 transition-colors font-medium text-sm"
            >
              + New Requisition
            </button>
            <button
              onClick={() => handleQuickAction('dispatch')}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-purple-50 border border-purple-200 text-purple-700 transition-colors font-medium text-sm"
            >
              + New Dispatch
            </button>
            <button
              onClick={() => handleQuickAction('receipt')}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 border border-green-200 text-green-700 transition-colors font-medium text-sm"
            >
              + Record Receipt
            </button>
            <button
              onClick={() => handleQuickAction('production')}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-yellow-50 border border-yellow-200 text-yellow-700 transition-colors font-medium text-sm"
            >
              + Production Output
            </button>
          </div>

          <div className="mt-6 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
            <h3 className="font-medium text-secondary-900 mb-2 text-sm">
              System Status
            </h3>
            <div className="space-y-2 text-xs text-secondary-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>All Systems Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Database Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>API Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <h3 className="font-medium text-green-900 mb-2">Available Stock</h3>
          <p className="text-2xl font-bold text-green-700">{formatNumber(stockOverview.availableStock)}</p>
          <p className="text-xs text-green-600 mt-2">Items in warehouse</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
          <h3 className="font-medium text-yellow-900 mb-2">In Transit</h3>
          <p className="text-2xl font-bold text-yellow-700">{formatNumber(stockOverview.inTransit)}</p>
          <p className="text-xs text-yellow-600 mt-2">Units on the way</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">FG Stock</h3>
          <p className="text-2xl font-bold text-blue-700">{formatNumber(stockOverview.fgStock)}</p>
          <p className="text-xs text-blue-600 mt-2">Finished goods ready</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
          <h3 className="font-medium text-red-900 mb-2">Rejected</h3>
          <p className="text-2xl font-bold text-red-700">{formatNumber(stockOverview.rejected)}</p>
          <p className="text-xs text-red-600 mt-2">Items under review</p>
        </div>
      </div>

      {/* Quick Action Modal */}
      <Modal
        isOpen={showQuickAction}
        onClose={() => setShowQuickAction(false)}
        title={`${quickActionType.charAt(0).toUpperCase() + quickActionType.slice(1)} - Quick Entry`}
        size="lg"
      >
        <div className="text-center py-8">
          <Eye size={48} className="mx-auto text-secondary-300 mb-4" />
          <p className="text-secondary-600 mb-4">
            Detailed form for {quickActionType} creation will appear here
          </p>
          <button
            onClick={() => setShowQuickAction(false)}
            className="px-4 py-2 bg-secondary-200 text-secondary-900 rounded-lg hover:bg-secondary-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
