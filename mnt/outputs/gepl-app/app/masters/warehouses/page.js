'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import api from '@/lib/api';

export default function WarehousesMaster() {
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [formData, setFormData] = useState({
    warehouseName: '',
    warehouseCode: '',
    location: '',
    city: '',
    state: '',
    pincode: '',
    managerName: '',
    phone: '',
    capacity: '',
  });

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchWarehouses();
      setWarehouses(data);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWarehouse = () => {
    setEditingWarehouse(null);
    setFormData({
      warehouseName: '',
      warehouseCode: '',
      location: '',
      city: '',
      state: '',
      pincode: '',
      managerName: '',
      phone: '',
      capacity: '',
    });
    setShowModal(true);
  };

  const handleEditWarehouse = (warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData(warehouse);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingWarehouse) {
        await api.updateWarehouse(editingWarehouse.id, formData);
      } else {
        await api.addWarehouse(formData);
      }
      await loadWarehouses();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving warehouse:', error);
      alert('Error saving warehouse');
    }
  };

  const handleDelete = async (warehouseId) => {
    if (confirm('Are you sure you want to delete this warehouse?')) {
      try {
        await api.deleteWarehouse(warehouseId);
        await loadWarehouses();
      } catch (error) {
        console.error('Error deleting warehouse:', error);
        alert('Error deleting warehouse');
      }
    }
  };

  const columns = [
    { key: 'warehouseName', label: 'Warehouse Name' },
    { key: 'warehouseCode', label: 'Code' },
    { key: 'location', label: 'Location' },
    { key: 'city', label: 'City' },
    { key: 'managerName', label: 'Manager' },
    { key: 'phone', label: 'Phone' },
    { key: 'capacity', label: 'Capacity' },
    {
      key: 'actions',
      label: 'Actions',
      disableSort: true,
      render: (_, warehouse) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditWarehouse(warehouse)}
            className="text-primary-600 hover:text-primary-900"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(warehouse.id)}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            Warehouse Master
          </h1>
          <p className="text-secondary-600 mt-1">
            Manage warehouse locations and information
          </p>
        </div>
        <button
          onClick={handleAddWarehouse}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Add Warehouse
        </button>
      </div>

      <DataTable
        columns={columns}
        data={warehouses}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['warehouseName', 'city', 'managerName']}
        pageSize={10}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
        size="lg"
        actions={[
          {
            label: 'Cancel',
            variant: 'secondary',
            onClick: () => setShowModal(false),
          },
          {
            label: 'Save',
            onClick: handleSave,
          },
        ]}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Warehouse Name"
            value={formData.warehouseName}
            onChange={(e) =>
              setFormData({ ...formData, warehouseName: e.target.value })
            }
            placeholder="e.g., Central Warehouse"
            required
          />
          <FormField
            label="Warehouse Code"
            value={formData.warehouseCode}
            onChange={(e) =>
              setFormData({ ...formData, warehouseCode: e.target.value })
            }
            placeholder="e.g., WH-001"
            required
          />
          <FormField
            label="Location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="Specific location details"
          />
          <FormField
            label="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="e.g., Mumbai"
            required
          />
          <FormField
            label="State"
            value={formData.state}
            onChange={(e) =>
              setFormData({ ...formData, state: e.target.value })
            }
            placeholder="e.g., Maharashtra"
            required
          />
          <FormField
            label="Pincode"
            value={formData.pincode}
            onChange={(e) =>
              setFormData({ ...formData, pincode: e.target.value })
            }
            placeholder="e.g., 400001"
          />
          <FormField
            label="Manager Name"
            value={formData.managerName}
            onChange={(e) =>
              setFormData({ ...formData, managerName: e.target.value })
            }
            placeholder="Warehouse manager name"
          />
          <FormField
            label="Phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="e.g., +91-9876543210"
          />
          <FormField
            label="Capacity"
            type="number"
            value={formData.capacity}
            onChange={(e) =>
              setFormData({ ...formData, capacity: e.target.value })
            }
            placeholder="Storage capacity in units"
          />
        </div>
      </Modal>
    </div>
  );
}
