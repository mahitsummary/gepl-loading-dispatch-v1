'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import AutoComplete from '@/components/AutoComplete';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';

export default function OutputPage() {
  const [outputs, setOutputs] = useState([]);
  const [plants, setPlants] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    plantId: null,
    itemId: null,
    quantity: '',
    rejectedQuantity: '',
    outputDate: formatDate(new Date()),
    remarks: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [outputData, plantData, itemData] = await Promise.all([
        api.fetchProductionOutput(),
        api.fetchPlants(),
        api.fetchItems(),
      ]);

      setOutputs(outputData);
      setPlants(plantData);
      setItems(itemData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOutput = () => {
    setFormData({
      plantId: null,
      itemId: null,
      quantity: '',
      rejectedQuantity: '',
      outputDate: formatDate(new Date()),
      remarks: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      await api.recordProductionOutput(formData);
      await loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving output:', error);
      alert('Error saving output');
    }
  };

  const columns = [
    { key: 'outputNumber', label: 'Output #' },
    { key: 'plantName', label: 'Plant' },
    { key: 'itemName', label: 'Item' },
    { key: 'quantity', label: 'Qty Produced', render: (v) => formatNumber(v) },
    { key: 'rejectedQuantity', label: 'Rejected', render: (v) => formatNumber(v) },
    { key: 'outputDate', label: 'Date', render: (v) => formatDate(v) },
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
            Production Output
          </h1>
          <p className="text-secondary-600 mt-1">
            Record production line output
          </p>
        </div>
        <button
          onClick={handleAddOutput}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Record Output
        </button>
      </div>

      <DataTable
        columns={columns}
        data={outputs}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['outputNumber', 'itemName']}
        pageSize={10}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Production Output"
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
            label="Output Date"
            type="date"
            value={formData.outputDate}
            onChange={(e) => setFormData({ ...formData, outputDate: e.target.value })}
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
            label="Quantity Produced"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
          <FormField
            label="Rejected Quantity"
            type="number"
            value={formData.rejectedQuantity}
            onChange={(e) => setFormData({ ...formData, rejectedQuantity: e.target.value })}
          />
          <FormField
            label="Remarks"
            type="textarea"
            rows={2}
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Any comments..."
          />
        </div>
      </Modal>
    </div>
  );
}
