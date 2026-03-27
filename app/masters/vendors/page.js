'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import api from '@/lib/api';

export default function VendorsMaster() {
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    vendorName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchVendors();
      setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVendor = () => {
    setEditingVendor(null);
    setFormData({
      vendorName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      gstin: '',
    });
    setShowModal(true);
  };

  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor);
    setFormData(vendor);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingVendor) {
        await api.updateVendor(editingVendor.id, formData);
      } else {
        await api.addVendor(formData);
      }
      await loadVendors();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Error saving vendor');
    }
  };

  const handleDelete = async (vendorId) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      try {
        await api.deleteVendor(vendorId);
        await loadVendors();
      } catch (error) {
        console.error('Error deleting vendor:', error);
        alert('Error deleting vendor');
      }
    }
  };

  const columns = [
    { key: 'vendorName', label: 'Vendor Name' },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
    { key: 'gstin', label: 'GSTIN' },
    {
      key: 'actions',
      label: 'Actions',
      disableSort: true,
      render: (_, vendor) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditVendor(vendor)}
            className="text-primary-600 hover:text-primary-900"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(vendor.id)}
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
            Vendor Master
          </h1>
          <p className="text-secondary-600 mt-1">Manage vendor information</p>
        </div>
        <button
          onClick={handleAddVendor}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Add Vendor
        </button>
      </div>

      <DataTable
        columns={columns}
        data={vendors}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['vendorName', 'email', 'phone']}
        pageSize={10}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
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
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="Vendor Name"
            value={formData.vendorName}
            onChange={(e) =>
              setFormData({ ...formData, vendorName: e.target.value })
            }
            placeholder="e.g., ABC Supplies Pvt Ltd"
            required
          />
          <FormField
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) =>
              setFormData({ ...formData, contactPerson: e.target.value })
            }
            placeholder="e.g., John Smith"
          />
          <FormField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="e.g., contact@vendor.com"
          />
          <FormField
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="e.g., +91-9876543210"
          />
          <FormField
            label="Address"
            type="textarea"
            rows={3}
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="Full address"
          />
          <FormField
            label="GSTIN"
            value={formData.gstin}
            onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
            placeholder="e.g., 27AABCT1234H1Z0"
          />
        </div>
      </Modal>
    </div>
  );
}
