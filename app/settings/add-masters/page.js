'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function AddMastersPage() {
  const [activeTab, setActiveTab] = useState('items');

  const masterSections = [
    { id: 'items', label: 'Items', icon: '📦' },
    { id: 'vendors', label: 'Vendors', icon: '🏢' },
    { id: 'warehouses', label: 'Warehouses', icon: '🏭' },
    { id: 'plants', label: 'Plants', icon: '⚙️' },
    { id: 'supervisors', label: 'Supervisors', icon: '👤' },
    { id: 'drivers', label: 'Drivers', icon: '🚗' },
    { id: 'vehicles', label: 'Vehicles', icon: '🚚' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Add Masters</h1>
        <p className="text-secondary-600 mt-1">Manage all master data in one place</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {masterSections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveTab(section.id)}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              activeTab === section.id
                ? 'border-primary-600 bg-primary-50'
                : 'border-secondary-200 bg-white hover:border-primary-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{section.icon}</span>
              <h3 className="text-lg font-semibold text-secondary-900">
                {section.label}
              </h3>
            </div>
            <button className="mt-4 flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm">
              <Plus size={16} />
              Add {section.label}
            </button>
          </button>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="font-semibold text-blue-900 mb-2">Quick Tips</h2>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use meaningful codes for items and warehouses for easy identification</li>
          <li>• Ensure all master data is complete before creating transactions</li>
          <li>• Regular updates to master data keep the system accurate</li>
          <li>• Archive old records instead of deleting them for audit trail</li>
        </ul>
      </div>
    </div>
  );
}
