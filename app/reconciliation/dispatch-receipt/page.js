'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Edit2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';

export default function DispatchReceiptReconPage() {
  // Main data state
  const [reconciliations, setReconciliations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [showVarianceModal, setShowVarianceModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);

  // Variance resolution form
  const [varianceForm, setVarianceForm] = useState({
    remarks: '',
    varianceType: '',
  });

  // Summary state
  const [summary, setSummary] = useState({
    totalDocuments: 0,
    totalPending: 0,
    totalVariances: 0,
    totalVarianceAmount: 0,
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getOpenReconciliations().catch(() => []);
      setReconciliations(data || []);

      // Calculate summary metrics
      const pending = (data || []).filter((doc) => doc.status === 'pending').length;
      const variances = (data || []).filter((doc) =>
        doc.lineItems?.some((item) => item.dispatchQty !== item.receiptQty)
      ).length;

      let totalVarianceAmount = 0;
      (data || []).forEach((doc) => {
        doc.lineItems?.forEach((item) => {
          const variance = Math.abs((item.receiptQty || 0) - (item.dispatchQty || 0));
          if (variance > 0) {
            totalVarianceAmount += variance;
          }
        });
      });

      setSummary({
        totalDocuments: data?.length || 0,
        totalPending: pending,
        totalVariances: variances,
        totalVarianceAmount,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (docId) => {
    if (expandedRows.includes(docId)) {
      setExpandedRows(expandedRows.filter((id) => id !== docId));
    } else {
      setExpandedRows([...expandedRows, docId]);
    }
  };

  // Handle variance resolution
  const handleResolveVariance = (document, lineItemIndex) => {
    setSelectedDocument({ document, lineItemIndex });
    setVarianceForm({
      remarks: document.lineItems?.[lineItemIndex]?.varianceRemarks || '',
      varianceType: document.lineItems?.[lineItemIndex]?.varianceType || '',
    });
    setShowVarianceModal(true);
  };

  // Save variance resolution
  const handleSaveVarianceResolution = async () => {
    if (!varianceForm.remarks || !varianceForm.varianceType) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const lineItem = selectedDocument.document.lineItems[selectedDocument.lineItemIndex];

      // Determine stock adjustment logic based on variance type
      let stockAdjustment = {};
      if (varianceType === 'dispatch_counting_error') {
        // Use receipt qty for stock transactions
        stockAdjustment = {
          sourceQty: lineItem.receiptQty,
          destinationQty: lineItem.receiptQty,
        };
      } else if (varianceType === 'receipt_counting_error') {
        // Use dispatch qty for stock transactions
        stockAdjustment = {
          sourceQty: lineItem.dispatchQty,
          destinationQty: lineItem.dispatchQty,
        };
      } else if (varianceType === 'transit_loss') {
        // Reduce from dispatch qty at source, add receipt qty at destination
        stockAdjustment = {
          sourceQty: lineItem.dispatchQty,
          destinationQty: lineItem.receiptQty,
          lossQty: (lineItem.dispatchQty || 0) - (lineItem.receiptQty || 0),
        };
      }

      const reconciliationData = {
        dcNumber: selectedDocument.document.dcNumber,
        receiptNumber: selectedDocument.document.receiptNumber,
        lineItemIndex: selectedDocument.lineItemIndex,
        remarks: varianceForm.remarks,
        varianceType: varianceForm.varianceType,
        stockAdjustment,
        reconciliationDate: new Date().toISOString().split('T')[0],
        status: 'reconciled',
      };

      await api.updateReconciliation(reconciliationData);
      setShowVarianceModal(false);
      await loadData();
      alert('Variance resolved successfully!');
    } catch (error) {
      console.error('Error resolving variance:', error);
      alert('Error resolving variance');
    }
  };

  // Calculate variance for display
  const calculateVariance = (dispatchQty, receiptQty) => {
    const variance = (receiptQty || 0) - (dispatchQty || 0);
    return {
      value: variance,
      isPositive: variance > 0,
      isZero: variance === 0,
    };
  };

  // Get variance highlight class
  const getVarianceRowClass = (dispatchQty, receiptQty) => {
    const variance = (receiptQty || 0) - (dispatchQty || 0);
    if (variance === 0) return '';
    return 'bg-red-50 border-l-4 border-red-500';
  };

  // Main table columns for documents
  const mainTableColumns = [
    { key: 'dcNumber', label: 'DC Number' },
    { key: 'receiptNumber', label: 'Receipt Number' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      key: 'receivedDate',
      label: 'Received Date',
      render: (v) => formatDate(v),
    },
    {
      key: 'itemCount',
      label: 'Items',
      render: (_, row) => row.lineItems?.length || 0,
    },
    {
      key: 'varianceCount',
      label: 'Variances',
      render: (_, row) => {
        const count = row.lineItems?.filter(
          (item) => item.dispatchQty !== item.receiptQty
        ).length || 0;
        return (
          <span
            className={count > 0 ? 'text-red-600 font-medium' : 'text-green-600'}
          >
            {count}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      disableSort: true,
      render: (_, row) => (
        <button
          onClick={() => toggleRowExpansion(row.dcNumber)}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            expandedRows.includes(row.dcNumber)
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
          }`}
        >
          {expandedRows.includes(row.dcNumber) ? 'Collapse' : 'Expand'}
        </button>
      ),
    },
  ];

  // Prepare data with expanded rows
  const displayData = [];
  reconciliations.forEach((doc) => {
    displayData.push(doc);
    if (expandedRows.includes(doc.dcNumber) && doc.lineItems) {
      doc.lineItems.forEach((item, idx) => {
        const variance = calculateVariance(item.dispatchQty, item.receiptQty);
        displayData.push({
          _isLineItem: true,
          _parentDC: doc.dcNumber,
          _lineItemIndex: idx,
          itemCode: item.itemCode,
          itemName: item.itemName,
          dispatchQty: item.dispatchQty,
          receiptQty: item.receiptQty,
          variance: variance.value,
          varianceType: item.varianceType,
          remarks: item.remarks,
          status: item.status || 'pending',
          isVariance: !variance.isZero,
          _doc: doc,
        });
      });
    }
  });

  // Custom row rendering for line items
  const lineItemColumns = [
    { key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    {
      key: 'dispatchQty',
      label: 'Dispatch Qty',
      render: (v) => formatNumber(v),
    },
    {
      key: 'receiptQty',
      label: 'Receipt Qty',
      render: (v) => formatNumber(v),
    },
    {
      key: 'variance',
      label: 'Variance',
      render: (v) => (
        <span
          className={
            v === 0
              ? 'text-green-600 font-medium'
              : v > 0
                ? 'text-blue-600 font-medium'
                : 'text-red-600 font-medium'
          }
        >
          {v > 0 ? '+' : ''}{formatNumber(v)}
        </span>
      ),
    },
    {
      key: 'varianceType',
      label: 'Variance Type',
      render: (v) => {
        if (!v) return <span className="text-secondary-500">-</span>;
        return (
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
            {v.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      key: 'remarks',
      label: 'Remarks',
      render: (v) => <span className="text-secondary-600 text-sm">{v || '-'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      disableSort: true,
      render: (_, row) => {
        if (row._isLineItem && row.isVariance && !row.varianceType) {
          return (
            <button
              onClick={() =>
                handleResolveVariance(row._doc, row._lineItemIndex)
              }
              className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              <Edit2 size={14} />
              Resolve
            </button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            Dispatch vs Receipt Reconciliation
          </h1>
          <p className="text-secondary-600 mt-1">
            Reconcile dispatched and received quantities across warehouses
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <p className="text-sm text-indigo-600 font-medium">Total Documents</p>
          <p className="text-3xl font-bold text-indigo-900 mt-1">
            {summary.totalDocuments}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-yellow-600 font-medium">Pending Reconciliation</p>
          <p className="text-3xl font-bold text-yellow-900 mt-1">
            {summary.totalPending}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-red-600 font-medium">Documents with Variances</p>
          <p className="text-3xl font-bold text-red-900 mt-1">
            {summary.totalVariances}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">Total Variance Amount</p>
          <p className="text-3xl font-bold text-purple-900 mt-1">
            {formatNumber(summary.totalVarianceAmount)}
          </p>
        </div>
      </div>

      {/* Clear Reconciliation Message */}
      {summary.totalPending > 0 && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">
              {summary.totalPending} document(s) need reconciliation
            </p>
            <p className="text-sm text-red-700 mt-1">
              Please resolve all variances and discrepancies to clear pending items.
              Expand documents below to view and resolve individual line item variances.
            </p>
          </div>
        </div>
      )}

      {/* Stock Adjustment Logic Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-3">Stock Adjustment Logic</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div>
            <p className="font-medium">Dispatch Counting Error:</p>
            <p className="ml-4">
              Use receipt qty for stock transactions. Adjust dispatch records to match
              actual receipt.
            </p>
          </div>
          <div>
            <p className="font-medium">Receipt Counting Error:</p>
            <p className="ml-4">
              Use dispatch qty for stock transactions. Adjust receipt records to match
              dispatch.
            </p>
          </div>
          <div>
            <p className="font-medium">Transit Loss:</p>
            <p className="ml-4">
              Reduce from dispatch qty at source warehouse. Add receipt qty at destination.
              Loss is recorded in transit loss account.
            </p>
          </div>
        </div>
      </div>

      {/* Main Reconciliation Table */}
      <DataTable
        columns={mainTableColumns}
        data={displayData}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['dcNumber', 'receiptNumber', 'itemCode', 'itemName']}
        pagination={true}
        pageSize={10}
        rowClassName={(row) =>
          row._isLineItem && row.isVariance && !row.varianceType
            ? getVarianceRowClass(row.dispatchQty, row.receiptQty)
            : ''
        }
        emptyMessage="No open reconciliations. All documents are reconciled!"
      />

      {/* Variance Resolution Modal */}
      {selectedDocument && (
        <Modal
          isOpen={showVarianceModal}
          onClose={() => setShowVarianceModal(false)}
          title="Resolve Variance"
          size="lg"
          actions={[
            {
              label: 'Cancel',
              variant: 'secondary',
              onClick: () => setShowVarianceModal(false),
            },
            {
              label: 'Save Resolution',
              onClick: handleSaveVarianceResolution,
            },
          ]}
        >
          <div className="space-y-6">
            {/* Document and Item Info */}
            <div className="bg-secondary-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-secondary-600">DC Number</p>
                  <p className="font-medium">{selectedDocument.document.dcNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Receipt Number</p>
                  <p className="font-medium">{selectedDocument.document.receiptNumber}</p>
                </div>
              </div>
            </div>

            {/* Item Details */}
            {selectedDocument.document.lineItems && (
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                {(() => {
                  const item =
                    selectedDocument.document.lineItems[
                      selectedDocument.lineItemIndex
                    ];
                  const variance = calculateVariance(
                    item.dispatchQty,
                    item.receiptQty
                  );
                  return (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-indigo-600 font-medium">
                          Item: {item.itemCode} - {item.itemName}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-indigo-600 font-medium">Dispatch Qty</p>
                          <p className="text-lg font-bold text-indigo-900">
                            {formatNumber(item.dispatchQty)}
                          </p>
                        </div>
                        <div>
                          <p className="text-indigo-600 font-medium">Receipt Qty</p>
                          <p className="text-lg font-bold text-indigo-900">
                            {formatNumber(item.receiptQty)}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`font-medium ${
                              variance.isZero ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            Variance
                          </p>
                          <p
                            className={`text-lg font-bold ${
                              variance.isZero
                                ? 'text-green-900'
                                : variance.isPositive
                                  ? 'text-blue-900'
                                  : 'text-red-900'
                            }`}
                          >
                            {variance.isPositive ? '+' : ''}{formatNumber(variance.value)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Variance Type Selection */}
            <FormField
              label="Variance Type"
              type="select"
              value={varianceForm.varianceType}
              onChange={(e) =>
                setVarianceForm({ ...varianceForm, varianceType: e.target.value })
              }
              options={[
                { value: '', label: 'Select variance type...' },
                {
                  value: 'dispatch_counting_error',
                  label: 'Dispatch Counting Error',
                },
                {
                  value: 'receipt_counting_error',
                  label: 'Receipt Counting Error',
                },
                { value: 'transit_loss', label: 'Transit Loss' },
              ]}
              required
            />

            {/* Stock Adjustment Info */}
            {varianceForm.varianceType && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                <div className="flex gap-2 mb-2">
                  <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <p className="font-medium">Stock Adjustment:</p>
                </div>
                <p className="ml-6">
                  {varianceForm.varianceType === 'dispatch_counting_error'
                    ? 'Receipt quantity will be used for all stock transactions'
                    : varianceForm.varianceType === 'receipt_counting_error'
                      ? 'Dispatch quantity will be used for all stock transactions'
                      : 'Dispatch qty used at source, receipt qty at destination. Loss will be recorded separately.'}
                </p>
              </div>
            )}

            {/* Remarks */}
            <FormField
              label="Remarks / Reason for Variance"
              type="textarea"
              rows={4}
              value={varianceForm.remarks}
              onChange={(e) =>
                setVarianceForm({ ...varianceForm, remarks: e.target.value })
              }
              placeholder="Explain the reason for this variance (e.g., damaged items, counting error, etc.)"
              required
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
