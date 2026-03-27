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
    { name: 'Warehouse Master', columns: ['Warehouse Code', 'Warehouse Name', 'Internal Key', 'Group Code', 'Inventory Account', 'Cost of Goods Sold Account', 'Allocation Account', 'Locked', 'Data Source', 'User Signature', 'Revenue Account'] },
    { name: 'Production plant master', columns: ['Loc No', 'Location', 'Street', 'Block'] },
    { name: 'Supervisor Master', columns: ['SupervisorID', 'Name', 'Phone', 'Email', 'Address', 'Role', 'Status', 'DateAdded'] },
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

    // Gate pass
    case 'getOpenGatePasses':
      return { success: true, data: getOpenGatePasses() };

    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get all data from a specific sheet
 */
function getSheetData(sheetName) {
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
  const items = getItems();
  return items.some(item => item.ItemCode === itemCode);
}

/**
 * Validate warehouse code exists
 */
function validateWarehouseCode(warehouseCode) {
  const warehouses = getWarehouses();
  return warehouses.some(w => w['Warehouse Code'] === warehouseCode);
}

/**
 * Get item details by code
 */
function getItemByCode(itemCode) {
  const items = getItems();
  return items.find(item => item.ItemCode === itemCode);
}

/**
 * Get warehouse details by code
 */
function getWarehouseByCode(warehouseCode) {
  const warehouses = getWarehouses();
  return warehouses.find(w => w['Warehouse Code'] === warehouseCode);
}

/**
 * Get vendor details by code
 */
function getVendorByCode(vendorCode) {
  const vendors = getVendors();
  return vendors.find(v => v['BP Code'] === vendorCode);
}

// ==================== VENDOR MASTER OPERATIONS ====================

/**
 * Get all vendors
 */
function getVendors() {
  return getSheetData('Vendor & Customer Master');
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
    v['BP Name'].toString().toLowerCase().includes(query.toLowerCase()) ||
    v['BP Code'].toString().toLowerCase().includes(query.toLowerCase())
  );
}

// ==================== ITEM MASTER OPERATIONS ====================

/**
 * Get all items
 */
