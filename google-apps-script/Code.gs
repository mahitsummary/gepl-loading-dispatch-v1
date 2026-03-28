// GEPL - Loading and Dispatched V1
// Google Apps Script Backend
// Spreadsheet ID: 1S_tycoVntFJwTK-Nefqdwt6VRzg-4ZiQY5ukXypW0_s

const SPREADSHEET_ID = '1S_tycoVntFJwTK-Nefqdwt6VRzg-4ZiQY5ukXypW0_s';
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

// ==================== INITIALIZATION ====================

/**
 * Ensures all required sheets exist in the spreadsheet
 */
function ensureSheetsExist() {
  const requiredSheets = [
    { name: 'Item Master', columns: ['ItemCode', 'Foreign Name', 'Item Description', 'Sub Category', 'ItemsGroupCode', 'Shipping', 'Manufacturer', 'Regions Of Origin', 'Status', 'Manage Item', 'Item Category', 'Material Type'] },
    { name: 'Vendor & Customer Master', columns: ['BP Name', 'BP Code', 'BP Type', 'Branch ID', 'BP group', 'Currency', 'Status', 'GSTIN', 'Street', 'Block', 'Building/Floor/Room', 'Zip Code', 'City', 'State', 'Country', 'Phone', 'Email', 'Contact Person'] },
    { name: 'Warehouse Master', columns: ['Warehouse Code', 'Warehouse Name', 'Address', 'City', 'State', 'Pincode', 'GSTIN', 'Contact Phone', 'Contact Email', 'Manager Name', 'Capacity', 'Status', 'Data Source', 'User Signature'] },
    { name: 'Production plant master', columns: ['Loc No', 'Location', 'Street', 'Block'] },
    { name: 'Supervisor Master', columns: ['SupervisorID', 'Name', 'Phone', 'Email', 'Residential Address', 'Role', 'Assigned Warehouse', 'Status', 'DateAdded'] },
    { name: 'Driver Master', columns: ['DriverID', 'Name', 'Phone', 'LicenseNumber', 'Address', 'Email', 'Status', 'DateAdded'] },
    { name: 'Vehicle Master', columns: ['VehicleNumber', 'VehicleType', 'VehicleSize', 'OwnerName', 'Status', 'DateAdded'] },
    { name: 'Batch Master', columns: ['BatchID', 'ItemCode', 'ItemName', 'DateOfEntry', 'DateOfReceipt', 'DateOfProduction', 'PlaceOfOrigin', 'WarehouseCode', 'Qty', 'QtyPerPack', 'NumberOfPacks', 'UOM', 'GRNNumber', 'Status'] },
    { name: 'GRN Transactions', columns: ['GRNNumber', 'GatePassNumber', 'VendorCode', 'VendorName', 'PONumber', 'PODate', 'CommittedDeliveryDate', 'VendorDocNumber', 'VendorDocDate', 'ReceiptDate', 'EntryDate', 'ReceiverName', 'VehicleNumber', 'Status', 'TotalItems', 'Remarks'] },
    { name: 'GRN Line Items', columns: ['GRNNumber', 'LineNumber', 'ItemCode', 'ItemName', 'QtyPerPack', 'UOM', 'NumberOfPacks', 'TotalQty', 'BatchID', 'GRNStickerGenerated', 'Remarks'] },
    { name: 'Material Requisitions', columns: ['RequisitionNumber', 'RequestedBy', 'RequestedDate', 'ProductionDate', 'ProductionPlant', 'DestinationWarehouse', 'Status', 'DateCreated'] },
    { name: 'Requisition Line Items', columns: ['RequisitionNumber', 'LineNumber', 'ItemCode', 'ItemName', 'UOM', 'QtyRequired', 'QtyDispatched', 'QtyPending', 'Remarks'] },
    { name: 'Internal Dispatches', columns: ['DCNumber', 'RequisitionNumber', 'SupervisorName', 'DriverName', 'VehicleNumber', 'Date', 'LocationFrom', 'LocationFromAddress', 'LocationFromGST', 'LocationFromPhone', 'LocationTo', 'LocationToAddress', 'LocationToGST', 'LocationToPhone', 'Status', 'TotalItems'] },
    { name: 'Dispatch Line Items', columns: ['DCNumber', 'LineNumber', 'ItemCode', 'ItemName', 'QtyPerPack', 'UOM', 'NumberOfPacks', 'TotalQty', 'BatchID', 'GRNStickerStuck', 'Remarks'] },
    { name: 'Internal Receipts', columns: ['ReceiptNumber', 'DCNumber', 'RequisitionNumber', 'DeliveryChallanDate', 'ReceiptDate', 'EntryDate', 'ReceiverName', 'VehicleNumber', 'GatePassNumber', 'Status', 'TotalItems'] },
    { name: 'Receipt Line Items', columns: ['ReceiptNumber', 'LineNumber', 'ItemCode', 'ItemName', 'QtyPerPack', 'UOM', 'NumberOfPacks', 'TotalQty', 'GRNStickerPut', 'Remarks'] },
    { name: 'Reconciliation', columns: ['RecoID', 'DCNumber', 'ReceiptNumber', 'ItemCode', 'ItemName', 'DispatchQty', 'ReceiptQty', 'Variance', 'VarianceType', 'Remarks', 'Status', 'ResolvedDate'] },
    { name: 'Stock Master', columns: ['WarehouseCode', 'WarehouseName', 'ItemCode', 'ItemName', 'UOM', 'QtyInPacks', 'TotalQty', 'LastUpdated'] },
    { name: 'Goods In Transit', columns: ['DCNumber', 'ItemCode', 'ItemName', 'UOM', 'QtyInPacks', 'TotalQty', 'DispatchDate', 'LocationFrom', 'LocationTo', 'Status'] },
    { name: 'Production Issues', columns: ['IssueNumber', 'ProductionPlant', 'IssueDate', 'IssuedBy', 'ItemCode', 'ItemName', 'UOM', 'QtyIssued', 'BatchID', 'Remarks'] },
    { name: 'Production Output', columns: ['OutputNumber', 'ProductionPlant', 'ProductionDate', 'FGItemCode', 'FGItemName', 'QtyProduced', 'UOM', 'RMItemCode', 'RMQtyUsedPerUnit', 'Status'] },
    { name: 'FG Stock Master', columns: ['WarehouseCode', 'ItemCode', 'ItemName', 'UOM', 'Qty', 'LastUpdated'] },
    { name: 'Rejected Stock', columns: ['VirtualWarehouse', 'ProductionPlant', 'ItemCode', 'ItemName', 'UOM', 'Qty', 'RejectionDate', 'Remarks'] },
    { name: 'Supervisor Scores', columns: ['SupervisorID', 'SupervisorName', 'TotalDispatches', 'TotalReceipts', 'AccuracyScore', 'VarianceCount', 'LastUpdated', 'Rank'] },
    { name: 'Gate Pass Register', columns: ['GatePassNumber', 'Type', 'VehicleNumber', 'Date', 'DCNumber', 'GRNNumber', 'Status'] },
    { name: 'RM Returns', columns: ['ReturnNumber', 'ProductionPlant', 'ReturnDate', 'ReturnedBy', 'DestinationWarehouse', 'ItemCode', 'ItemName', 'UOM', 'Qty', 'BatchID', 'Remarks', 'Status', 'DateCreated'] },
    { name: 'Audit Log', columns: ['Timestamp', 'UserEmail', 'Action', 'Module', 'DocumentNumber', 'Details'] }
  ];

  for (const sheetDef of requiredSheets) {
    try {
      const sheet = ss.getSheetByName(sheetDef.name);
      if (!sheet) {
        const newSheet = ss.insertSheet(sheetDef.name);
        newSheet.appendRow(sheetDef.columns);
      }
    } catch (e) {
      Logger.log(`Error creating sheet ${sheetDef.name}: ${e}`);
    }
  }
}

// ==================== WEB ENDPOINTS ====================

/**
 * Handles GET requests
 */
