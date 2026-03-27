'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import api from '@/lib/api';

export default function PlantsMaster() {
  const [plants, setPlants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [formData, setFormData] = useState({
    plantName: '',
    plantCode: '',
    location: '',
    city: '',
    state: '',
    pincode: '',
    managerName: '',
    phone: '',
    productionCapacity: '',
  });

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchPlants();
      setPlants(data);
    } catch (error) {
      console.error('Error loading plants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlant = () => {
    setEditingPlant(null);
    setFormData({
      plantName: '',
      plantCode: '',
      location: '',
      city: '',
      state: '',
      pincode: '',
      managerName: '',
      phone: '',
      productionCapacity: '',
    });
    setShowModal(true);
  };

  const handleEditPlant = (plant) => {
    setEditingPlant(plant);
    setFormData(plant);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingPlant) {
        await api.updatePlant(editingPlant.id, formData);
      } else {
        await api.addPlant(formData);
      }
      await loadPlants();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving plant:', error);
      alert('Error saving plant');
    }
  };

  const handleDelete = async (plantId) => {
    if (confirm('Are you sure you want to delete this plant?')) {
      try {
        await api.deletePlant(plantId);
        await loadPlants();
      } catch (error) {
        console.error('Error deleting plant:', error);
        alert('Error deleting plant');
      }
    }
  };

  const columns = [
    { key: 'plantName', label: 'Plant Name' },
    { key: 'plantCode', label: 'Code' },
    { key: 'location', label: 'Location' },
    { key: 'city', label: 'City' },
    { key: 'managerName', label: 'Manager' },
    { key: 'phone', label: 'Phone' },
    { key: 'productionCapacity', label: 'Capacity' },
    {
      key: 'actions',
      label: 'Actions',
      disableSort: true,
      render: (_, plant) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditPlant(plant)}
            className="text-primary-600 hover:text-primary-900"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(plant.id)}
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
            Production Plants
          </h1>
          <p className="text-secondary-600 mt-1">
            Manage production plant details
          </p>
        </div>
        <button
          onClick={handleAddPlant}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Add Plant
        </button>
      </div>

      <DataTable
        columns={columns}
        data={plants}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['plantName', 'city', 'managerName']}
        pageSize={10}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPlant ? 'Edit Plant' : 'Add New Plant'}
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
            label="Plant Name"
            value={formData.plantName}
            onChange={(e) =>
              setFormData({ ...formData, plantName: e.target.value })
            }
            placeholder="e.g., Plant A - Assembly"
            required
          />
          <FormField
            label="Plant Code"
            value={formData.plantCode}
            onChange={(e) =>
              setFormData({ ...formData, plantCode: e.target.value })
            }
            placeholder="e.g., PL-001"
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
            placeholder="e.g., Pune"
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
            placeholder="e.g., 411028"
          />
          <FormField
            label="Plant Manager Name"
            value={formData.managerName}
            onChange={(e) =>
              setFormData({ ...formData, managerName: e.target.value })
            }
            placeholder="Plant manager name"
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
            label="Production Capacity (units/day)"
            type="number"
            value={formData.productionCapacity}
            onChange={(e) =>
              setFormData({ ...formData, productionCapacity: e.target.value })
            }
            placeholder="Daily production capacity"
          />
        </div>
      </Modal>
    </div>
  );
}
