'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function ItemsMaster() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    itemCode: '',
    itemName: '',
    category: '',
    subCategory: '',
    uom: '',
    hsn: '',
    gstRate: '',
    manufacturer: '',
    materialType: '',
    status: 'Active',
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchItems();
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({
      itemCode: '',
      itemName: '',
      category: '',
      subCategory: '',
      uom: '',
      hsn: '',
      gstRate: '',
      manufacturer: '',
      materialType: '',
      status: 'Active',
    });
    setShowModal(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        await api.updateItem(editingItem.id, formData);
      } else {
        await api.addItem(formData);
      }
      await loadItems();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item');
    }
  };

  const handleDelete = async (itemId) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await api.deleteItem(itemId);
        await loadItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item');
      }
    }
  };

  const columns = [
    { key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'category', label: 'Category' },
    { key: 'uom', label: 'UOM' },
    { key: 'hsn', label: 'HSN' },
    { key: 'gstRate', label: 'GST %' },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      disableSort: true,
      render: (_, item) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditItem(item)}
            className="text-primary-600 hover:text-primary-900"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
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
          <h1 className="text-3xl font-bold text-secondary-900">Item Master</h1>
          <p className="text-secondary-600 mt-1">Manage items in the system</p>
        </div>
        <button
          onClick={handleAddItem}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Add Item
        </button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['itemCode', 'itemName', 'category']}
        pageSize={10}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit Item' : 'Add New Item'}
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
            label="Item Code"
            value={formData.itemCode}
            onChange={(e) =>
              setFormData({ ...formData, itemCode: e.target.value })
            }
            placeholder="e.g., IT-001"
            required
          />
          <FormField
            label="Item Name"
            value={formData.itemName}
            onChange={(e) =>
              setFormData({ ...formData, itemName: e.target.value })
            }
            placeholder="e.g., Fastener A"
            required
          />
          <FormField
            label="Category"
            type="select"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            options={[
              { value: 'Raw Material', label: 'Raw Material' },
              { value: 'Semi-Finished', label: 'Semi-Finished' },
              { value: 'Finished Good', label: 'Finished Good' },
              { value: 'Packaging', label: 'Packaging' },
              { value: 'Consumable', label: 'Consumable' },
            ]}
          />
          <FormField
            label="Sub Category"
            value={formData.subCategory}
            onChange={(e) =>
              setFormData({ ...formData, subCategory: e.target.value })
            }
            placeholder="e.g., Metal Parts"
          />
          <FormField
            label="UOM"
            type="select"
            value={formData.uom}
            onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
            options={[
              { value: 'PCS', label: 'Pieces' },
              { value: 'KG', label: 'Kilogram' },
              { value: 'MTR', label: 'Meter' },
              { value: 'BOX', label: 'Box' },
              { value: 'LTR', label: 'Litre' },
              { value: 'GM', label: 'Gram' },
              { value: 'DOZEN', label: 'Dozen' },
              { value: 'SET', label: 'Set' },
              { value: 'ROLL', label: 'Roll' },
              { value: 'PAIR', label: 'Pair' },
              { value: 'BUNDLE', label: 'Bundle' },
              { value: 'SHEET', label: 'Sheet' },
              { value: 'BAG', label: 'Bag' },
              { value: 'DRUM', label: 'Drum' },
              { value: 'CARTON', label: 'Carton' },
            ]}
            required
          />
          <FormField
            label="HSN Code"
            value={formData.hsn}
            onChange={(e) => setFormData({ ...formData, hsn: e.target.value })}
            placeholder="e.g., 7308"
          />
          <FormField
            label="GST Rate (%)"
            type="number"
            value={formData.gstRate}
            onChange={(e) =>
              setFormData({ ...formData, gstRate: e.target.value })
            }
            placeholder="e.g., 18"
          />
        </div>
      </Modal>
    </div>
  );
}
