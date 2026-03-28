// API Client for GEPL App - communicates with Google Apps Script backend
// The GAS_URL should be the deployed web app URL from Google Apps Script
const GAS_BASE_URL = process.env.NEXT_PUBLIC_GAS_URL || '';

// Simple in-memory cache to reduce API calls
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCached = (key) => {
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
};

const setCache = (key, data) => {
  cache[key] = { data, timestamp: Date.now() };
};

const clearCache = (keyPrefix) => {
  Object.keys(cache).forEach(key => {
    if (!keyPrefix || key.startsWith(keyPrefix)) {
      delete cache[key];
    }
  });
};

const handleResponse = (data) => {
  if (data && data.success === false) {
    throw new Error(data.error || 'An error occurred');
  }
  return data?.data ?? data;
};

const ensureConfigured = () => {
  if (!GAS_BASE_URL) {
    throw new Error(
      'NEXT_PUBLIC_GAS_URL is not configured. Set it in .env.local with your Google Apps Script deployment URL.'
    );
  }
};

const makeGetRequest = async (action, params = {}) => {
  try {
    ensureConfigured();
    const queryParams = new URLSearchParams({ action, ...params });
    const cacheKey = queryParams.toString();

    // Check cache for read-only master data
    const masterActions = ['getItems', 'getVendors', 'getWarehouses', 'getPlants', 'getSupervisors', 'getDrivers', 'getVehicles', 'getUOMList'];
    if (masterActions.includes(action)) {
      const cached = getCached(cacheKey);
      if (cached) return cached;
    }

    const url = `${GAS_BASE_URL}?${cacheKey}`;
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
    });
    const data = await response.json();
    const result = handleResponse(data);

    // Cache master data results
    if (masterActions.includes(action)) {
      setCache(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error(`API GET Error (${action}):`, error);
    throw error;
  }
};

const makePostRequest = async (action, body = {}) => {
  try {
    ensureConfigured();
    const url = GAS_BASE_URL;
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...body }),
    });
    const data = await response.json();
    // Clear master data cache after writes
    clearCache();
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
  updateItem: (id, itemData) => makePostRequest('updateItem', { id, ...itemData }),
  deleteItem: (id) => makePostRequest('deleteItem', { id }),
  getUOMList: () => makeGetRequest('getUOMList'),

  // Vendor & Customer Master
  fetchVendors: () => makeGetRequest('getVendors'),
  searchVendors: (query) => makeGetRequest('searchVendors', { query }),
  addVendor: (vendorData) => makePostRequest('addVendor', vendorData),
  updateVendor: (id, vendorData) => makePostRequest('updateVendor', { id, ...vendorData }),
  deleteVendor: (id) => makePostRequest('deleteVendor', { id }),

  // Warehouse Master
  fetchWarehouses: () => makeGetRequest('getWarehouses'),
  addWarehouse: (warehouseData) => makePostRequest('addWarehouse', warehouseData),
  updateWarehouse: (id, warehouseData) => makePostRequest('updateWarehouse', { id, ...warehouseData }),
  deleteWarehouse: (id) => makePostRequest('deleteWarehouse', { id }),

  // Production Plants
  fetchPlants: () => makeGetRequest('getPlants'),
  addPlant: (plantData) => makePostRequest('addPlant', plantData),
  updatePlant: (id, plantData) => makePostRequest('updatePlant', { id, ...plantData }),
  deletePlant: (id) => makePostRequest('deletePlant', { id }),

  // Supervisor Master
  fetchSupervisors: () => makeGetRequest('getSupervisors'),
  addSupervisor: (data) => makePostRequest('addSupervisor', data),
  updateSupervisor: (id, data) => makePostRequest('updateSupervisor', { id, ...data }),
  deleteSupervisor: (id) => makePostRequest('deleteSupervisor', { id }),

  // Driver Master
  fetchDrivers: () => makeGetRequest('getDrivers'),
  addDriver: (data) => makePostRequest('addDriver', data),
  updateDriver: (id, data) => makePostRequest('updateDriver', { id, ...data }),
  deleteDriver: (id) => makePostRequest('deleteDriver', { id }),

  // Vehicle Master
  fetchVehicles: () => makeGetRequest('getVehicles'),
  addVehicle: (data) => makePostRequest('addVehicle', data),
  updateVehicle: (id, data) => makePostRequest('updateVehicle', { id, ...data }),
  deleteVehicle: (id) => makePostRequest('deleteVehicle', { id }),

  // Batch Master
  fetchBatches: () => makeGetRequest('getBatches'),

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
  fetchStock: () => makeGetRequest('getOverallStock'),
  getStockByWarehouse: (warehouseCode) => makeGetRequest('getStockByWarehouse', { warehouseCode }),
  getOverallStock: () => makeGetRequest('getOverallStock'),
  getGoodsInTransit: () => makeGetRequest('getGoodsInTransit'),
  fetchGoodsInTransit: () => makeGetRequest('getGoodsInTransit'),

  // ==================== PRODUCTION ====================
  createProductionIssue: (data) => makePostRequest('createProductionIssue', data),
  getProductionIssues: (filters = {}) => makeGetRequest('getProductionIssues', filters),
  fetchProductionIssues: (filters = {}) => makeGetRequest('getProductionIssues', filters),
  issueToProduction: (data) => makePostRequest('createProductionIssue', data),
  createProductionOutput: (data) => makePostRequest('createProductionOutput', data),
  fetchProductionOutput: (filters = {}) => makeGetRequest('getProductionOutput', filters),
  recordProductionOutput: (data) => makePostRequest('createProductionOutput', data),
  getProductionReconciliation: (filters = {}) => makeGetRequest('getProductionReconciliation', filters),
  fetchProductionReco: (filters = {}) => makeGetRequest('getProductionReconciliation', filters),

  // ==================== RM RETURN TO STORES ====================
  returnToStores: (data) => makePostRequest('returnToStores', data),
  fetchReturns: () => makeGetRequest('getReturns'),

  // ==================== FG STOCK ====================
  getFGStock: (filters = {}) => makeGetRequest('getFGStock', filters),
  fetchFGStock: (filters = {}) => makeGetRequest('getFGStock', filters),
  dispatchFG: (data) => makePostRequest('dispatchFG', data),

  // ==================== REJECTED STOCK ====================
  getRejectedStock: () => makeGetRequest('getRejectedStock'),
  fetchRejectedStock: () => makeGetRequest('getRejectedStock'),

  // ==================== SUPERVISOR SCORING ====================
  getSupervisorScores: () => makeGetRequest('getSupervisorScores'),
  fetchSupervisorScores: () => makeGetRequest('getSupervisorScores'),

  // ==================== DASHBOARD ====================
  getDashboardStats: () => makeGetRequest('getDashboardStats'),
  fetchDashboardMetrics: () => makeGetRequest('getDashboardStats'),
  fetchRecentActivity: (limit = 10) => makeGetRequest('getRecentActivity', { limit }),

  // ==================== GATE PASS ====================
  getOpenGatePasses: () => makeGetRequest('getOpenGatePasses'),
  closeGatePass: (data) => makePostRequest('closeGatePass', data),
};

export default api;
