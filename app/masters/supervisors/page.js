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
    employeeId: '',
    email: '',
    phone: '',
    department: '',
    assignedWarehouse: '',
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
      employeeId: '',
      email: '',
      phone: '',
      department: '',
      assignedWarehouse: '',
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
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'department', label: 'Department' },
    { key: 'assignedWarehouse', label: 'Assigned Warehouse' },
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
        searchableFields={['supervisorName', 'email', 'department']}
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
            label="Employee ID"
            value={formData.employeeId}
            onChange={(e) =>
              setFormData({ ...formData, employeeId: e.target.value })
            }
            placeholder="e.g., EMP-001"
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
            label="Phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="e.g., +91-9876543210"
          />
          <FormField
            label="Department"
            value={formData.department}
            onChange={(e) =>
              setFormData({ ...formData, department: e.target.value })
            }
            placeholder="e.g., Warehouse"
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
        </div>
      </Modal>
    </div>
  );
}
