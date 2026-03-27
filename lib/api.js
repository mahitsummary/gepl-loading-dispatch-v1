// API Client for GEPL App - communicates with Google Apps Script backend
// The GAS_URL should be the deployed web app URL from Google Apps Script
const GAS_BASE_URL = process.env.NEXT_PUBLIC_GAS_URL || '';

const handleResponse = (data) => {
  if (data && data.success === false) {
    throw new Error(data.error || 'An error occurred');
  }
  return data?.data ?? data;
};

const makeGetRequest = async (action, params = {}) => {
  try {
    const queryParams = new URLSearchParams({ action, ...params });
    const url = `${GAS_BASE_URL}?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
    });
    const data = await response.json();
    return handleResponse(data);
  } catch (error) {
    console.error(`API GET Error (${action}):`, error);
    throw error;
  }
};

const makePostRequest = async (action, body = {}) => {
  try {
    const url = GAS_BASE_URL;
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...body }),
    });
    const data = await response.json();
    return handleResponse(data);
  } catch (error) {
    console.error(`API POST Error (${action}):`, error);
    throw error;
  }
};

export const api = {
  // ==================== MASTERS ====================

  // Item Master
  fetchItems: () => makeGetRequest('getItems'),
  searchItems: (query) => makeGetRequest('searchItems', { query }),
  addItem: (itemData) => makePostRequest('addItem', itemData),
  getUOMList: () => makeGetRequest('getUOMList'),

  // Vendor & Customer Master
  fetchVendors: () => makeGetRequest('getVendors'),
  searchVendors: (query) => makeGetRequest('searchVendors', { query }),
  addVendor: (vendorData) => makePostRequest('addVendor', vendorData),

  // Warehouse Master
  fetchWarehouses: () => makeGetRequest('getWarehouses'),
  addWarehouse: (warehouseData) => makePostRequest('addWarehouse', warehouseData),

  // Production Plants
  fetchPlants: () => makeGetRequest('getPlants'),
  addPlant: (plantData) => makePostRequest('addPlant', plantData),

  // Supervisor Master
  fetchSupervisors: () => makeGetRequest('getSupervisors'),
  addSupervisor: (data) => makePostRequest('addSupervisor', data),
  updateSupervisor: (data) => makePostRequest('updateSupervisor', data),

  // Driver Master
  fetchDrivers: () => makeGetRequest('getDrivers'),
  addDriver: (data) => makePostRequest('addDriver', data),
  updateDriver: (data) => makePostRequest('updateDriver', data),

  // Vehicle Master
  fetchVehicles: () => makeGetRequest('getVehicles'),
  addVehicle: (data) => makePostRequest('addVehicle', data),
  updateVehicle: (data) => makePostRequest('updateVehicle', data),

  // ==================== GRN (Inward from Purchase) ====================
  createGRN: (grnData) => makePostRequest('createGRN', grnData),
  getGRNs: () => makeGetRequest('getGRNs'),
  getGRNById: (grnNumber) => makeGetRequest('getGRNById', { grnNumber }),
  addGRNLineItem: (lineData) => makePostRequest('addGRNLineItem', lineData),
  generateGRNNumber: () => makeGetRequest('generateGRNNumber'),
  generateGatePass: (data) => makePostRequest('generateGatePass', data),
  generateBatchID: () => makeGetRequest('generateBatchID'),

  // ==================== MATERIAL REQUISITION ====================
  createRequisition: (data) => makePostRequest('createRequisition', data),
  getRequisitions: (filters = {}) => makeGetRequest('getRequisitions', filters),
  getRequisitionById: (reqNumber) => makeGetRequest('getRequisitionById', { reqNumber }),
  addRequisitionLineItem: (data) => makePostRequest('addRequisitionLineItem', data),
  updateRequisitionStatus: (data) => makePostRequest('updateRequisitionStatus', data),

  // ==================== INTERNAL DISPATCH ====================
  createDispatch: (data) => makePostRequest('createDispatch', data),
  getDispatches: (filters = {}) => makeGetRequest('getDispatches', filters),
  getDispatchById: (dcNumber) => makeGetRequest('getDispatchById', { dcNumber }),
  addDispatchLineItem: (data) => makePostRequest('addDispatchLineItem', data),
  generateDCNumber: () => makeGetRequest('generateDCNumber'),

  // ==================== INTERNAL RECEIPT ====================
  createReceipt: (data) => makePostRequest('createReceipt', data),
  getReceipts: (filters = {}) => makeGetRequest('getReceipts', filters),
  getReceiptById: (receiptNumber) => makeGetRequest('getReceiptById', { receiptNumber }),
  addReceiptLineItem: (data) => makePostRequest('addReceiptLineItem', data),
  generateReceiptNumber: () => makeGetRequest('generateReceiptNumber'),

  // ==================== RECONCILIATION ====================
  getOpenReconciliations: () => makeGetRequest('getOpenReconciliations'),
  reconcileDocument: (data) => makePostRequest('reconcileDocument', data),
  updateReconciliation: (data) => makePostRequest('updateReconciliation', data),

  // ==================== STOCK ====================
  getStockByWarehouse: (warehouseCode) => makeGetRequest('getStockByWarehouse', { warehouseCode }),
  getOverallStock: () => makeGetRequest('getOverallStock'),
  getGoodsInTransit: () => makeGetRequest('getGoodsInTransit'),

  // ==================== PRODUCTION ====================
  createProductionIssue: (data) => makePostRequest('createProductionIssue', data),
  getProductionIssues: (filters = {}) => makeGetRequest('getProductionIssues', filters),
  createProductionOutput: (data) => makePostRequest('createProductionOutput', data),
  getProductionReconciliation: (filters = {}) => makeGetRequest('getProductionReconciliation', filters),

  // ==================== FG STOCK ====================
  getFGStock: (filters = {}) => makeGetRequest('getFGStock', filters),
  dispatchFG: (data) => makePostRequest('dispatchFG', data),

  // ==================== REJECTED STOCK ====================
  getRejectedStock: () => makeGetRequest('getRejectedStock'),

  // ==================== SUPERVISOR SCORING ====================
  getSupervisorScores: () => makeGetRequest('getSupervisorScores'),

  // ==================== DASHBOARD ====================
  getDashboardStats: () => makeGetRequest('getDashboardStats'),

  // ==================== GATE PASS ====================
  getOpenGatePasses: () => makeGetRequest('getOpenGatePasses'),
};

export default api;
