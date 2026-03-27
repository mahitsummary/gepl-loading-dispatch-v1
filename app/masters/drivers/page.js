'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import api from '@/lib/api';

export default function DriversMaster() {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    driverName: '',
    licenseNumber: '',
    licenseExpiry: '',
    phone: '',
    address: '',
    aadhar: '',
    status: 'active',
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchDrivers();
      setDrivers(data);
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDriver = () => {
    setEditingDriver(null);
    setFormData({
      driverName: '',
      licenseNumber: '',
      licenseExpiry: '',
      phone: '',
      address: '',
      aadhar: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const handleEditDriver = (driver) => {
    setEditingDriver(driver);
    setFormData(driver);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingDriver) {
        await api.updateDriver(editingDriver.id, formData);
      } else {
        await api.addDriver(formData);
      }
      await loadDrivers();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving driver:', error);
      alert('Error saving driver');
    }
  };

  const handleDelete = async (driverId) => {
    if (confirm('Are you sure you want to delete this driver?')) {
      try {
        await api.deleteDriver(driverId);
        await loadDrivers();
      } catch (error) {
        console.error('Error deleting driver:', error);
        alert('Error deleting driver');
      }
    }
  };

  const columns = [
    { key: 'driverName', label: 'Name' },
    { key: 'licenseNumber', label: 'License #' },
    { key: 'licenseExpiry', label: 'License Expiry' },
    { key: 'phone', label: 'Phone' },
    { key: 'aadhar', label: 'Aadhar' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      disableSort: true,
      render: (_, driver) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditDriver(driver)}
            className="text-primary-600 hover:text-primary-900"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(driver.id)}
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
            Driver Master
          </h1>
          <p className="text-secondary-600 mt-1">Manage driver information</p>
        </div>
        <button
          onClick={handleAddDriver}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Add Driver
        </button>
      </div>

      <DataTable
        columns={columns}
        data={drivers}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['driverName', 'licenseNumber', 'phone']}
        pageSize={10}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingDriver ? 'Edit Driver' : 'Add New Driver'}
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
            label="Driver Name"
            value={formData.driverName}
            onChange={(e) =>
              setFormData({ ...formData, driverName: e.target.value })
            }
            placeholder="Full name"
            required
          />
          <FormField
            label="License Number"
            value={formData.licenseNumber}
            onChange={(e) =>
              setFormData({ ...formData, licenseNumber: e.target.value })
            }
            placeholder="License number"
            required
          />
          <FormField
            label="License Expiry Date"
            type="date"
            value={formData.licenseExpiry}
            onChange={(e) =>
              setFormData({ ...formData, licenseExpiry: e.target.value })
            }
            required
          />
          <FormField
            label="Phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="e.g., +91-9876543210"
            required
          />
          <FormField
            label="Aadhar Number"
            value={formData.aadhar}
            onChange={(e) => setFormData({ ...formData, aadhar: e.target.value })}
            placeholder="12-digit Aadhar"
          />
          <FormField
            label="Address"
            type="textarea"
            rows={2}
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="Full address"
          />
          <FormField
            label="Status"
            type="select"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
