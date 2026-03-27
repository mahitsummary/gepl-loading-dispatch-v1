'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import AutoComplete from '@/components/AutoComplete';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function IssuePage() {
  const [issues, setIssues] = useState([]);
  const [plants, setPlants] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    issueNumber: '',
    plantId: null,
    itemId: null,
    quantity: '',
    issueDate: formatDate(new Date()),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [issueData, plantData, itemData] = await Promise.all([
        api.fetchProductionIssues(),
        api.fetchPlants(),
        api.fetchItems(),
      ]);

      setIssues(issueData);
      setPlants(plantData);
      setItems(itemData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIssue = () => {
    setFormData({
      issueNumber: '',
      plantId: null,
      itemId: null,
      quantity: '',
      issueDate: formatDate(new Date()),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      await api.issueToProduction(formData);
      await loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving issue:', error);
      alert('Error saving issue');
    }
  };

  const columns = [
    { key: 'issueNumber', label: 'Issue #' },
    { key: 'plantName', label: 'Plant' },
    { key: 'itemName', label: 'Item' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'issueDate', label: 'Date', render: (v) => formatDate(v) },
    { key: 'status', label: 'Status', render: (status) => <StatusBadge status={status} /> },
  ];

  const plantOptions = plants.map((p) => ({
    id: p.id,
    name: p.plantName,
  }));

  const itemOptions = items.map((i) => ({
    id: i.id,
    name: `${i.itemCode} - ${i.itemName}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            Issue to Production
          </h1>
          <p className="text-secondary-600 mt-1">
            Issue materials to production line
          </p>
        </div>
        <button
          onClick={handleAddIssue}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus size={20} />
          New Issue
        </button>
      </div>

      <DataTable
        columns={columns}
        data={issues}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['issueNumber']}
        pageSize={10}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Issue to Production"
        size="lg"
        actions={[
          { label: 'Cancel', variant: 'secondary', onClick: () => setShowModal(false) },
          { label: 'Save', onClick: handleSave },
        ]}
      >
        <div className="grid grid-cols-2 gap-4">
          <AutoComplete
            label="Plant"
            options={plantOptions}
            value={formData.plantId}
            onChange={(value) => setFormData({ ...formData, plantId: value })}
            displayKey="name"
            valueKey="id"
            required
          />
          <FormField
            label="Issue Date"
            type="date"
            value={formData.issueDate}
            onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
            required
          />
          <AutoComplete
            label="Item"
            options={itemOptions}
            value={formData.itemId}
            onChange={(value) => setFormData({ ...formData, itemId: value })}
            displayKey="name"
            valueKey="id"
            required
          />
          <FormField
            label="Quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
        </div>
      </Modal>
    </div>
  );
}