function doGet(e) {
  try {
    ensureSheetsExist();

    const action = e.parameter.action;
    const result = routeRequest(action, e.parameter);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles POST requests
 */
function doPost(e) {
  try {
    ensureSheetsExist();

    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const result = routeRequest(action, params);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Routes requests to appropriate handler functions
 */
function routeRequest(action, params) {
  const userEmail = Session.getActiveUser().getEmail();

  switch (action) {
    // Vendor operations
    case 'getVendors':
      return { success: true, data: getVendors() };
    case 'addVendor':
      logAudit(userEmail, 'CREATE', 'Vendor Master', '', JSON.stringify(params));
      return { success: true, data: addVendor(params) };
    case 'updateVendor':
      logAudit(userEmail, 'UPDATE', 'Vendor Master', params.id || params.BPCode, JSON.stringify(params));
      return { success: true, data: updateVendor(params) };
    case 'deleteVendor':
      logAudit(userEmail, 'DELETE', 'Vendor Master', params.id || params.BPCode, '');
      return { success: true, data: deleteVendor(params.id || params.BPCode) };
    case 'searchVendors':
      return { success: true, data: searchVendors(params.query) };

    // Item operations
    case 'getItems':
      return { success: true, data: getItems() };
    case 'searchItems':
      return { success: true, data: searchItems(params.query) };
    case 'addItem':
      logAudit(userEmail, 'CREATE', 'Item Master', '', JSON.stringify(params));
      return { success: true, data: addItem(params) };
    case 'updateItem':
      logAudit(userEmail, 'UPDATE', 'Item Master', params.id || params.ItemCode, JSON.stringify(params));
      return { success: true, data: updateItem(params) };
    case 'deleteItem':
      logAudit(userEmail, 'DELETE', 'Item Master', params.id || params.ItemCode, '');
      return { success: true, data: deleteItem(params.id || params.ItemCode) };
    case 'getUOMList':
      return { success: true, data: getUOMList() };

    // Warehouse operations
    case 'getWarehouses':
      return { success: true, data: getWarehouses() };
    case 'addWarehouse':
      logAudit(userEmail, 'CREATE', 'Warehouse Master', '', JSON.stringify(params));
      return { success: true, data: addWarehouse(params) };
    case 'updateWarehouse':
      logAudit(userEmail, 'UPDATE', 'Warehouse Master', params.id || params.warehouseCode, JSON.stringify(params));
      return { success: true, data: updateWarehouse(params) };
    case 'deleteWarehouse':
      logAudit(userEmail, 'DELETE', 'Warehouse Master', params.id || params.warehouseCode, '');
      return { success: true, data: deleteWarehouse(params.id || params.warehouseCode) };

    // Plant operations
    case 'getPlants':
      return { success: true, data: getPlants() };
    case 'addPlant':
      logAudit(userEmail, 'CREATE', 'Production plant master', '', JSON.stringify(params));
      return { success: true, data: addPlant(params) };
    case 'updatePlant':
      logAudit(userEmail, 'UPDATE', 'Production plant master', params.id || params.plantCode, JSON.stringify(params));
      return { success: true, data: updatePlant(params) };
    case 'deletePlant':
      logAudit(userEmail, 'DELETE', 'Production plant master', params.id || params.plantCode, '');
      return { success: true, data: deletePlant(params.id || params.plantCode) };

    // Supervisor operations
    case 'getSupervisors':
      return { success: true, data: getSupervisors() };
    case 'addSupervisor':
      logAudit(userEmail, 'CREATE', 'Supervisor Master', '', JSON.stringify(params));
      return { success: true, data: addSupervisor(params) };
    case 'updateSupervisor':
      logAudit(userEmail, 'UPDATE', 'Supervisor Master', params.SupervisorID || params.id, JSON.stringify(params));
      return { success: true, data: updateSupervisor(params) };
    case 'deleteSupervisor':
      logAudit(userEmail, 'DELETE', 'Supervisor Master', params.id || params.SupervisorID, '');
      return { success: true, data: deleteSupervisor(params.id || params.SupervisorID) };

    // Driver operations
    case 'getDrivers':
      return { success: true, data: getDrivers() };
    case 'addDriver':
      logAudit(userEmail, 'CREATE', 'Driver Master', '', JSON.stringify(params));
      return { success: true, data: addDriver(params) };
    case 'updateDriver':
      logAudit(userEmail, 'UPDATE', 'Driver Master', params.id || params.DriverID, JSON.stringify(params));
      return { success: true, data: updateDriver(params) };
    case 'deleteDriver':
      logAudit(userEmail, 'DELETE', 'Driver Master', params.id || params.DriverID, '');
      return { success: true, data: deleteDriver(params.id || params.DriverID) };

    // Vehicle operations
    case 'getVehicles':
      return { success: true, data: getVehicles() };
    case 'addVehicle':
      logAudit(userEmail, 'CREATE', 'Vehicle Master', '', JSON.stringify(params));
      return { success: true, data: addVehicle(params) };
    case 'updateVehicle':
      logAudit(userEmail, 'UPDATE', 'Vehicle Master', params.id || params.VehicleNumber, JSON.stringify(params));
      return { success: true, data: updateVehicle(params) };
    case 'deleteVehicle':
      logAudit(userEmail, 'DELETE', 'Vehicle Master', params.id || params.VehicleNumber, '');
      return { success: true, data: deleteVehicle(params.id || params.VehicleNumber) };

    // GRN operations
    case 'createGRN':
      logAudit(userEmail, 'CREATE', 'GRN Transactions', '', JSON.stringify(params));
      return { success: true, data: createGRN(params) };
    case 'getGRNs':
      return { success: true, data: getGRNs() };
    case 'getGRNById':
      return { success: true, data: getGRNById(params.GRNNumber || params.grnNumber) };
    case 'addGRNLineItem':
      logAudit(userEmail, 'CREATE', 'GRN Line Items', params.GRNNumber, JSON.stringify(params));
      return { success: true, data: addGRNLineItem(params) };
    case 'generateGatePass':
      logAudit(userEmail, 'CREATE', 'Gate Pass Register', '', JSON.stringify(params));
      return { success: true, data: generateGatePass(params) };

    // Requisition operations
    case 'createRequisition':
      logAudit(userEmail, 'CREATE', 'Material Requisitions', '', JSON.stringify(params));
      return { success: true, data: createRequisition(params) };
    case 'getRequisitions':
      return { success: true, data: getRequisitions() };
    case 'getRequisitionById':
      return { success: true, data: getRequisitionById(params.RequisitionNumber || params.reqNumber) };
    case 'addRequisitionLineItem':
      logAudit(userEmail, 'CREATE', 'Requisition Line Items', params.RequisitionNumber, JSON.stringify(params));
      return { success: true, data: addRequisitionLineItem(params) };
    case 'updateRequisitionStatus':
      logAudit(userEmail, 'UPDATE', 'Material Requisitions', params.RequisitionNumber, `Status: ${params.Status}`);
      return { success: true, data: updateRequisitionStatus(params.RequisitionNumber, params.Status) };

    // Dispatch operations
    case 'createDispatch':
      logAudit(userEmail, 'CREATE', 'Internal Dispatches', '', JSON.stringify(params));
      return { success: true, data: createDispatch(params) };
    case 'getDispatches':
      return { success: true, data: getDispatches() };
    case 'getDispatchById':
      return { success: true, data: getDispatchById(params.DCNumber || params.dcNumber) };
    case 'addDispatchLineItem':
      logAudit(userEmail, 'CREATE', 'Dispatch Line Items', params.DCNumber, JSON.stringify(params));
      return { success: true, data: addDispatchLineItem(params) };
    case 'updateDispatchStatus':
      logAudit(userEmail, 'UPDATE', 'Internal Dispatches', params.DCNumber, `Status: ${params.Status}`);
      return { success: true, data: updateDispatchStatus(params.DCNumber, params.Status) };

    // Receipt operations
    case 'createReceipt':
      logAudit(userEmail, 'CREATE', 'Internal Receipts', '', JSON.stringify(params));
      return { success: true, data: createReceipt(params) };
    case 'getReceipts':
      return { success: true, data: getReceipts() };
    case 'getReceiptById':
      return { success: true, data: getReceiptById(params.ReceiptNumber || params.receiptNumber) };
    case 'addReceiptLineItem':
      logAudit(userEmail, 'CREATE', 'Receipt Line Items', params.ReceiptNumber, JSON.stringify(params));
      return { success: true, data: addReceiptLineItem(params) };
    case 'updateReceiptStatus':
      logAudit(userEmail, 'UPDATE', 'Internal Receipts', params.ReceiptNumber, `Status: ${params.Status}`);
      return { success: true, data: updateReceiptStatus(params.ReceiptNumber, params.Status) };

    // Reconciliation operations
    case 'getOpenReconciliations':
      return { success: true, data: getOpenReconciliations() };
    case 'reconcileDocument':
      logAudit(userEmail, 'UPDATE', 'Reconciliation', params.RecoID, JSON.stringify(params));
      return { success: true, data: reconcileDocument(params) };
    case 'getReconciliationsByDC':
      return { success: true, data: getReconciliationsByDC(params.DCNumber) };

    // Stock operations
    case 'getStockByWarehouse':
      return { success: true, data: getStockByWarehouse(params.WarehouseCode || params.warehouseCode) };
    case 'getOverallStock':
      return { success: true, data: getOverallStock() };
    case 'getGoodsInTransit':
      return { success: true, data: getGoodsInTransit() };

    // Production operations
    case 'createProductionIssue':
      logAudit(userEmail, 'CREATE', 'Production Issues', '', JSON.stringify(params));
      return { success: true, data: createProductionIssue(params) };
    case 'getProductionIssues':
      return { success: true, data: getProductionIssues() };
    case 'createProductionOutput':
      logAudit(userEmail, 'CREATE', 'Production Output', '', JSON.stringify(params));
      return { success: true, data: createProductionOutput(params) };
    case 'getProductionOutput':
      return { success: true, data: getProductionOutput() };

    // FG Stock operations
    case 'getFGStock':
      return { success: true, data: getFGStock() };
    case 'dispatchFG':
      logAudit(userEmail, 'UPDATE', 'FG Stock Master', params.ItemCode, JSON.stringify(params));
      return { success: true, data: dispatchFG(params) };

    // Supervisor scoring
    case 'getSupervisorScores':
      return { success: true, data: getSupervisorScores() };
    case 'updateSupervisorScore':
      logAudit(userEmail, 'UPDATE', 'Supervisor Scores', params.SupervisorID, JSON.stringify(params));
      return { success: true, data: updateSupervisorScore(params.SupervisorID) };

    // Batch operations
    case 'getBatchMaster':
      return { success: true, data: getBatchMaster() };
    case 'getBatches':
      return { success: true, data: getBatches() };

    // ID generation
    case 'generateGRNNumber':
      return { success: true, data: generateSequentialID('GRN', 'GRN Transactions', 'GRNNumber') };
    case 'generateBatchID':
      return { success: true, data: generateSequentialID('BAT', 'Batch Master', 'BatchID') };
    case 'generateDCNumber':
      return { success: true, data: generateSequentialID('DC', 'Internal Dispatches', 'DCNumber') };
    case 'generateReceiptNumber':
      return { success: true, data: generateSequentialID('RN', 'Internal Receipts', 'ReceiptNumber') };

    // Dashboard and analytics
    case 'getDashboardStats':
      return { success: true, data: getDashboardStats() };
    case 'getRecentActivity':
      return { success: true, data: getRecentActivity(params.limit || 10) };

    // Rejected stock
    case 'getRejectedStock':
      return { success: true, data: getRejectedStock() };

    // Production reconciliation
    case 'getProductionReconciliation':
      return { success: true, data: getProductionReconciliation() };

    // Reconciliation update
    case 'updateReconciliation':
      logAudit(userEmail, 'UPDATE', 'Reconciliation', params.RecoID, JSON.stringify(params));
      return { success: true, data: updateReconciliation(params) };

    // RM Returns
    case 'returnToStores':
      return { success: true, data: returnToStores(params) };
    case 'getReturns':
      return { success: true, data: getReturns() };

    // Gate pass
    case 'getOpenGatePasses':
      return { success: true, data: getOpenGatePasses() };

    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get raw data from a specific sheet (original column headers as keys)
 */
function getRawSheetData(sheetName) {
  try {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data[0];
    const rows = [];

    for (let i = 1; i < data.length; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
      }
      rows.push(row);
    }

    return rows;
  } catch (e) {
    Logger.log(`Error reading sheet ${sheetName}: ${e}`);
    return [];
  }
}

/**
 * Get sheet data - alias for getRawSheetData (used by internal functions)
 */
function getSheetData(sheetName) {
  return getRawSheetData(sheetName);
}

/**
 * Transform item row for frontend
 */
function transformItem(row) {
  return {
    id: row.ItemCode || '',
    itemCode: row.ItemCode || '',
    itemName: row['Item Description'] || '',
    foreignName: row['Foreign Name'] || '',
    category: row['Sub Category'] || row['Item Category'] || '',
    uom: row['Manage Item'] || 'PCS',
    hsn: row['Material Type'] || '',
    gstRate: row['ItemsGroupCode'] || '',
    status: row.Status || 'Active',
    manufacturer: row.Manufacturer || '',
    shipping: row.Shipping || ''
  };
}

/**
 * Transform vendor row for frontend
 */
function transformVendor(row) {
  return {
    id: row['BP Code'] || '',
    vendorCode: row['BP Code'] || '',
    vendorName: row['BP Name'] || '',
    contactPerson: row['Contact Person'] || '',
    email: row.Email || '',
    phone: row.Phone || '',
    address: row.Street || '',
    gstin: row.GSTIN || '',
    bpType: row['BP Type'] || '',
    city: row.City || '',
    state: row.State || '',
    country: row.Country || '',
    status: row.Status || 'Active',
    // Keep original keys for GRN page compatibility
    'BP Code': row['BP Code'] || '',
    'BP Name': row['BP Name'] || '',
    'Contact Person': row['Contact Person'] || '',
    'Phone': row.Phone || '',
    'Email': row.Email || '',
    BPCode: row['BP Code'] || '',
    BPName: row['BP Name'] || ''
  };
}

/**
 * Transform warehouse row for frontend
 */
function transformWarehouse(row) {
  return {
    id: row['Warehouse Code'] || '',
    warehouseCode: row['Warehouse Code'] || '',
    warehouseName: row['Warehouse Name'] || '',
    location: row['Internal Key'] || '',
    city: row['Group Code'] || '',
    state: row['Inventory Account'] || '',
    pincode: row['Cost of Goods Sold Account'] || '',
    managerName: row['Allocation Account'] || '',
    phone: row['Data Source'] || '',
    capacity: row['User Signature'] || '',
    status: row.Locked || 'No',
    'Warehouse Code': row['Warehouse Code'] || '',
    'Warehouse Name': row['Warehouse Name'] || ''
  };
}

/**
 * Transform plant row for frontend
 */
function transformPlant(row) {
  return {
    id: row['Loc No'] || '',
    plantCode: row['Loc No'] || '',
    plantName: row.Location || '',
    location: row.Street || '',
    city: row.Block || '',
    state: '',
    pincode: '',
    managerName: '',
    phone: '',
    productionCapacity: ''
  };
}

/**
 * Transform supervisor row for frontend
 */
function transformSupervisor(row) {
  return {
    id: row.SupervisorID || '',
    supervisorName: row.Name || '',
    employeeId: row.SupervisorID || '',
    email: row.Email || '',
    phone: row.Phone || '',
    department: row.Role || '',
    assignedWarehouse: row.Address || '',
    status: row.Status || 'Active',
    // Keep original keys for GRN page compatibility
    Name: row.Name || '',
    Role: row.Role || '',
    name: row.Name || '',
    role: row.Role || ''
  };
}

/**
 * Transform driver row for frontend
 */
function transformDriver(row) {
  return {
    id: row.DriverID || '',
    driverName: row.Name || '',
    licenseNumber: row.LicenseNumber || '',
    licenseExpiry: '',
    phone: row.Phone || '',
    address: row.Address || '',
    aadhar: '',
    email: row.Email || '',
    status: row.Status || 'Active'
  };
}

/**
 * Transform vehicle row for frontend
 */
function transformVehicle(row) {
  return {
    id: row.VehicleNumber || '',
    vehicleNumber: row.VehicleNumber || '',
    vehicleType: row.VehicleType || '',
    manufacturer: row.VehicleSize || '',
    registrationDate: row.DateAdded || '',
    fitnessExpiryDate: '',
    insuranceExpiryDate: '',
    capacity: '',
    ownerName: row.OwnerName || '',
    status: row.Status || 'Active'
  };
}

/**
 * Transform stock row for frontend
 */
function transformStock(row) {
  return {
    id: (row.WarehouseCode || '') + '-' + (row.ItemCode || ''),
    itemCode: row.ItemCode || '',
    itemName: row.ItemName || '',
    warehouse: row.WarehouseName || row.WarehouseCode || '',
    warehouseCode: row.WarehouseCode || '',
    quantity: row.TotalQty || 0,
    reorderLevel: 10,
    unitPrice: 0,
    uom: row.UOM || 'PCS',
    qtyInPacks: row.QtyInPacks || 0,
    lastUpdated: row.LastUpdated || ''
  };
}

/**
 * Transform goods in transit row for frontend
 */
function transformGoodsInTransit(row) {
  return {
    id: (row.DCNumber || '') + '-' + (row.ItemCode || ''),
    dispatchNumber: row.DCNumber || '',
    dcNumber: row.DCNumber || '',
    itemCode: row.ItemCode || '',
    itemName: row.ItemName || '',
    quantity: row.TotalQty || 0,
    sourceWarehouse: row.LocationFrom || '',
    destinationPlant: row.LocationTo || '',
    driverName: '',
    vehicleNumber: '',
    dispatchDate: row.DispatchDate || '',
    expectedDeliveryDate: '',
    isDelayed: false,
    status: row.Status || 'InTransit'
  };
}

/**
 * Transform FG stock row for frontend
 */
function transformFGStock(row) {
  return {
    id: (row.WarehouseCode || '') + '-' + (row.ItemCode || ''),
    itemCode: row.ItemCode || '',
    itemName: row.ItemName || '',
    quantity: row.Qty || 0,
    warehouse: row.WarehouseCode || '',
    unitPrice: 0,
    uom: row.UOM || 'PCS',
    value: 0
  };
}

/**
 * Transform rejected stock row for frontend
 */
function transformRejectedStock(row) {
  return {
    id: (row.ItemCode || '') + '-' + (row.RejectionDate || ''),
    itemCode: row.ItemCode || '',
    itemName: row.ItemName || '',
    quantity: row.Qty || 0,
    rejectionReason: row.Remarks || '',
    rejectionDate: row.RejectionDate || '',
    status: 'Rejected',
    virtualWarehouse: row.VirtualWarehouse || '',
    productionPlant: row.ProductionPlant || ''
  };
}

/**
 * Transform dispatch row for frontend
 */
function transformDispatch(row) {
  return {
    id: row.DCNumber || '',
    dcNumber: row.DCNumber || '',
    requisitionNumber: row.RequisitionNumber || '',
    supervisorName: row.SupervisorName || '',
    driverName: row.DriverName || '',
    vehicleNumber: row.VehicleNumber || '',
    dispatchDate: row.Date || '',
    locationFrom: row.LocationFrom || '',
    locationFromAddress: row.LocationFromAddress || '',
    locationFromGST: row.LocationFromGST || '',
    locationFromPhone: row.LocationFromPhone || '',
    locationTo: row.LocationTo || '',
    locationToAddress: row.LocationToAddress || '',
    locationToGST: row.LocationToGST || '',
    locationToPhone: row.LocationToPhone || '',
    status: row.Status || 'Open',
    totalItems: row.TotalItems || 0
  };
}

/**
 * Transform receipt row for frontend
 */
function transformReceipt(row) {
  return {
    id: row.ReceiptNumber || '',
    receiptNumber: row.ReceiptNumber || '',
    dcNumber: row.DCNumber || '',
    requisitionNumber: row.RequisitionNumber || '',
    deliveryChallanDate: row.DeliveryChallanDate || '',
    receiptDate: row.ReceiptDate || '',
    entryDate: row.EntryDate || '',
    receiverName: row.ReceiverName || '',
    vehicleNumber: row.VehicleNumber || '',
    gatePassNumber: row.GatePassNumber || '',
    vendorPocName: row.ReceiverName || '',
    status: row.Status || 'Open',
    totalItems: row.TotalItems || 0
  };
}

/**
 * Transform requisition row for frontend
 */
function transformRequisition(row) {
  return {
    id: row.RequisitionNumber || '',
    requisitionNumber: row.RequisitionNumber || '',
    requestedBy: row.RequestedBy || '',
    requestedDate: row.RequestedDate || '',
    productionDate: row.ProductionDate || '',
    productionPlant: row.ProductionPlant || '',
    destinationWarehouse: row.DestinationWarehouse || '',
    status: row.Status || 'Open',
    dateCreated: row.DateCreated || ''
  };
}

/**
 * Transform reconciliation row for frontend
 */
function transformReconciliation(row) {
  return {
    id: row.RecoID || '',
    recoId: row.RecoID || '',
    dcNumber: row.DCNumber || '',
    receiptNumber: row.ReceiptNumber || '',
    itemCode: row.ItemCode || '',
    itemName: row.ItemName || '',
    dispatchQty: row.DispatchQty || 0,
    receiptQty: row.ReceiptQty || 0,
    variance: row.Variance || 0,
    varianceType: row.VarianceType || '',
    remarks: row.Remarks || '',
    status: row.Status || 'Open',
    resolvedDate: row.ResolvedDate || ''
  };
}

/**
 * Transform production issue row for frontend
 */
function transformProductionIssue(row) {
  return {
    id: row.IssueNumber || '',
    issueNumber: row.IssueNumber || '',
    plantName: row.ProductionPlant || '',
    productionPlant: row.ProductionPlant || '',
    itemCode: row.ItemCode || '',
    itemName: row.ItemName || '',
    quantity: row.QtyIssued || 0,
    issueDate: row.IssueDate || '',
    issuedBy: row.IssuedBy || '',
    uom: row.UOM || 'PCS',
    batchId: row.BatchID || '',
    status: 'Issued',
    remarks: row.Remarks || ''
  };
}

/**
 * Transform production output row for frontend
 */
function transformProductionOutput(row) {
  return {
    id: row.OutputNumber || '',
    outputNumber: row.OutputNumber || '',
    plantName: row.ProductionPlant || '',
    productionPlant: row.ProductionPlant || '',
    itemCode: row.FGItemCode || '',
    itemName: row.FGItemName || '',
    quantity: row.QtyProduced || 0,
    rejectedQuantity: 0,
    outputDate: row.ProductionDate || '',
    uom: row.UOM || 'PCS',
    status: row.Status || 'Completed'
  };
}

/**
 * Transform supervisor score row for frontend
 */
function transformSupervisorScore(row) {
  return {
    id: row.SupervisorID || '',
    supervisorName: row.SupervisorName || '',
    tasksCompleted: row.TotalDispatches || 0,
    onTimeDelivery: '95%',
    accuracyScore: row.AccuracyScore || 100,
    qualityScore: 90,
    overallScore: row.AccuracyScore || 100,
    period: 'Current',
    totalReceipts: row.TotalReceipts || 0,
    varianceCount: row.VarianceCount || 0,
    rank: row.Rank || 0
  };
}

/**
 * Transform GRN row for frontend
 */
function transformGRN(row) {
  return {
    id: row.GRNNumber || '',
    GRNNumber: row.GRNNumber || '',
    GatePassNumber: row.GatePassNumber || '',
    VendorCode: row.VendorCode || '',
    VendorName: row.VendorName || '',
    PONumber: row.PONumber || '',
    PODate: row.PODate || '',
    CommittedDeliveryDate: row.CommittedDeliveryDate || '',
    VendorDocNumber: row.VendorDocNumber || '',
    VendorDocDate: row.VendorDocDate || '',
    ReceiptDate: row.ReceiptDate || '',
    EntryDate: row.EntryDate || '',
    ReceiverName: row.ReceiverName || '',
    VehicleNumber: row.VehicleNumber || '',
    Status: row.Status || 'Open',
    TotalItems: row.TotalItems || 0,
    Remarks: row.Remarks || '',
    grnNumber: row.GRNNumber || '',
    status: row.Status || 'Open'
  };
}

/**
 * Transform gate pass row for frontend
 */
function transformGatePass(row) {
  return {
    id: row.GatePassNumber || '',
    GatePassNumber: row.GatePassNumber || '',
    gatePassNumber: row.GatePassNumber || '',
    type: row.Type || '',
    vehicleNumber: row.VehicleNumber || '',
    VehicleNumber: row.VehicleNumber || '',
    date: row.Date || '',
    dcNumber: row.DCNumber || '',
    grnNumber: row.GRNNumber || '',
    status: row.Status || 'Open'
  };
}

/**
 * Transform line item row for frontend
 */
function transformLineItem(row) {
  return {
    id: (row.GRNNumber || row.DCNumber || row.ReceiptNumber || row.RequisitionNumber || '') + '-' + (row.LineNumber || ''),
    lineNumber: row.LineNumber || '',
    itemCode: row.ItemCode || '',
    itemName: row.ItemName || '',
    qtyPerPack: row.QtyPerPack || 1,
    uom: row.UOM || 'PCS',
    numberOfPacks: row.NumberOfPacks || 0,
    totalQty: row.TotalQty || 0,
    totalQtyRequired: row.QtyRequired || 0,
    qtyDispatched: row.QtyDispatched || 0,
    qtyPending: row.QtyPending || 0,
    batchId: row.BatchID || '',
    grnStickerGenerated: row.GRNStickerGenerated || '',
    grnStickerStuck: row.GRNStickerStuck || '',
    grnStickerPut: row.GRNStickerPut || '',
    remarks: row.Remarks || '',
    // Keep originals for GRN page
    GRNNumber: row.GRNNumber || '',
    DCNumber: row.DCNumber || '',
    ReceiptNumber: row.ReceiptNumber || '',
    RequisitionNumber: row.RequisitionNumber || ''
  };
}

/**
 * Append a row to a sheet
 */
function appendRowToSheet(sheetName, rowData) {
  try {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return false;

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = [];

    for (const header of headers) {
      newRow.push(rowData[header] || '');
    }

    sheet.appendRow(newRow);
    return true;
  } catch (e) {
    Logger.log(`Error appending to sheet ${sheetName}: ${e}`);
    return false;
  }
}

/**
 * Find and update a row in a sheet by key field
 */
function updateRowInSheet(sheetName, keyField, keyValue, updateData) {
  try {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const keyIndex = headers.indexOf(keyField);

    if (keyIndex === -1) return false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][keyIndex] == keyValue) {
        for (const field in updateData) {
          const colIndex = headers.indexOf(field);
          if (colIndex !== -1) {
            sheet.getRange(i + 1, colIndex + 1).setValue(updateData[field]);
          }
        }
        return true;
      }
    }

    return false;
  } catch (e) {
    Logger.log(`Error updating row in ${sheetName}: ${e}`);
    return false;
  }
}

/**
 * Generate sequential ID with date prefix
 */
function generateSequentialID(prefix, sheetName, keyField) {
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd');
  const data = getSheetData(sheetName);

  let maxNum = 0;
  const pattern = new RegExp(`^${prefix}-${today}-(\\d+)$`);

  for (const row of data) {
    const id = row[keyField];
    const match = id.match(pattern);
    if (match) {
      maxNum = Math.max(maxNum, parseInt(match[1]));
    }
  }

  return `${prefix}-${today}-${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * Log audit trail
 */
function logAudit(userEmail, action, module, documentNumber, details) {
  const timestamp = new Date();
  appendRowToSheet('Audit Log', {
    Timestamp: timestamp,
    UserEmail: userEmail,
    Action: action,
    Module: module,
    DocumentNumber: documentNumber,
    Details: details.substring(0, 500) // Limit details to 500 chars
  });
}

/**
 * Validate item code exists in Item Master
 */
function validateItemCode(itemCode) {
  const items = getRawSheetData('Item Master');
  return items.some(item => item.ItemCode === itemCode);
}

/**
 * Validate warehouse code exists
 */
function validateWarehouseCode(warehouseCode) {
  const warehouses = getRawSheetData('Warehouse Master');
  return warehouses.some(w => w['Warehouse Code'] === warehouseCode);
}

/**
 * Get item details by code (raw - for internal use)
 */
function getItemByCode(itemCode) {
  const items = getRawSheetData('Item Master');
  return items.find(item => item.ItemCode === itemCode);
}

/**
 * Get warehouse details by code (raw - for internal use)
 */
function getWarehouseByCode(warehouseCode) {
  const warehouses = getRawSheetData('Warehouse Master');
  return warehouses.find(w => w['Warehouse Code'] === warehouseCode);
}

/**
 * Get vendor details by code (raw - for internal use)
 */
function getVendorByCode(vendorCode) {
  const vendors = getRawSheetData('Vendor & Customer Master');
  return vendors.find(v => v['BP Code'] === vendorCode);
}

// ==================== VENDOR MASTER OPERATIONS ====================

/**
 * Get all vendors
 */
function getVendors() {
  return getRawSheetData('Vendor & Customer Master').map(transformVendor);
}

/**
 * Add new vendor
 */
function addVendor(params) {
  const newVendor = {
    'BP Name': params.BPName || params.vendorName || '',
    'BP Code': params.BPCode || generateSequentialID('VND', 'Vendor & Customer Master', 'BP Code'),
    'BP Type': params.BPType || 'Vendor',
    'Branch ID': params.BranchID || '',
    'BP group': params.BPGroup || '',
    'Currency': params.Currency || 'INR',
    'Status': params.Status || 'Active',
    'GSTIN': params.GSTIN || params.gstin || '',
    'Street': params.Street || params.address || '',
    'Block': params.Block || '',
    'Building/Floor/Room': params.BuildingFloorRoom || '',
    'Zip Code': params.ZipCode || '',
    'City': params.City || '',
    'State': params.State || '',
    'Country': params.Country || 'India',
    'Phone': params.Phone || params.phone || '',
    'Email': params.Email || params.email || '',
    'Contact Person': params.ContactPerson || params.contactPerson || ''
  };

  appendRowToSheet('Vendor & Customer Master', newVendor);
  return newVendor;
}

/**
 * Search vendors by name or code
 */
function searchVendors(query) {
  const vendors = getVendors();
  return vendors.filter(v =>
    (v.vendorName || '').toString().toLowerCase().includes(query.toLowerCase()) ||
    (v.vendorCode || '').toString().toLowerCase().includes(query.toLowerCase())
  );
}

// ==================== ITEM MASTER OPERATIONS ====================

/**
 * Get all items
 */
function getItems() {
  return getRawSheetData('Item Master').map(transformItem);
}

/**
 * Add new item
 */
function addItem(params) {
  const newItem = {
    'ItemCode': params.ItemCode || params.itemCode || '',
    'Foreign Name': params.ForeignName || params.foreignName || '',
    'Item Description': params.ItemDescription || params.itemName || '',
    'Sub Category': params.SubCategory || params.category || '',
    'ItemsGroupCode': params.ItemsGroupCode || '',
    'Shipping': params.Shipping || '',
    'Manufacturer': params.Manufacturer || '',
    'Regions Of Origin': params.RegionsOfOrigin || '',
    'Status': params.Status || 'Active',
    'Manage Item': params.ManageItem || params.uom || '',
    'Item Category': params.ItemCategory || params.category || '',
    'Material Type': params.MaterialType || params.hsn || ''
  };

  appendRowToSheet('Item Master', newItem);
  return newItem;
}

/**
 * Search items by code or description
 */
function searchItems(query) {
  const items = getItems();
  return items.filter(item =>
    (item.itemCode || '').toString().toLowerCase().includes(query.toLowerCase()) ||
    (item.itemName || '').toString().toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * Get unique UOM list from Item Master
 */
function getUOMList() {
  var sheet = ss.getSheetByName('Item Master');
  if (!sheet) return ['PCS', 'KG', 'MTR', 'BOX', 'LTR', 'GM', 'DOZEN', 'SET', 'ROLL', 'PAIR', 'BUNDLE', 'SHEET', 'BAG', 'DRUM', 'CARTON'];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return ['PCS', 'KG', 'MTR', 'BOX', 'LTR', 'GM', 'DOZEN', 'SET', 'ROLL', 'PAIR', 'BUNDLE', 'SHEET', 'BAG', 'DRUM', 'CARTON'];
  var headers = data[0];
  var uomCol = -1;
  for (var j = 0; j < headers.length; j++) {
    if (headers[j].toString().toLowerCase().indexOf('uom') >= 0) {
      uomCol = j;
      break;
    }
  }
  var defaultUoms = ['PCS', 'KG', 'MTR', 'BOX', 'LTR', 'GM', 'DOZEN', 'SET', 'ROLL', 'PAIR', 'BUNDLE', 'SHEET', 'BAG', 'DRUM', 'CARTON'];
  if (uomCol === -1) return defaultUoms;
  var uomSet = {};
  for (var i = 1; i < data.length; i++) {
    var uom = data[i][uomCol].toString().trim().toUpperCase();
    if (uom) uomSet[uom] = true;
  }
  // Merge with defaults
  defaultUoms.forEach(function(u) { uomSet[u] = true; });
  return Object.keys(uomSet).sort();
}

// ==================== WAREHOUSE MASTER OPERATIONS ====================

/**
 * Get all warehouses
 */
function getWarehouses() {
  return getRawSheetData('Warehouse Master').map(transformWarehouse);
}

/**
 * Add new warehouse
 */
function addWarehouse(params) {
  const newWarehouse = {
    'Warehouse Code': params.WarehouseCode || params.warehouseCode || generateSequentialID('WH', 'Warehouse Master', 'Warehouse Code'),
    'Warehouse Name': params.WarehouseName || params.warehouseName || '',
    'Address': params.Address || params.address || '',
    'City': params.City || params.city || '',
    'State': params.State || params.state || '',
    'Pincode': params.Pincode || params.pincode || '',
    'GSTIN': params.GSTIN || params.gstin || '',
    'Contact Phone': params.ContactPhone || params.contactPhone || params.phone || '',
    'Contact Email': params.ContactEmail || params.contactEmail || params.email || '',
    'Manager Name': params.ManagerName || params.managerName || '',
    'Capacity': params.Capacity || params.capacity || '',
    'Status': params.Status || params.status || 'Active',
    'Data Source': params.DataSource || params.dataSource || '',
    'User Signature': params.UserSignature || params.userSignature || ''
  };

  appendRowToSheet('Warehouse Master', newWarehouse);
  return newWarehouse;
}

// ==================== PRODUCTION PLANT MASTER OPERATIONS ====================

/**
 * Get all production plants
 */
function getPlants() {
  return getRawSheetData('Production plant master').map(transformPlant);
}

/**
 * Add new production plant
 */
function addPlant(params) {
  const newPlant = {
    'Loc No': params.LocNo || params.plantCode || generateSequentialID('PLT', 'Production plant master', 'Loc No'),
    'Location': params.Location || params.plantName || '',
    'Street': params.Street || params.location || params.city || '',
    'Block': params.Block || params.state || ''
  };

  appendRowToSheet('Production plant master', newPlant);
  return newPlant;
}

// ==================== SUPERVISOR MASTER OPERATIONS ====================

/**
 * Get all supervisors
 */
function getSupervisors() {
  return getRawSheetData('Supervisor Master').map(transformSupervisor);
}

/**
 * Add new supervisor
 */
function addSupervisor(params) {
  const supervisorID = generateSequentialID('SUP', 'Supervisor Master', 'SupervisorID');

  const newSupervisor = {
    'SupervisorID': supervisorID,
    'Name': params.Name || params.supervisorName || '',
    'Phone': params.Phone || params.phone || '',
    'Email': params.Email || params.email || '',
    'Residential Address': params.ResidentialAddress || params.residentialAddress || params.Address || '',
    'Role': params.Role || params.department || 'Loading-Unloading Supervisor',
    'Assigned Warehouse': params.AssignedWarehouse || params.assignedWarehouse || '',
    'Status': params.Status || 'Active',
    'DateAdded': new Date()
  };

  appendRowToSheet('Supervisor Master', newSupervisor);
  return newSupervisor;
}

/**
 * Update supervisor
 */
function updateSupervisor(params) {
  const keyValue = params.SupervisorID || params.id;
  updateRowInSheet('Supervisor Master', 'SupervisorID', keyValue, {
    'Name': params.Name || params.supervisorName || '',
    'Phone': params.Phone || params.phone || '',
    'Email': params.Email || params.email || '',
    'Address': params.Address || params.assignedWarehouse || '',
    'Role': params.Role || params.department || '',
    'Status': params.Status || 'Active'
  });

  return { success: true };
}

// ==================== DRIVER MASTER OPERATIONS ====================

/**
 * Get all drivers
 */
function getDrivers() {
  return getRawSheetData('Driver Master').map(transformDriver);
}

/**
 * Add new driver
 */
function addDriver(params) {
  const driverID = generateSequentialID('DRV', 'Driver Master', 'DriverID');

  const newDriver = {
    'DriverID': driverID,
    'Name': params.Name || params.driverName || '',
    'Phone': params.Phone || params.phone || '',
    'LicenseNumber': params.LicenseNumber || params.licenseNumber || '',
    'Address': params.Address || params.address || '',
    'Email': params.Email || params.email || '',
    'Status': params.Status || params.status || 'Active',
    'DateAdded': new Date()
  };

  appendRowToSheet('Driver Master', newDriver);
  return newDriver;
}

/**
 * Update driver
 */
function updateDriver(params) {
  const keyValue = params.DriverID || params.id;
  updateRowInSheet('Driver Master', 'DriverID', keyValue, {
    'Name': params.Name || params.driverName || '',
    'Phone': params.Phone || params.phone || '',
    'LicenseNumber': params.LicenseNumber || params.licenseNumber || '',
    'Address': params.Address || params.address || '',
    'Email': params.Email || params.email || '',
    'Status': params.Status || params.status || 'Active'
  });

  return { success: true };
}

// ==================== VEHICLE MASTER OPERATIONS ====================

/**
 * Get all vehicles
 */
function getVehicles() {
  return getRawSheetData('Vehicle Master').map(transformVehicle);
}

/**
 * Add new vehicle
 */
function addVehicle(params) {
  const newVehicle = {
    'VehicleNumber': params.VehicleNumber || params.vehicleNumber || '',
    'VehicleType': params.VehicleType || params.vehicleType || 'Truck',
    'VehicleSize': params.VehicleSize || params.manufacturer || '',
    'OwnerName': params.OwnerName || params.ownerName || '',
    'Status': params.Status || params.status || 'Active',
    'DateAdded': new Date()
  };

  appendRowToSheet('Vehicle Master', newVehicle);
  return newVehicle;
}

/**
 * Update vehicle
 */
function updateVehicle(params) {
  const keyValue = params.VehicleNumber || params.vehicleNumber || params.id;
  updateRowInSheet('Vehicle Master', 'VehicleNumber', keyValue, {
    'VehicleType': params.VehicleType || params.vehicleType || '',
    'VehicleSize': params.VehicleSize || params.manufacturer || '',
    'OwnerName': params.OwnerName || params.ownerName || '',
    'Status': params.Status || params.status || 'Active'
  });

  return { success: true };
}

// ==================== GRN OPERATIONS ====================

/**
 * Create new GRN
 */
function createGRN(params) {
  const grnNumber = generateSequentialID('GRN', 'GRN Transactions', 'GRNNumber');
  const gatePassNumber = generateSequentialID('GP', 'Gate Pass Register', 'GatePassNumber');

  const newGRN = {
    'GRNNumber': grnNumber,
    'GatePassNumber': gatePassNumber,
    'VendorCode': params.VendorCode,
    'VendorName': params.VendorName || '',
    'PONumber': params.PONumber || '',
    'PODate': params.PODate || '',
    'CommittedDeliveryDate': params.CommittedDeliveryDate || '',
    'VendorDocNumber': params.VendorDocNumber || '',
    'VendorDocDate': params.VendorDocDate || '',
    'ReceiptDate': params.ReceiptDate || '',
    'EntryDate': new Date(),
    'ReceiverName': params.ReceiverName || '',
    'VehicleNumber': params.VehicleNumber || '',
    'Status': 'Open',
    'TotalItems': 0,
    'Remarks': params.Remarks || ''
  };

  appendRowToSheet('GRN Transactions', newGRN);

  // Create gate pass
  appendRowToSheet('Gate Pass Register', {
    'GatePassNumber': gatePassNumber,
    'Type': 'Inward',
    'VehicleNumber': params.VehicleNumber || '',
    'Date': new Date(),
    'DCNumber': '',
    'GRNNumber': grnNumber,
    'Status': 'Open'
  });

  return newGRN;
}

/**
 * Get all GRNs
 */
function getGRNs() {
  return getRawSheetData('GRN Transactions').map(transformGRN);
}

/**
 * Get GRN by number with line items
 */
function getGRNById(grnNumber) {
  const grns = getGRNs();
  const grn = grns.find(g => g.GRNNumber === grnNumber);

  if (!grn) return null;

  const lineItems = getRawSheetData('GRN Line Items').filter(li => li.GRNNumber === grnNumber).map(transformLineItem);

  return {
    ...grn,
    lineItems: lineItems
  };
}

/**
 * Add line item to GRN
 */
function addGRNLineItem(params) {
  if (!validateItemCode(params.ItemCode)) {
    return { success: false, error: 'Invalid ItemCode' };
  }

  const grnLineItems = getSheetData('GRN Line Items');
  const lineNumber = grnLineItems.filter(li => li.GRNNumber === params.GRNNumber).length + 1;

  const newLineItem = {
    'GRNNumber': params.GRNNumber,
    'LineNumber': lineNumber,
    'ItemCode': params.ItemCode,
    'ItemName': params.ItemName || '',
    'QtyPerPack': params.QtyPerPack || 1,
    'UOM': params.UOM || 'PCS',
    'NumberOfPacks': params.NumberOfPacks || 0,
    'TotalQty': (params.NumberOfPacks || 0) * (params.QtyPerPack || 1),
    'BatchID': params.BatchID || '',
    'GRNStickerGenerated': params.GRNStickerGenerated || 'No',
    'Remarks': params.Remarks || ''
  };

  appendRowToSheet('GRN Line Items', newLineItem);

  // Update GRN total items count
  const allLineItems = getSheetData('GRN Line Items').filter(li => li.GRNNumber === params.GRNNumber);
  const totalItems = allLineItems.length;
  updateRowInSheet('GRN Transactions', 'GRNNumber', params.GRNNumber, { 'TotalItems': totalItems });

  // Create batch entry if batch ID not provided
  if (!params.BatchID) {
    const batchID = generateSequentialID('BAT', 'Batch Master', 'BatchID');
    const batchEntry = {
      'BatchID': batchID,
      'ItemCode': params.ItemCode,
      'ItemName': params.ItemName || '',
      'DateOfEntry': new Date(),
      'DateOfReceipt': params.ReceiptDate || new Date(),
      'DateOfProduction': params.DateOfProduction || '',
      'PlaceOfOrigin': params.PlaceOfOrigin || '',
      'WarehouseCode': params.WarehouseCode || '',
      'Qty': newLineItem.TotalQty,
      'QtyPerPack': params.QtyPerPack || 1,
      'NumberOfPacks': params.NumberOfPacks || 0,
      'UOM': params.UOM || 'PCS',
      'GRNNumber': params.GRNNumber,
      'Status': 'Active'
    };

    appendRowToSheet('Batch Master', batchEntry);

    // Update line item with batch ID
    updateRowInSheet('GRN Line Items', 'GRNNumber', params.GRNNumber, { 'BatchID': batchID });

    // Update stock
    updateStockOnGRN(params.WarehouseCode || '', params.ItemCode, newLineItem.TotalQty, params.UOM || 'PCS');
  } else {
    // Update existing batch
    const batchData = getSheetData('Batch Master').find(b => b.BatchID === params.BatchID);
    if (batchData) {
      updateRowInSheet('Batch Master', 'BatchID', params.BatchID, {
        'Qty': (batchData.Qty || 0) + newLineItem.TotalQty
      });
    }
  }

  return { success: true, data: newLineItem };
}

/**
 * Generate gate pass (called from createGRN, but can be called separately)
 */
function generateGatePass(params) {
  const gatePassNumber = generateSequentialID('GP', 'Gate Pass Register', 'GatePassNumber');

  const newGatePass = {
    'GatePassNumber': gatePassNumber,
    'Type': params.Type || 'Inward',
    'VehicleNumber': params.VehicleNumber || '',
    'Date': new Date(),
    'DCNumber': params.DCNumber || '',
    'GRNNumber': params.GRNNumber || '',
    'Status': 'Open'
  };

  appendRowToSheet('Gate Pass Register', newGatePass);
  return newGatePass;
}

/**
 * Update stock when GRN is created
 */
function updateStockOnGRN(warehouseCode, itemCode, quantity, uom) {
  if (!warehouseCode || !itemCode) return;

  const stockMaster = getSheetData('Stock Master');
  const existingStock = stockMaster.find(s =>
    s.WarehouseCode === warehouseCode && s.ItemCode === itemCode
  );

  if (existingStock) {
    const currentQty = existingStock.TotalQty || 0;
    updateRowInSheet('Stock Master', 'ItemCode', itemCode, {
      'TotalQty': currentQty + quantity,
      'LastUpdated': new Date()
    });
  } else {
    const warehouse = getWarehouseByCode(warehouseCode);
    const item = getItemByCode(itemCode);

    appendRowToSheet('Stock Master', {
      'WarehouseCode': warehouseCode,
      'WarehouseName': warehouse ? warehouse['Warehouse Name'] : '',
      'ItemCode': itemCode,
      'ItemName': item ? item['Item Description'] : '',
      'UOM': uom || 'PCS',
      'QtyInPacks': 0,
      'TotalQty': quantity,
      'LastUpdated': new Date()
    });
  }
}

/**
 * Get batch master data
 */
function getBatchMaster() {
  return getSheetData('Batch Master');
}

/**
 * Get batches with raw headers
 */
function getBatches() {
  var sheet = ss.getSheetByName('Batch Master');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    row.id = i;
    result.push(row);
  }
  return result;
}

// ==================== RM RETURNS OPERATIONS ====================

/**
 * Return raw materials to stores
 */
function returnToStores(params) {
  var sheet = ss.getSheetByName('RM Returns');
  var returnNumber = generateSequentialID('RTN', 'RM Returns', 'ReturnNumber');

  sheet.appendRow([
    returnNumber,
    params.productionPlant || '',
    params.returnDate || new Date().toISOString(),
    params.returnedBy || '',
    params.destinationWarehouse || '',
    params.itemCode || '',
    params.itemName || '',
    params.uom || '',
    params.quantity || 0,
    params.batchId || '',
    params.remarks || '',
    'Completed',
    new Date().toISOString()
  ]);

  // Add stock back to destination warehouse
  updateStockOnReceipt(params.destinationWarehouse, params.itemCode, parseFloat(params.quantity || 0));

  logAudit(Session.getActiveUser().getEmail(), 'CREATE', 'RM Returns', returnNumber, 'RM returned to stores: ' + params.itemCode);

  return { success: true, returnNumber: returnNumber };
}

/**
 * Get all RM returns
 */
function getReturns() {
  var sheet = ss.getSheetByName('RM Returns');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    row.id = i;
    result.push(row);
  }
  return result;
}

// ==================== MATERIAL REQUISITION OPERATIONS ====================

/**
 * Create new material requisition
 */
function createRequisition(params) {
  const requisitionNumber = generateSequentialID('REQ', 'Material Requisitions', 'RequisitionNumber');

  const newRequisition = {
    'RequisitionNumber': requisitionNumber,
    'RequestedBy': params.RequestedBy,
    'RequestedDate': params.RequestedDate || new Date(),
    'ProductionDate': params.ProductionDate || '',
    'ProductionPlant': params.ProductionPlant || '',
    'DestinationWarehouse': params.DestinationWarehouse || '',
    'Status': 'Open',
    'DateCreated': new Date()
  };

  appendRowToSheet('Material Requisitions', newRequisition);
  return newRequisition;
}

/**
 * Get all requisitions
 */
function getRequisitions() {
  return getRawSheetData('Material Requisitions').map(transformRequisition);
}

/**
 * Get requisition by number with line items
 */
function getRequisitionById(requisitionNumber) {
  const requisitions = getRequisitions();
  const req = requisitions.find(r => r.requisitionNumber === requisitionNumber);

  if (!req) return null;

  const lineItems = getRawSheetData('Requisition Line Items').filter(li => li.RequisitionNumber === requisitionNumber).map(transformLineItem);

  return {
    ...req,
    lineItems: lineItems
  };
}

/**
 * Add line item to requisition
 */
function addRequisitionLineItem(params) {
  if (!validateItemCode(params.ItemCode)) {
    return { success: false, error: 'Invalid ItemCode' };
  }

  const reqLineItems = getSheetData('Requisition Line Items');
  const lineNumber = reqLineItems.filter(li => li.RequisitionNumber === params.RequisitionNumber).length + 1;

  const newLineItem = {
    'RequisitionNumber': params.RequisitionNumber,
    'LineNumber': lineNumber,
    'ItemCode': params.ItemCode,
    'ItemName': params.ItemName || '',
    'UOM': params.UOM || 'PCS',
    'QtyRequired': params.QtyRequired || 0,
    'QtyDispatched': params.QtyDispatched || 0,
    'QtyPending': (params.QtyRequired || 0) - (params.QtyDispatched || 0),
    'Remarks': params.Remarks || ''
  };

  appendRowToSheet('Requisition Line Items', newLineItem);
  return { success: true, data: newLineItem };
}

/**
 * Update requisition status
 */
function updateRequisitionStatus(requisitionNumber, status) {
  updateRowInSheet('Material Requisitions', 'RequisitionNumber', requisitionNumber, { 'Status': status });
  return { success: true };
}

// ==================== INTERNAL DISPATCH OPERATIONS ====================

/**
 * Create new dispatch
 */
function createDispatch(params) {
  const dcNumber = generateSequentialID('DC', 'Internal Dispatches', 'DCNumber');

  const newDispatch = {
    'DCNumber': dcNumber,
    'RequisitionNumber': params.RequisitionNumber || '',
    'SupervisorName': params.SupervisorName || '',
    'DriverName': params.DriverName || '',
    'VehicleNumber': params.VehicleNumber || '',
    'Date': new Date(),
    'LocationFrom': params.LocationFrom || '',
    'LocationFromAddress': params.LocationFromAddress || '',
    'LocationFromGST': params.LocationFromGST || '',
    'LocationFromPhone': params.LocationFromPhone || '',
    'LocationTo': params.LocationTo || '',
    'LocationToAddress': params.LocationToAddress || '',
    'LocationToGST': params.LocationToGST || '',
    'LocationToPhone': params.LocationToPhone || '',
    'Status': 'Dispatched',
    'TotalItems': 0
  };

  appendRowToSheet('Internal Dispatches', newDispatch);

  // Create gate pass for outward dispatch
  generateGatePass({
    'Type': 'Outward',
    'VehicleNumber': params.VehicleNumber,
    'DCNumber': dcNumber
  });

  return newDispatch;
}

/**
 * Get all dispatches
 */
function getDispatches() {
  return getRawSheetData('Internal Dispatches').map(transformDispatch);
}

/**
 * Get dispatch by number with line items
 */
function getDispatchById(dcNumber) {
  const dispatches = getDispatches();
  const dispatch = dispatches.find(d => d.dcNumber === dcNumber);

  if (!dispatch) return null;

  const lineItems = getRawSheetData('Dispatch Line Items').filter(li => li.DCNumber === dcNumber).map(transformLineItem);

  return {
    ...dispatch,
    lineItems: lineItems
  };
}

/**
 * Add line item to dispatch
 */
function addDispatchLineItem(params) {
  if (!validateItemCode(params.ItemCode)) {
    return { success: false, error: 'Invalid ItemCode' };
  }

  const dispatchLineItems = getSheetData('Dispatch Line Items');
  const lineNumber = dispatchLineItems.filter(li => li.DCNumber === params.DCNumber).length + 1;

  const newLineItem = {
    'DCNumber': params.DCNumber,
    'LineNumber': lineNumber,
    'ItemCode': params.ItemCode,
    'ItemName': params.ItemName || '',
    'QtyPerPack': params.QtyPerPack || 1,
    'UOM': params.UOM || 'PCS',
    'NumberOfPacks': params.NumberOfPacks || 0,
    'TotalQty': (params.NumberOfPacks || 0) * (params.QtyPerPack || 1),
    'BatchID': params.BatchID || '',
    'GRNStickerStuck': params.GRNStickerStuck || 'No',
    'Remarks': params.Remarks || ''
  };

  appendRowToSheet('Dispatch Line Items', newLineItem);

  // Update dispatch total items
  const allLineItems = getSheetData('Dispatch Line Items').filter(li => li.DCNumber === params.DCNumber);
  updateRowInSheet('Internal Dispatches', 'DCNumber', params.DCNumber, { 'TotalItems': allLineItems.length });

  // Add to goods in transit
  const dispatch = getDispatchById(params.DCNumber);
  if (dispatch) {
    appendRowToSheet('Goods In Transit', {
      'DCNumber': params.DCNumber,
      'ItemCode': params.ItemCode,
      'ItemName': params.ItemName || '',
      'UOM': params.UOM || 'PCS',
      'QtyInPacks': params.NumberOfPacks || 0,
      'TotalQty': newLineItem.TotalQty,
      'DispatchDate': dispatch.Date,
      'LocationFrom': dispatch.LocationFrom,
      'LocationTo': dispatch.LocationTo,
      'Status': 'InTransit'
    });
  }

  // Update stock - reduce from source
  updateStockOnDispatch(params.SourceWarehouseCode || '', params.ItemCode, newLineItem.TotalQty);

  return { success: true, data: newLineItem };
}

/**
 * Update dispatch status
 */
function updateDispatchStatus(dcNumber, status) {
  updateRowInSheet('Internal Dispatches', 'DCNumber', dcNumber, { 'Status': status });

  // Update goods in transit status if dispatch is received
  if (status === 'Received') {
    const goodsInTransit = getSheetData('Goods In Transit').filter(g => g.DCNumber === dcNumber);
    for (const item of goodsInTransit) {
      updateRowInSheet('Goods In Transit', 'DCNumber', dcNumber, { 'Status': 'Received' });
    }
  }

  return { success: true };
}

/**
 * Update stock when dispatch happens
 */
function updateStockOnDispatch(warehouseCode, itemCode, quantity) {
  if (!warehouseCode || !itemCode) return;

  const stockMaster = getSheetData('Stock Master');
  const existingStock = stockMaster.find(s =>
    s.WarehouseCode === warehouseCode && s.ItemCode === itemCode
  );

  if (existingStock) {
    const currentQty = existingStock.TotalQty || 0;
    const newQty = Math.max(0, currentQty - quantity);
    updateRowInSheet('Stock Master', 'ItemCode', itemCode, {
      'TotalQty': newQty,
      'LastUpdated': new Date()
    });
  }
}

// ==================== INTERNAL RECEIPT OPERATIONS ====================

/**
 * Create new receipt
 */
function createReceipt(params) {
  const receiptNumber = generateSequentialID('RN', 'Internal Receipts', 'ReceiptNumber');

  const newReceipt = {
    'ReceiptNumber': receiptNumber,
    'DCNumber': params.DCNumber || '',
    'RequisitionNumber': params.RequisitionNumber || '',
    'DeliveryChallanDate': params.DeliveryChallanDate || '',
    'ReceiptDate': new Date(),
    'EntryDate': new Date(),
    'ReceiverName': params.ReceiverName || '',
    'VehicleNumber': params.VehicleNumber || '',
    'GatePassNumber': params.GatePassNumber || '',
    'Status': 'Open',
    'TotalItems': 0
  };

  appendRowToSheet('Internal Receipts', newReceipt);

  // Create gate pass if not already done
  if (!params.GatePassNumber) {
    generateGatePass({
      'Type': 'Inward',
      'VehicleNumber': params.VehicleNumber,
      'DCNumber': params.DCNumber
    });
  }

  return newReceipt;
}

/**
 * Get all receipts
 */
function getReceipts() {
  return getRawSheetData('Internal Receipts').map(transformReceipt);
}

/**
 * Get receipt by number with line items
 */
function getReceiptById(receiptNumber) {
  const receipts = getReceipts();
  const receipt = receipts.find(r => r.receiptNumber === receiptNumber);

  if (!receipt) return null;

  const lineItems = getRawSheetData('Receipt Line Items').filter(li => li.ReceiptNumber === receiptNumber).map(transformLineItem);

  return {
    ...receipt,
    lineItems: lineItems
  };
}

/**
 * Add line item to receipt
 */
function addReceiptLineItem(params) {
  if (!validateItemCode(params.ItemCode)) {
    return { success: false, error: 'Invalid ItemCode' };
  }

  const receiptLineItems = getSheetData('Receipt Line Items');
  const lineNumber = receiptLineItems.filter(li => li.ReceiptNumber === params.ReceiptNumber).length + 1;

  const newLineItem = {
    'ReceiptNumber': params.ReceiptNumber,
    'LineNumber': lineNumber,
    'ItemCode': params.ItemCode,
    'ItemName': params.ItemName || '',
    'QtyPerPack': params.QtyPerPack || 1,
    'UOM': params.UOM || 'PCS',
    'NumberOfPacks': params.NumberOfPacks || 0,
    'TotalQty': (params.NumberOfPacks || 0) * (params.QtyPerPack || 1),
    'GRNStickerPut': params.GRNStickerPut || 'No',
    'Remarks': params.Remarks || ''
  };

  appendRowToSheet('Receipt Line Items', newLineItem);

  // Update receipt total items
  const allLineItems = getSheetData('Receipt Line Items').filter(li => li.ReceiptNumber === params.ReceiptNumber);
  updateRowInSheet('Internal Receipts', 'ReceiptNumber', params.ReceiptNumber, { 'TotalItems': allLineItems.length });

  // Create reconciliation entry
  const dcNumber = getSheetData('Internal Receipts').find(r => r.ReceiptNumber === params.ReceiptNumber)?.DCNumber;
  if (dcNumber) {
    const dispatchLineItems = getSheetData('Dispatch Line Items').filter(li =>
      li.DCNumber === dcNumber && li.ItemCode === params.ItemCode
    );

    if (dispatchLineItems.length > 0) {
      const dispatchQty = dispatchLineItems[0].TotalQty || 0;
      const receiptQty = newLineItem.TotalQty;
      const variance = dispatchQty - receiptQty;
      const varianceType = variance > 0 ? 'TransitLoss' : (variance < 0 ? 'ReceiptError' : '');

      const recoID = generateSequentialID('RECO', 'Reconciliation', 'RecoID');
      appendRowToSheet('Reconciliation', {
        'RecoID': recoID,
        'DCNumber': dcNumber,
        'ReceiptNumber': params.ReceiptNumber,
        'ItemCode': params.ItemCode,
        'ItemName': params.ItemName || '',
        'DispatchQty': dispatchQty,
        'ReceiptQty': receiptQty,
        'Variance': Math.abs(variance),
        'VarianceType': varianceType || 'DispatchError',
        'Remarks': '',
        'Status': variance === 0 ? 'Closed' : 'Open',
        'ResolvedDate': variance === 0 ? new Date() : ''
      });
    }
  }

  // Update stock - add to destination warehouse
  updateStockOnReceipt(params.DestinationWarehouseCode || '', params.ItemCode, newLineItem.TotalQty);

  return { success: true, data: newLineItem };
}

/**
 * Update receipt status
 */
function updateReceiptStatus(receiptNumber, status) {
  updateRowInSheet('Internal Receipts', 'ReceiptNumber', receiptNumber, { 'Status': status });

  // Remove from goods in transit when receipt is complete
  if (status === 'Received') {
    const receipt = getReceiptById(receiptNumber);
    if (receipt && receipt.DCNumber) {
      const goodsInTransit = getSheetData('Goods In Transit').filter(g => g.DCNumber === receipt.DCNumber);
      for (const item of goodsInTransit) {
        // Remove from goods in transit (mark as received)
        updateRowInSheet('Goods In Transit', 'DCNumber', receipt.DCNumber, { 'Status': 'Received' });
      }
    }
  }

  return { success: true };
}

/**
 * Update stock when receipt happens
 */
function updateStockOnReceipt(warehouseCode, itemCode, quantity) {
  if (!warehouseCode || !itemCode) return;

  const stockMaster = getSheetData('Stock Master');
  const existingStock = stockMaster.find(s =>
    s.WarehouseCode === warehouseCode && s.ItemCode === itemCode
  );

  if (existingStock) {
    const currentQty = existingStock.TotalQty || 0;
    updateRowInSheet('Stock Master', 'ItemCode', itemCode, {
      'TotalQty': currentQty + quantity,
      'LastUpdated': new Date()
    });
  } else {
    const warehouse = getWarehouseByCode(warehouseCode);
    const item = getItemByCode(itemCode);

    appendRowToSheet('Stock Master', {
      'WarehouseCode': warehouseCode,
      'WarehouseName': warehouse ? warehouse['Warehouse Name'] : '',
      'ItemCode': itemCode,
      'ItemName': item ? item['Item Description'] : '',
      'UOM': 'PCS',
      'QtyInPacks': 0,
      'TotalQty': quantity,
      'LastUpdated': new Date()
    });
  }
}

// ==================== RECONCILIATION OPERATIONS ====================

/**
 * Get all open reconciliations
 */
function getOpenReconciliations() {
  const reconciliations = getRawSheetData('Reconciliation');
  return reconciliations.filter(r => r.Status === 'Open').map(transformReconciliation);
}

/**
 * Get reconciliations by DC number
 */
function getReconciliationsByDC(dcNumber) {
  const reconciliations = getRawSheetData('Reconciliation');
  return reconciliations.filter(r => r.DCNumber === dcNumber).map(transformReconciliation);
}

/**
 * Reconcile document
 */
function reconcileDocument(params) {
  var sheet = ss.getSheetByName('Reconciliation');
  if (!sheet) return { success: false, error: 'Reconciliation sheet not found' };
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var recoIdCol = headers.indexOf('RecoID');
  var statusCol = headers.indexOf('Status');
  var remarksCol = headers.indexOf('Remarks');
  var varianceTypeCol = headers.indexOf('VarianceType');
  var resolvedDateCol = headers.indexOf('ResolvedDate');
  var dcNumberCol = headers.indexOf('DCNumber');
  var receiptNumberCol = headers.indexOf('ReceiptNumber');
  var itemCodeCol = headers.indexOf('ItemCode');
  var dispatchQtyCol = headers.indexOf('DispatchQty');
  var receiptQtyCol = headers.indexOf('ReceiptQty');

  for (var i = 1; i < data.length; i++) {
    if (data[i][recoIdCol] === params.recoId || data[i][recoIdCol] === params.RecoID || data[i][dcNumberCol] === params.dispatchId) {
      var varianceType = params.varianceType || data[i][varianceTypeCol];
      var itemCode = data[i][itemCodeCol];
      var dispatchQty = parseFloat(data[i][dispatchQtyCol] || 0);
      var receiptQty = parseFloat(data[i][receiptQtyCol] || 0);

      // Get dispatch and receipt location info
      var dispatchSheet = ss.getSheetByName('Internal Dispatches');
      var dispatchData = dispatchSheet ? dispatchSheet.getDataRange().getValues() : [];
      var dcNumber = data[i][dcNumberCol];
      var locationFrom = '';
      var locationTo = '';

      for (var d = 1; d < dispatchData.length; d++) {
        if (dispatchData[d][0] === dcNumber) {
          locationFrom = dispatchData[d][dispatchData[0].indexOf('LocationFrom')] || '';
          locationTo = dispatchData[d][dispatchData[0].indexOf('LocationTo')] || '';
          break;
        }
      }

      // Apply corrective stock based on variance type
      if (varianceType === 'dispatch-counting-error' || varianceType === 'DispatchError') {
        // Dispatch counting error: use receipt qty for all stock transactions
        // Correct source warehouse: add back (dispatchQty - receiptQty)
        if (locationFrom && dispatchQty > receiptQty) {
          updateStockOnReceipt(locationFrom, itemCode, dispatchQty - receiptQty);
        } else if (locationFrom && receiptQty > dispatchQty) {
          updateStockOnDispatch(locationFrom, itemCode, receiptQty - dispatchQty);
        }
      } else if (varianceType === 'receipt-counting-error' || varianceType === 'ReceiptError') {
        // Receipt counting error: use dispatch qty for stock transactions
        // Correct destination warehouse
        if (locationTo && dispatchQty > receiptQty) {
          updateStockOnReceipt(locationTo, itemCode, dispatchQty - receiptQty);
        } else if (locationTo && receiptQty > dispatchQty) {
          updateStockOnDispatch(locationTo, itemCode, receiptQty - dispatchQty);
        }
      } else if (varianceType === 'transit-loss' || varianceType === 'TransitLoss') {
        // Transit loss: reduce from dispatch location, add receipt qty at destination
        // Stock already reduced at dispatch and added at receipt, so just mark resolved
        // No additional stock adjustment needed - the actual quantities stand
      }

      // Update reconciliation record
      sheet.getRange(i + 1, varianceTypeCol + 1).setValue(varianceType);
      sheet.getRange(i + 1, statusCol + 1).setValue('Closed');
      sheet.getRange(i + 1, remarksCol + 1).setValue(params.remarks || params.Remarks || '');
      sheet.getRange(i + 1, resolvedDateCol + 1).setValue(new Date().toISOString());

      logAudit(Session.getActiveUser().getEmail(), 'UPDATE', 'Reconciliation', data[i][recoIdCol], 'Reconciled with type: ' + varianceType);

      return { success: true };
    }
  }

  return { success: false, error: 'Reconciliation record not found' };
}

// ==================== STOCK OPERATIONS ====================

/**
 * Get stock by warehouse
 */
function getStockByWarehouse(warehouseCode) {
  const stock = getRawSheetData('Stock Master');
  return stock.filter(s => s.WarehouseCode === warehouseCode).map(transformStock);
}

/**
 * Get overall stock across all warehouses
 */
function getOverallStock() {
  return getRawSheetData('Stock Master').map(transformStock);
}

/**
 * Get goods in transit
 */
function getGoodsInTransit() {
  const goodsInTransit = getRawSheetData('Goods In Transit');
  return goodsInTransit.filter(g => g.Status === 'InTransit').map(transformGoodsInTransit);
}

// ==================== PRODUCTION OPERATIONS ====================

/**
 * Create production issue
 */
function createProductionIssue(params) {
  const issueNumber = generateSequentialID('ISS', 'Production Issues', 'IssueNumber');

  const newIssue = {
    'IssueNumber': issueNumber,
    'ProductionPlant': params.ProductionPlant || '',
    'IssueDate': new Date(),
    'IssuedBy': params.IssuedBy || '',
    'ItemCode': params.ItemCode,
    'ItemName': params.ItemName || '',
    'UOM': params.UOM || 'PCS',
    'QtyIssued': params.QtyIssued || 0,
    'BatchID': params.BatchID || '',
    'Remarks': params.Remarks || ''
  };

  appendRowToSheet('Production Issues', newIssue);

  // Reduce from stock
  updateStockOnDispatch(params.WarehouseCode || '', params.ItemCode, params.QtyIssued || 0);

  return newIssue;
}

/**
 * Get all production issues
 */
function getProductionIssues() {
  return getRawSheetData('Production Issues').map(transformProductionIssue);
}

/**
 * Create production output
 */
function createProductionOutput(params) {
  const outputNumber = generateSequentialID('OUT', 'Production Output', 'OutputNumber');

  const newOutput = {
    'OutputNumber': outputNumber,
    'ProductionPlant': params.ProductionPlant || '',
    'ProductionDate': new Date(),
    'FGItemCode': params.FGItemCode,
    'FGItemName': params.FGItemName || '',
    'QtyProduced': params.QtyProduced || 0,
    'UOM': params.UOM || 'PCS',
    'RMItemCode': params.RMItemCode || '',
    'RMQtyUsedPerUnit': params.RMQtyUsedPerUnit || 0,
    'Status': 'Completed'
  };

  appendRowToSheet('Production Output', newOutput);

  // Add to FG stock
  const fgStockMaster = getSheetData('FG Stock Master');
  const existingFGStock = fgStockMaster.find(s =>
    s.WarehouseCode === params.WarehouseCode && s.ItemCode === params.FGItemCode
  );

  if (existingFGStock) {
    const currentQty = existingFGStock.Qty || 0;
    updateRowInSheet('FG Stock Master', 'ItemCode', params.FGItemCode, {
      'Qty': currentQty + (params.QtyProduced || 0),
      'LastUpdated': new Date()
    });
  } else {
    appendRowToSheet('FG Stock Master', {
      'WarehouseCode': params.WarehouseCode || '',
      'ItemCode': params.FGItemCode,
      'ItemName': params.FGItemName || '',
      'UOM': params.UOM || 'PCS',
      'Qty': params.QtyProduced || 0,
      'LastUpdated': new Date()
    });
  }

  return newOutput;
}

/**
 * Get all production output
 */
function getProductionOutput() {
  return getRawSheetData('Production Output').map(transformProductionOutput);
}

// ==================== FINISHED GOODS STOCK OPERATIONS ====================

/**
 * Get FG stock
 */
function getFGStock() {
  return getRawSheetData('FG Stock Master').map(transformFGStock);
}

/**
 * Dispatch FG stock
 */
function dispatchFG(params) {
  const fgStockMaster = getSheetData('FG Stock Master');
  const existingFGStock = fgStockMaster.find(s =>
    s.WarehouseCode === params.WarehouseCode && s.ItemCode === params.ItemCode
  );

  if (!existingFGStock || existingFGStock.Qty < params.QtyDispatched) {
    return { success: false, error: 'Insufficient FG stock' };
  }

  const newQty = existingFGStock.Qty - params.QtyDispatched;
  updateRowInSheet('FG Stock Master', 'ItemCode', params.ItemCode, {
    'Qty': newQty,
    'LastUpdated': new Date()
  });

  return { success: true, remainingQty: newQty };
}

// ==================== SUPERVISOR SCORING ====================

/**
 * Get supervisor scores
 */
function getSupervisorScores() {
  return getRawSheetData('Supervisor Scores').map(transformSupervisorScore);
}

/**
 * Update supervisor score based on accuracy
 */
function updateSupervisorScore(supervisorID) {
  const supervisors = getRawSheetData('Supervisor Master');
  const supervisor = supervisors.find(s => s.SupervisorID === supervisorID);

  if (!supervisor) {
    return { success: false, error: 'Supervisor not found' };
  }

  // Count dispatches and receipts
  const dispatches = getRawSheetData('Internal Dispatches').filter(d => d.SupervisorName === supervisor.Name);
  const receipts = getRawSheetData('Internal Receipts');

  // Calculate accuracy based on reconciliations
  const reconciliations = getRawSheetData('Reconciliation');
  const supervisorReconciliations = reconciliations.filter(r => {
    const dispatch = dispatches.find(d => d.DCNumber === r.DCNumber);
    return dispatch !== undefined;
  });

  const closedReconciliations = supervisorReconciliations.filter(r => r.Status === 'Closed' && r.Variance === 0);
  const accuracyScore = supervisorReconciliations.length > 0
    ? (closedReconciliations.length / supervisorReconciliations.length) * 100
    : 100;

  const varianceCount = supervisorReconciliations.filter(r => r.Variance > 0).length;

  // Get all supervisor scores to calculate rank
  const supervisorScores = getRawSheetData('Supervisor Scores');
  const existingScore = supervisorScores.find(s => s.SupervisorID === supervisorID);

  const scoreData = {
    'SupervisorID': supervisorID,
    'SupervisorName': supervisor.Name,
    'TotalDispatches': dispatches.length,
    'TotalReceipts': receipts.length,
    'AccuracyScore': accuracyScore.toFixed(2),
    'VarianceCount': varianceCount,
    'LastUpdated': new Date()
  };

  if (existingScore) {
    updateRowInSheet('Supervisor Scores', 'SupervisorID', supervisorID, scoreData);
  } else {
    appendRowToSheet('Supervisor Scores', scoreData);
  }

  // Calculate rank (higher score = better rank)
  const allScores = getRawSheetData('Supervisor Scores').sort((a, b) => b.AccuracyScore - a.AccuracyScore);
  const rank = allScores.findIndex(s => s.SupervisorID === supervisorID) + 1;

  updateRowInSheet('Supervisor Scores', 'SupervisorID', supervisorID, { 'Rank': rank });

  return { success: true, data: scoreData };
}

// ==================== MISSING CRUD OPERATIONS ====================

/**
 * Update an existing item
 */
function updateItem(params) {
  const keyValue = params.id || params.ItemCode;
  updateRowInSheet('Item Master', 'ItemCode', keyValue, {
    'Foreign Name': params.ForeignName || params.foreignName || '',
    'Item Description': params.ItemDescription || params.itemName || '',
    'Sub Category': params.SubCategory || params.category || '',
    'ItemsGroupCode': params.ItemsGroupCode || '',
    'Status': params.Status || 'Active',
    'Item Category': params.ItemCategory || params.category || '',
    'Material Type': params.MaterialType || ''
  });
  return { success: true };
}

/**
 * Delete an item (soft delete by setting status to Inactive)
 */
function deleteItem(itemCode) {
  updateRowInSheet('Item Master', 'ItemCode', itemCode, { 'Status': 'Inactive' });
  return { success: true };
}

/**
 * Update an existing vendor
 */
function updateVendor(params) {
  const keyValue = params.id || params.BPCode;
  updateRowInSheet('Vendor & Customer Master', 'BP Code', keyValue, {
    'BP Name': params.BPName || params.vendorName || '',
    'Contact Person': params.ContactPerson || params.contactPerson || '',
    'Email': params.Email || params.email || '',
    'Phone': params.Phone || params.phone || '',
    'Street': params.Street || params.address || '',
    'GSTIN': params.GSTIN || params.gstin || '',
    'Status': params.Status || 'Active'
  });
  return { success: true };
}

/**
 * Delete a vendor (soft delete by setting status to Inactive)
 */
function deleteVendor(vendorCode) {
  updateRowInSheet('Vendor & Customer Master', 'BP Code', vendorCode, { 'Status': 'Inactive' });
  return { success: true };
}

/**
 * Delete a supervisor (soft delete by setting status to Inactive)
 */
function deleteSupervisor(supervisorId) {
  updateRowInSheet('Supervisor Master', 'SupervisorID', supervisorId, { 'Status': 'Inactive' });
  return { success: true };
}

// ==================== DASHBOARD & ANALYTICS ====================

/**
 * Get dashboard statistics
 */
function getDashboardStats() {
  const grns = getSheetData('GRN Transactions');
  const requisitions = getSheetData('Material Requisitions');
  const goodsInTransit = getSheetData('Goods In Transit').filter(g => g.Status === 'InTransit');
  const reconciliations = getSheetData('Reconciliation').filter(r => r.Status === 'Open');
  const stockMaster = getSheetData('Stock Master');

  let totalStockValue = 0;
  for (const stock of stockMaster) {
    totalStockValue += (stock.TotalQty || 0);
  }

  const pendingGRNs = grns.filter(g => g.Status === 'Open').length;
  const openRequisitions = requisitions.filter(r => r.Status === 'Open').length;

  return {
    totalStockValue: totalStockValue,
    pendingGRNs: pendingGRNs,
    openRequisitions: openRequisitions,
    goodsInTransit: goodsInTransit.length,
    pendingReconciliation: reconciliations.length
  };
}

/**
 * Get recent activity from audit log
 */
function getRecentActivity(limit) {
  const auditLog = getSheetData('Audit Log');
  const numLimit = parseInt(limit) || 10;

  const sorted = auditLog.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
  const recent = sorted.slice(0, numLimit);

  return recent.map((entry, index) => ({
    id: `activity-${index}`,
    type: getActivityType(entry.Module),
    title: `${entry.Action} - ${entry.Module}`,
    description: entry.DocumentNumber ? `Document: ${entry.DocumentNumber}` : (entry.Details || '').substring(0, 100),
    timestamp: entry.Timestamp,
    status: entry.Action === 'CREATE' ? 'open' : 'completed'
  }));
}

/**
 * Map module name to activity type
 */
function getActivityType(moduleName) {
  if (!moduleName) return 'other';
  const lower = moduleName.toLowerCase();
  if (lower.includes('grn')) return 'grn';
  if (lower.includes('requisition')) return 'requisition';
  if (lower.includes('dispatch')) return 'dispatch';
  if (lower.includes('receipt')) return 'receipt';
  if (lower.includes('production')) return 'production';
  return 'other';
}

// ==================== REJECTED STOCK ====================

/**
 * Get all rejected stock
 */
function getRejectedStock() {
  return getRawSheetData('Rejected Stock').map(transformRejectedStock);
}

// ==================== PRODUCTION RECONCILIATION ====================

/**
 * Get production reconciliation (input vs output comparison)
 */
function getProductionReconciliation() {
  const issues = getSheetData('Production Issues');
  const outputs = getSheetData('Production Output');

  const recoData = [];
  const plantItems = {};

  for (const issue of issues) {
    const key = `${issue.ProductionPlant}-${issue.ItemCode}`;
    if (!plantItems[key]) {
      plantItems[key] = { inputQuantity: 0, outputQuantity: 0, itemName: issue.ItemName, plant: issue.ProductionPlant, itemCode: issue.ItemCode, date: issue.IssueDate };
    }
    plantItems[key].inputQuantity += (issue.QtyIssued || 0);
  }

  for (const output of outputs) {
    const key = `${output.ProductionPlant}-${output.RMItemCode}`;
    if (plantItems[key]) {
      plantItems[key].outputQuantity += (output.QtyProduced || 0);
    }
  }

  let idx = 1;
  for (const key in plantItems) {
    const item = plantItems[key];
    recoData.push({
      productionNumber: `PRECO-${String(idx++).padStart(3, '0')}`,
      itemName: item.itemName,
      inputQuantity: item.inputQuantity,
      outputQuantity: item.outputQuantity,
      productionDate: item.date
    });
  }

  return recoData;
}

// ==================== RECONCILIATION UPDATE ====================

/**
 * Update reconciliation record
 */
function updateReconciliation(params) {
  updateRowInSheet('Reconciliation', 'RecoID', params.RecoID, {
    'Status': params.Status || 'Closed',
    'Remarks': params.Remarks || '',
    'ResolvedDate': params.Status === 'Closed' ? new Date() : ''
  });
  return { success: true };
}

// ==================== GATE PASS ====================

/**
 * Get open gate passes
 */
function getOpenGatePasses() {
  const gatePasses = getRawSheetData('Gate Pass Register');
  return gatePasses.filter(gp => gp.Status === 'Open').map(transformGatePass);
}

// ==================== DELETE ROW UTILITY ====================

/**
 * Delete a row from a sheet by key field (soft delete via status update)
 */
function deleteRowFromSheet(sheetName, keyField, keyValue) {
  try {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const keyIndex = headers.indexOf(keyField);

    if (keyIndex === -1) return false;

    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][keyIndex] == keyValue) {
        sheet.deleteRow(i + 1);
        return true;
      }
    }

    return false;
  } catch (e) {
    Logger.log('Error deleting row: ' + e);
    return false;
  }
}

// ==================== WAREHOUSE CRUD ====================

/**
 * Update an existing warehouse
 */
function updateWarehouse(params) {
  const keyValue = params.id || params.warehouseCode;
  updateRowInSheet('Warehouse Master', 'Warehouse Code', keyValue, {
    'Warehouse Name': params.warehouseName || params['Warehouse Name'] || '',
    'Address': params.Address || params.address || '',
    'City': params.City || params.city || '',
    'State': params.State || params.state || '',
    'Pincode': params.Pincode || params.pincode || '',
    'GSTIN': params.GSTIN || params.gstin || '',
    'Contact Phone': params.ContactPhone || params.contactPhone || params.phone || '',
    'Contact Email': params.ContactEmail || params.contactEmail || params.email || '',
    'Manager Name': params.ManagerName || params.managerName || '',
    'Capacity': params.Capacity || params.capacity || '',
    'Status': params.Status || params.status || 'Active'
  });
  return { success: true };
}

/**
 * Delete a warehouse (soft delete)
 */
function deleteWarehouse(warehouseCode) {
  updateRowInSheet('Warehouse Master', 'Warehouse Code', warehouseCode, { 'Status': 'Inactive' });
  return { success: true };
}

// ==================== PLANT CRUD ====================

/**
 * Update an existing plant
 */
function updatePlant(params) {
  const keyValue = params.id || params.plantCode;
  updateRowInSheet('Production plant master', 'Plant Code', keyValue, {
    'Plant Name': params.plantName || params['Plant Name'] || '',
    'Location': params.location || '',
    'City': params.city || '',
    'State': params.state || '',
    'Pincode': params.pincode || '',
    'Manager Name': params.managerName || '',
    'Phone': params.phone || '',
    'Production Capacity': params.productionCapacity || ''
  });
  return { success: true };
}

/**
 * Delete a plant (soft delete)
 */
function deletePlant(plantCode) {
  updateRowInSheet('Production plant master', 'Plant Code', plantCode, { 'Status': 'Inactive' });
  return { success: true };
}

// ==================== DRIVER CRUD ====================

/**
 * Delete a driver (soft delete)
 */
function deleteDriver(driverId) {
  updateRowInSheet('Driver Master', 'DriverID', driverId, { 'Status': 'Inactive' });
  return { success: true };
}

// ==================== VEHICLE CRUD ====================

/**
 * Delete a vehicle (soft delete)
 */
function deleteVehicle(vehicleId) {
  updateRowInSheet('Vehicle Master', 'VehicleNumber', vehicleId, { 'Status': 'Inactive' });
  return { success: true };
}

// ==================== TEST FUNCTION ====================

/**
 * Test function to verify setup
 */
function testAPI() {
  ensureSheetsExist();

  const vendors = getVendors();
  const items = getItems();
  const warehouses = getWarehouses();

  Logger.log('Setup test complete');
  Logger.log(`Vendors: ${vendors.length}`);
  Logger.log(`Items: ${items.length}`);
  Logger.log(`Warehouses: ${warehouses.length}`);

  return {
    success: true,
    vendorCount: vendors.length,
    itemCount: items.length,
    warehouseCount: warehouses.length
  };
}
