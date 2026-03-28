'use client';

import { useState, useEffect } from 'react';
import { Plus, Undo2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import AutoComplete from '@/components/AutoComplete';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { formatDate, getCurrentDate } from '@/lib/utils';

export default function RMReturnPage() {
  const [returns, setReturns] = useState([]);
  const [plants, setPlants] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productionPlant: null,
    returnDate: getCurrentDate(),
    returnedBy: '',
    destinationWarehouse: null,
    itemCode: null,
    itemName: '',
    uom: '',
    quantity: '',
    batchId: '',
    remarks: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [returnData, plantData, warehouseData, itemData] = await Promise.all([
        api.fetchReturns(),
        api.fetchPlants(),
        api.fetchWarehouses(),
        api.fetchItems(),
      ]);

      setReturns(returnData);
      setPlants(plantData);
      setWarehouses(warehouseData);
      setItems(itemData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReturn = () => {
    setFormData({
      productionPlant: null,
      returnDate: getCurrentDate(),
      returnedBy: '',
      destinationWarehouse: null,
      itemCode: null,
      itemName: '',
      uom: '',
      quantity: '',
      batchId: '',
      remarks: '',
    });
    setShowModal(true);
  };

  const handleItemChange = (value) => {
    const selectedItem = items.find((i) => i.id === value);
    setFormData({
      ...formData,
      itemCode: value,
      itemName: selectedItem ? selectedItem.itemName : '',
      uom: selectedItem ? selectedItem.uom || '' : '',
    });
  };

  const handleSave = async () => {
    try {
      const selectedPlant = plants.find((p) => p.id === formData.productionPlant);
      const selectedWarehouse = warehouses.find((w) => w.id === formData.destinationWarehouse);
      const selectedItem = items.find((i) => i.id === formData.itemCode);

      await api.returnToStores({
        ...formData,
        plantName: selectedPlant ? selectedPlant.plantName : '',
        warehouseName: selectedWarehouse ? selectedWarehouse.warehouseName : '',
        itemCodeValue: selectedItem ? selectedItem.itemCode : '',
        itemName: selectedItem ? selectedItem.itemName : '',
      });
      await loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving return:', error);
      alert('Error saving return to stores');
    }
  };

  const columns = [
    { key: 'returnNumber', label: 'Return #' },
    { key: 'plantName', label: 'Plant' },
    { key: 'itemName', label: 'Item' },
    { key: 'uom', label: 'UOM' },
    { key: 'quantity', label: 'Qty' },
    { key: 'returnedBy', label: 'Returned By' },
    { key: 'warehouseName', label: 'Warehouse' },
    { key: 'returnDate', label: 'Date', render: (v) => formatDate(v) },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <StatusBadge status={status} />,
    },
  ];

  const plantOptions = plants.map((p) => ({
    id: p.id,
    name: p.plantName,
  }));

  const warehouseOptions = warehouses.map((w) => ({
    id: w.id,
    name: w.warehouseName || w.warehouseCode,
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
            RM Return to Stores
          </h1>
          <p className="text-secondary-600 mt-1">
            Return unused raw materials back to warehouse stock
          </p>
        </div>
        <button
          onClick={handleAddReturn}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Undo2 size={20} />
          New Return
        </button>
      </div>

      <DataTable
        columns={columns}
        data={returns}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['returnNumber', 'plantName', 'itemName', 'returnedBy']}
        pageSize={10}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Return Material to Stores"
        size="lg"
        actions={[
          { label: 'Cancel', variant: 'secondary', onClick: () => setShowModal(false) },
          { label: 'Save', onClick: handleSave },
        ]}
      >
        <div className="grid grid-cols-2 gap-4">
          <AutoComplete
            label="Production Plant"
            options={plantOptions}
            value={formData.productionPlant}
            onChange={(value) => setFormData({ ...formData, productionPlant: value })}
            displayKey="name"
            valueKey="id"
            required
          />
          <FormField
            label="Return Date"
            type="date"
            value={formData.returnDate}
            onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
            required
          />
          <FormField
            label="Returned By"
            value={formData.returnedBy}
            onChange={(e) => setFormData({ ...formData, returnedBy: e.target.value })}
            placeholder="Name of person returning"
            required
          />
          <AutoComplete
            label="Destination Warehouse"
            options={warehouseOptions}
            value={formData.destinationWarehouse}
            onChange={(value) => setFormData({ ...formData, destinationWarehouse: value })}
            displayKey="name"
            valueKey="id"
            required
          />
          <AutoComplete
            label="Item"
            options={itemOptions}
            value={formData.itemCode}
            onChange={handleItemChange}
            displayKey="name"
            valueKey="id"
            required
          />
          <FormField
            label="Item Name"
            value={formData.itemName}
            onChange={() => {}}
            disabled
            placeholder="Auto-filled from item selection"
          />
          <FormField
            label="UOM"
            value={formData.uom}
            onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
            required
          />
          <FormField
            label="Quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
          <FormField
            label="Batch ID"
            value={formData.batchId}
            onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
            placeholder="Optional batch reference"
          />
          <div className="col-span-2">
            <FormField
              label="Remarks"
              type="textarea"
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Reason for return or any comments..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