function getItems() {
  return getSheetData('Item Master');
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
    item.ItemCode.toString().toLowerCase().includes(query.toLowerCase()) ||
    item['Item Description'].toString().toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * Get unique UOM list from Item Master
 */
function getUOMList() {
  const items = getItems();
  const uoms = new Set();

  for (const item of items) {
    // Note: Item Master doesn't have explicit UOM column, extract from Batch Master or default
    uoms.add('PCS'); // Default UOM
  }

  return Array.from(uoms);
}

// ==================== WAREHOUSE MASTER OPERATIONS ====================

/**
 * Get all warehouses
 */
function getWarehouses() {
  return getSheetData('Warehouse Master');
}

/**
 * Add new warehouse
 */
function addWarehouse(params) {
  const newWarehouse = {
    'Warehouse Code': params.WarehouseCode,
    'Warehouse Name': params.WarehouseName,
    'Internal Key': params.InternalKey || '',
    'Group Code': params.GroupCode || '',
    'Inventory Account': params.InventoryAccount || '',
    'Cost of Goods Sold Account': params.COGSAccount || '',
    'Allocation Account': params.AllocationAccount || '',
    'Locked': params.Locked || 'No',
    'Data Source': params.DataSource || '',
    'User Signature': params.UserSignature || '',
    'Revenue Account': params.RevenueAccount || ''
  };

  appendRowToSheet('Warehouse Master', newWarehouse);
  return newWarehouse;
}

// ==================== PRODUCTION PLANT MASTER OPERATIONS ====================

/**
 * Get all production plants
 */
function getPlants() {
  return getSheetData('Production plant master');
}

/**
 * Add new production plant
 */
function addPlant(params) {
  const newPlant = {
    'Loc No': params.LocNo,
    'Location': params.Location,
    'Street': params.Street || '',
    'Block': params.Block || ''
  };

  appendRowToSheet('Production plant master', newPlant);
  return newPlant;
}

// ==================== SUPERVISOR MASTER OPERATIONS ====================

/**
 * Get all supervisors
 */
function getSupervisors() {
  return getSheetData('Supervisor Master');
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
    'Address': params.Address || params.assignedWarehouse || '',
    'Role': params.Role || params.department || 'Loading-Unloading Supervisor',
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
  return getSheetData('Driver Master');
}

/**
 * Add new driver
 */
function addDriver(params) {
  const driverID = generateSequentialID('DRV', 'Driver Master', 'DriverID');

  const newDriver = {
    'DriverID': driverID,
    'Name': params.Name,
    'Phone': params.Phone || '',
    'LicenseNumber': params.LicenseNumber || '',
    'Address': params.Address || '',
    'Email': params.Email || '',
    'Status': params.Status || 'Active',
    'DateAdded': new Date()
  };

  appendRowToSheet('Driver Master', newDriver);
  return newDriver;
}

/**
 * Update driver
 */
function updateDriver(params) {
  updateRowInSheet('Driver Master', 'DriverID', params.DriverID, {
    'Name': params.Name,
    'Phone': params.Phone,
    'LicenseNumber': params.LicenseNumber,
    'Address': params.Address,
    'Email': params.Email,
    'Status': params.Status
  });

  return { success: true };
}

// ==================== VEHICLE MASTER OPERATIONS ====================

/**
 * Get all vehicles
 */
function getVehicles() {
  return getSheetData('Vehicle Master');
}

/**
 * Add new vehicle
 */
function addVehicle(params) {
  const newVehicle = {
    'VehicleNumber': params.VehicleNumber,
    'VehicleType': params.VehicleType || 'Truck',
    'VehicleSize': params.VehicleSize || '',
    'OwnerName': params.OwnerName || '',
    'Status': params.Status || 'Active',
    'DateAdded': new Date()
  };

  appendRowToSheet('Vehicle Master', newVehicle);
  return newVehicle;
}

/**
 * Update vehicle
 */
function updateVehicle(params) {
  updateRowInSheet('Vehicle Master', 'VehicleNumber', params.VehicleNumber, {
    'VehicleType': params.VehicleType,
    'VehicleSize': params.VehicleSize,
    'OwnerName': params.OwnerName,
    'Status': params.Status
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
  return getSheetData('GRN Transactions');
}

/**
 * Get GRN by number with line items
 */
function getGRNById(grnNumber) {
  const grns = getGRNs();
  const grn = grns.find(g => g.GRNNumber === grnNumber);

  if (!grn) return null;

  const lineItems = getSheetData('GRN Line Items').filter(li => li.GRNNumber === grnNumber);

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
  return getSheetData('Material Requisitions');
}

/**
 * Get requisition by number with line items
 */
function getRequisitionById(requisitionNumber) {
  const requisitions = getRequisitions();
  const req = requisitions.find(r => r.RequisitionNumber === requisitionNumber);

  if (!req) return null;

  const lineItems = getSheetData('Requisition Line Items').filter(li => li.RequisitionNumber === requisitionNumber);

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
  return getSheetData('Internal Dispatches');
}

/**
 * Get dispatch by number with line items
 */
function getDispatchById(dcNumber) {
  const dispatches = getDispatches();
  const dispatch = dispatches.find(d => d.DCNumber === dcNumber);

  if (!dispatch) return null;

  const lineItems = getSheetData('Dispatch Line Items').filter(li => li.DCNumber === dcNumber);

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
  return getSheetData('Internal Receipts');
}

/**
 * Get receipt by number with line items
 */
function getReceiptById(receiptNumber) {
  const receipts = getReceipts();
  const receipt = receipts.find(r => r.ReceiptNumber === receiptNumber);

  if (!receipt) return null;

  const lineItems = getSheetData('Receipt Line Items').filter(li => li.ReceiptNumber === receiptNumber);

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
  const reconciliations = getSheetData('Reconciliation');
  return reconciliations.filter(r => r.Status === 'Open');
}

/**
 * Get reconciliations by DC number
 */
function getReconciliationsByDC(dcNumber) {
  const reconciliations = getSheetData('Reconciliation');
  return reconciliations.filter(r => r.DCNumber === dcNumber);
}

/**
 * Reconcile document
 */
function reconcileDocument(params) {
  const recoID = params.RecoID;

  updateRowInSheet('Reconciliation', 'RecoID', recoID, {
    'Status': 'Closed',
    'ResolvedDate': new Date(),
    'Remarks': params.Remarks || ''
  });

  return { success: true };
}

// ==================== STOCK OPERATIONS ====================

/**
 * Get stock by warehouse
 */
function getStockByWarehouse(warehouseCode) {
  const stock = getSheetData('Stock Master');
  return stock.filter(s => s.WarehouseCode === warehouseCode);
}

/**
 * Get overall stock across all warehouses
 */
function getOverallStock() {
  return getSheetData('Stock Master');
}

/**
 * Get goods in transit
 */
function getGoodsInTransit() {
  const goodsInTransit = getSheetData('Goods In Transit');
  return goodsInTransit.filter(g => g.Status === 'InTransit');
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
  return getSheetData('Production Issues');
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
  return getSheetData('Production Output');
}

// ==================== FINISHED GOODS STOCK OPERATIONS ====================

/**
 * Get FG stock
 */
function getFGStock() {
  return getSheetData('FG Stock Master');
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
  return getSheetData('Supervisor Scores');
}

/**
 * Update supervisor score based on accuracy
 */
function updateSupervisorScore(supervisorID) {
  const supervisors = getSupervisors();
  const supervisor = supervisors.find(s => s.SupervisorID === supervisorID);

  if (!supervisor) {
    return { success: false, error: 'Supervisor not found' };
  }

  // Count dispatches and receipts
  const dispatches = getDispatches().filter(d => d.SupervisorName === supervisor.Name);
  const receipts = getReceipts();

  // Calculate accuracy based on reconciliations
  const reconciliations = getSheetData('Reconciliation');
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
  const supervisorScores = getSupervisorScores();
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
  const allScores = getSheetData('Supervisor Scores').sort((a, b) => b.AccuracyScore - a.AccuracyScore);
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
  return getSheetData('Rejected Stock');
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
  const gatePasses = getSheetData('Gate Pass Register');
  return gatePasses.filter(gp => gp.Status === 'Open');
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
    'Location': params.location || '',
    'City': params.city || '',
    'State': params.state || '',
    'Pincode': params.pincode || '',
    'Manager Name': params.managerName || '',
    'Phone': params.phone || '',
    'Capacity': params.capacity || ''
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
