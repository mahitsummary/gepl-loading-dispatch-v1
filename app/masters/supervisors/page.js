'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import api from '@/lib/api';

export default function SupervisorsMaster() {
  const [supervisors, setSupervisors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [formData, setFormData] = useState({
    supervisorName: '',
    phone: '',
    residentialAddress: '',
    email: '',
    role: '',
    assignedWarehouse: '',
    status: 'Active',
  });

  useEffect(() => {
    loadSupervisors();
  }, []);

  const loadSupervisors = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchSupervisors();
      setSupervisors(data);
    } catch (error) {
      console.error('Error loading supervisors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSupervisor = () => {
    setEditingSupervisor(null);
    setFormData({
      supervisorName: '',
      phone: '',
      residentialAddress: '',
      email: '',
      role: '',
      assignedWarehouse: '',
      status: 'Active',
    });
    setShowModal(true);
  };

  const handleEditSupervisor = (supervisor) => {
    setEditingSupervisor(supervisor);
    setFormData(supervisor);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingSupervisor) {
        await api.updateSupervisor(editingSupervisor.id, formData);
      } else {
        await api.addSupervisor(formData);
      }
      await loadSupervisors();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving supervisor:', error);
      alert('Error saving supervisor');
    }
  };

  const handleDelete = async (supervisorId) => {
    if (confirm('Are you sure you want to delete this supervisor?')) {
      try {
        await api.deleteSupervisor(supervisorId);
        await loadSupervisors();
      } catch (error) {
        console.error('Error deleting supervisor:', error);
        alert('Error deleting supervisor');
      }
    }
  };

  const columns = [
    { key: 'supervisorName', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'assignedWarehouse', label: 'Assigned Warehouse' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      disableSort: true,
      render: (_, supervisor) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditSupervisor(supervisor)}
            className="text-primary-600 hover:text-primary-900"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(supervisor.id)}
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
            Supervisor Master
          </h1>
          <p className="text-secondary-600 mt-1">
            Manage supervisor information
          </p>
        </div>
        <button
          onClick={handleAddSupervisor}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Add Supervisor
        </button>
      </div>

      <DataTable
        columns={columns}
        data={supervisors}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['supervisorName', 'email', 'role']}
        pageSize={10}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSupervisor ? 'Edit Supervisor' : 'Add New Supervisor'}
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
            label="Supervisor Name"
            value={formData.supervisorName}
            onChange={(e) =>
              setFormData({ ...formData, supervisorName: e.target.value })
            }
            placeholder="Full name"
            required
          />
          <FormField
            label="Phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="+91-9876543210"
            required
          />
          <FormField
            label="Residential Address"
            type="textarea"
            rows={2}
            value={formData.residentialAddress}
            onChange={(e) =>
              setFormData({ ...formData, residentialAddress: e.target.value })
            }
            placeholder="Full residential address"
            required
          />
          <FormField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="e.g., supervisor@company.com"
          />
          <FormField
            label="Role"
            type="select"
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value })
            }
            options={[
              { value: 'Security', label: 'Security' },
              { value: 'Loading/Unloading Supervisor', label: 'Loading/Unloading Supervisor' },
              { value: 'Stockist', label: 'Stockist' },
              { value: 'Admin', label: 'Admin' },
              { value: 'Accountant', label: 'Accountant' },
              { value: 'Godown Manager', label: 'Godown Manager' },
              { value: 'Site Manager', label: 'Site Manager' },
            ]}
            required
          />
          <FormField
            label="Assigned Warehouse"
            value={formData.assignedWarehouse}
            onChange={(e) =>
              setFormData({
                ...formData,
                assignedWarehouse: e.target.value,
              })
            }
            placeholder="Warehouse name or code"
          />
          <FormField
            label="Status"
            type="select"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
