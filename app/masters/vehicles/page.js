'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import api from '@/lib/api';

export default function VehiclesMaster() {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: '',
    manufacturer: '',
    registrationDate: '',
    fitnessExpiryDate: '',
    insuranceExpiryDate: '',
    capacity: '',
    status: 'active',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setFormData({
      vehicleNumber: '',
      vehicleType: '',
      manufacturer: '',
      registrationDate: '',
      fitnessExpiryDate: '',
      insuranceExpiryDate: '',
      capacity: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData(vehicle);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingVehicle) {
        await api.updateVehicle(editingVehicle.id, formData);
      } else {
        await api.addVehicle(formData);
      }
      await loadVehicles();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Error saving vehicle');
    }
  };

  const handleDelete = async (vehicleId) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await api.deleteVehicle(vehicleId);
        await loadVehicles();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('Error deleting vehicle');
      }
    }
  };

  const columns = [
    { key: 'vehicleNumber', label: 'Vehicle #' },
    { key: 'vehicleType', label: 'Type' },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'registrationDate', label: 'Reg. Date' },
    { key: 'fitnessExpiryDate', label: 'Fitness Expiry' },
    { key: 'insuranceExpiryDate', label: 'Insurance Expiry' },
    { key: 'capacity', label: 'Capacity' },
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
      render: (_, vehicle) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditVehicle(vehicle)}
            className="text-primary-600 hover:text-primary-900"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(vehicle.id)}
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
            Vehicle Master
          </h1>
          <p className="text-secondary-600 mt-1">Manage vehicle information</p>
        </div>
        <button
          onClick={handleAddVehicle}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Add Vehicle
        </button>
      </div>

      <DataTable
        columns={columns}
        data={vehicles}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['vehicleNumber', 'vehicleType', 'manufacturer']}
        pageSize={10}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
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
            label="Vehicle Number"
            value={formData.vehicleNumber}
            onChange={(e) =>
              setFormData({ ...formData, vehicleNumber: e.target.value })
            }
            placeholder="e.g., MH-01-AB-1234"
            required
          />
          <FormField
            label="Vehicle Type"
            value={formData.vehicleType}
            onChange={(e) =>
              setFormData({ ...formData, vehicleType: e.target.value })
            }
            placeholder="e.g., Truck, Tempo, Lorry"
            required
          />
          <FormField
            label="Manufacturer"
            value={formData.manufacturer}
            onChange={(e) =>
              setFormData({ ...formData, manufacturer: e.target.value })
            }
            placeholder="e.g., Ashok Leyland"
          />
          <FormField
            label="Registration Date"
            type="date"
            value={formData.registrationDate}
            onChange={(e) =>
              setFormData({ ...formData, registrationDate: e.target.value })
            }
          />
          <FormField
            label="Fitness Expiry Date"
            type="date"
            value={formData.fitnessExpiryDate}
            onChange={(e) =>
              setFormData({
                ...formData,
                fitnessExpiryDate: e.target.value,
              })
            }
          />
          <FormField
            label="Insurance Expiry Date"
            type="date"
            value={formData.insuranceExpiryDate}
            onChange={(e) =>
              setFormData({
                ...formData,
                insuranceExpiryDate: e.target.value,
              })
            }
          />
          <FormField
            label="Capacity (in units)"
            type="number"
            value={formData.capacity}
            onChange={(e) =>
              setFormData({ ...formData, capacity: e.target.value })
            }
            placeholder="e.g., 5000"
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
