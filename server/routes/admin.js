const express = require('express');
const router = express.Router();
const jwt = require('../helpers/jwt');
const { uploadCSVFiles, uploadImages, uploadFiles } = require('../helpers/fileUpload');

const AdminController = require('../controllers/AdminController');
const PricesController = require('../controllers/PricesController');
const ShipmentsController = require('../controllers/ShipmentsController');
const StockController = require('../controllers/StockController');

router.post('/getProfile', jwt.verifyAdminJwtToken, AdminController.getAdminProfile);
router.post('/updateProfile', jwt.verifyAdminJwtToken, AdminController.updateProfile);
router.post('/updateEmail', jwt.verifyAdminJwtToken, AdminController.updateEmail);
router.post('/updatePassword', jwt.verifyAdminJwtToken, AdminController.updatePassword);

router.post('/downLoadFiles', jwt.verifyAdminJwtToken, AdminController.downLoadFiles);
router.post('/generateInvoicePDF', jwt.verifyAdminJwtToken, AdminController.generateInvoicePDF);

//Admin Modules
router.post('/getModules', jwt.verifyAdminJwtTokenWithAccess('modules-list', 'view'), AdminController.getModules);
router.post('/addModule', jwt.verifyAdminJwtTokenWithAccess('modules-list', 'edit'), AdminController.createModule);
// router.post('/updateModule', jwt.verifyAdminJwtTokenWithAccess('modules-list', 'edit'), AdminController.updateModule);

//Role Types
router.post('/getRoleTypes', jwt.verifyAdminJwtTokenWithAccess('roles', 'edit'), AdminController.getRoleTypes);

//Roles
router.post('/createRole', jwt.verifyAdminJwtTokenWithAccess('roles', 'edit'), AdminController.createRole);
router.post('/getRoles', jwt.verifyAdminJwtToken, AdminController.getRoles);
router.post('/updateRole', jwt.verifyAdminJwtTokenWithAccess('roles', 'edit'), AdminController.updateRole);

//Manage Admins
router.post('/createSuperAdmin', jwt.verifyAdminJwtToken, AdminController.createSuperAdmin);
router.post('/createUser', jwt.verifyAdminJwtTokenWithAccess('users', 'edit'), AdminController.createAdmin);
router.post('/getUsersList', jwt.verifyAdminJwtTokenWithAccess('users', 'view'), AdminController.getAdminsList);
router.post('/getUsersCount', jwt.verifyAdminJwtToken, AdminController.getUsersCount);
router.post('/updateUser', jwt.verifyAdminJwtTokenWithAccess('users', 'edit'), AdminController.updateAdmin);
router.post('/generateUserPassword', jwt.verifyAdminJwtTokenWithAccess('users', 'edit'), AdminController.generateUserPassword);
router.post('/updateUserStatus', jwt.verifyAdminJwtTokenWithAccess('users', 'edit'), AdminController.updateAdminStatus);
router.post('/deleteUser', jwt.verifyAdminJwtTokenWithAccess('users', 'delete'), AdminController.deleteAdmin);

//Manage Countries
router.post('/getCountries', PricesController.getCountries);
router.post('/addCountry', jwt.verifyAdminJwtTokenWithAccess('countries', 'edit'), PricesController.addCountries);
router.post('/updateCountry', jwt.verifyAdminJwtTokenWithAccess('countries', 'edit'), PricesController.updateCountries);
router.post('/deleteCountry', jwt.verifyAdminJwtTokenWithAccess('countries', 'delete'), PricesController.deleteCountries);

//Manage Carriers
router.post('/getCarriers', PricesController.getCarriers);
router.post('/addCarrier', jwt.verifyAdminJwtTokenWithAccess('carriers', 'edit'), PricesController.addCarrier);
router.post('/updateCarrier', jwt.verifyAdminJwtTokenWithAccess('carriers', 'edit'), PricesController.updateCarrier);
router.post('/deleteCarrier', jwt.verifyAdminJwtTokenWithAccess('carriers', 'delete'), PricesController.deleteCarrier);

//Manage Carrier Zones
router.post('/getCarrierZones', jwt.verifyAdminJwtToken, PricesController.getCarrierZones);
router.post('/addCarrierZone', jwt.verifyAdminJwtTokenWithAccess('carrier-zones', 'edit'), PricesController.addCarrierZone);
router.post('/uploadCarrierZones', jwt.verifyAdminJwtTokenWithAccess('carrier-zones', 'edit'), uploadCSVFiles.fields([{name: 'carrier_zones_file', maxCount: 1}]), PricesController.uploadCarrierZones);
router.post('/updateCarrierZone', jwt.verifyAdminJwtTokenWithAccess('carrier-zones', 'edit'), PricesController.updateCarrierZone);
router.post('/deleteCarrierZone', jwt.verifyAdminJwtTokenWithAccess('carrier-zones', 'delete'), PricesController.deleteCarrierZone);
router.post('/deleteAllCarrierZones', jwt.verifyAdminJwtTokenWithAccess('carrier-zones', 'delete'), PricesController.deleteAllCarrierZones);

//Manage Carrier Prices
router.post('/getPrices', jwt.verifyAdminJwtToken, PricesController.getPrices);
router.post('/getCarrrierZonePrices', jwt.verifyAdminJwtToken, PricesController.getCarrrierZonePrices);
router.post('/addPrices', jwt.verifyAdminJwtTokenWithAccess('prices', 'edit'), PricesController.addPrice);
router.post('/uploadPrices', jwt.verifyAdminJwtTokenWithAccess('prices', 'edit'), uploadCSVFiles.fields([{name: 'prices_file', maxCount: 1}]), PricesController.uploadPrices);
router.post('/updatePrice', jwt.verifyAdminJwtTokenWithAccess('prices', 'edit'), PricesController.updatePrice);
router.post('/deletePrice', jwt.verifyAdminJwtTokenWithAccess('prices', 'delete'), PricesController.deletePrice);
router.post('/deleteAllPrices', jwt.verifyAdminJwtTokenWithAccess('prices', 'delete'), PricesController.deleteAllPrices);

//Manage Branches
router.post('/getBranches', jwt.verifyAdminJwtToken, AdminController.getBranches);
router.post('/getBranchesCount', jwt.verifyAdminJwtToken, AdminController.getBranchesCount);
router.post('/addBranch', jwt.verifyAdminJwtTokenWithAccess('branches', 'edit'), uploadImages.fields([{name: 'branch_photo', maxCount: 1}]), AdminController.addBranch);
router.post('/updateBranch', jwt.verifyAdminJwtTokenWithAccess('branches', 'edit'), uploadImages.fields([{name: 'branch_photo', maxCount: 1}]), AdminController.updateBranch);
router.post('/updateBranchStatus', jwt.verifyAdminJwtTokenWithAccess('branches', 'edit'), AdminController.updateBranchStatus);
// router.post('/deleteBranch', jwt.verifyAdminJwtTokenWithAccess('branches', 'delete'), AdminController.deleteBranch);

//Manage Branch Commissions
router.post('/getBranchCommissions', jwt.verifyAdminJwtToken, AdminController.getBranchCommissions);
router.post('/addBranchCommission', jwt.verifyAdminJwtTokenWithAccess('branches', 'edit'), AdminController.addBranchCommission);
router.post('/updateBranchCommission', jwt.verifyAdminJwtTokenWithAccess('branches', 'edit'), AdminController.updateBranchCommission);
router.post('/deleteBranchCommission', jwt.verifyAdminJwtTokenWithAccess('branches', 'delete'), AdminController.deleteBranchCommission);

//Manage Commodities
router.post('/getCommodityList', jwt.verifyAdminJwtToken, AdminController.getCommodities);
router.post('/addCommodity', jwt.verifyAdminJwtTokenWithAccess('commodity-list', 'edit'), AdminController.addCommodity);
router.post('/uploadCommodities', jwt.verifyAdminJwtTokenWithAccess('commodity-list', 'edit'), uploadCSVFiles.fields([{name: 'commodity_file', maxCount: 1}]), AdminController.uploadCommodities);
router.post('/updateCommodity', jwt.verifyAdminJwtTokenWithAccess('commodity-list', 'edit'), AdminController.updateCommodity);
router.post('/deleteCommodity', jwt.verifyAdminJwtTokenWithAccess('commodity-list', 'delete'), AdminController.deleteCommodity);
router.post('/deleteAllCommodities', jwt.verifyAdminJwtTokenWithAccess('commodity-list', 'delete'), AdminController.deleteAllCommodities);

//Manage Shipments
router.post('/getEmptyTrackingShipmentsList', jwt.verifyAdminJwtToken, ShipmentsController.getEmptyTrackingShipmentsList);
router.post('/getShipmentsCount', jwt.verifyAdminJwtToken, ShipmentsController.getShipmentsCount);
router.post('/getShipmentsList', jwt.verifyAdminJwtToken, ShipmentsController.getShipmentsList);
router.post('/getShipmentDetails', jwt.verifyAdminJwtTokenWithAccess('shipments-list', 'view'), ShipmentsController.getShipmentDetails);
router.post('/getShipmentsByBranch', jwt.verifyAdminJwtToken, ShipmentsController.getShipmentsByBranch);
router.post('/addShipment', jwt.verifyAdminJwtTokenWithAccess('add-shipments', 'edit'), uploadFiles.fields([{name: 'kyc_files', maxCount: 2}]), ShipmentsController.addShipment);
router.post('/updateShipmentDetails', jwt.verifyAdminJwtTokenWithAccess('shipments-list', 'edit'), ShipmentsController.updateShipmentDetails);
router.post('/updateShipmentTrackingNos', jwt.verifyAdminJwtTokenWithAccess('empty-tracking-shipments', 'edit'), ShipmentsController.updateShipmentTrackingNos);
router.post('/annonymiseEmptyShipment', jwt.verifyAdminJwtTokenWithAccess('empty-tracking-shipments', 'delete'), ShipmentsController.annonymiseShipment);
router.post('/annonymiseShipment', jwt.verifyAdminJwtTokenWithAccess('shipments-list', 'delete'), ShipmentsController.annonymiseShipment);
router.post('/checkInvoiceNoAvailable', jwt.verifyAdminJwtToken, ShipmentsController.checkInvoiceNoAvailable);

//Manage Bank Transactions
router.post('/getBankTransactions', jwt.verifyAdminJwtTokenWithAccess('bank-transactions', 'view'), ShipmentsController.getBankTransactions);
router.post('/addBankTransaction', jwt.verifyAdminJwtTokenWithAccess('bank-transactions', 'edit'), uploadFiles.fields([{name: 'transaction_proof', maxCount: 2}]), ShipmentsController.addBankTransaction);
router.post('/updateBankTransaction', jwt.verifyAdminJwtTokenWithAccess('bank-transactions', 'edit'), uploadFiles.fields([{name: 'transaction_proof', maxCount: 2}]), ShipmentsController.updateBankTransaction);

//Manage Branch Commission Payments
router.post('/getBranchCommissionPayments', jwt.verifyAdminJwtTokenWithAccess('branch-commission-payments', 'view'), AdminController.getBranchCommissionPayments);
router.post('/addBranchCommissionPayment', jwt.verifyAdminJwtTokenWithAccess('branch-commission-payments', 'edit'), uploadFiles.fields([{name: 'transaction_proof', maxCount: 2}]), AdminController.addBranchCommissionPayment);
router.post('/updateBranchCommissionPayment', jwt.verifyAdminJwtTokenWithAccess('branch-commission-payments', 'edit'), uploadFiles.fields([{name: 'transaction_proof', maxCount: 2}]), AdminController.updateBranchCommissionPayment);
router.post('/deleteBranchCommissionPayment', jwt.verifyAdminJwtTokenWithAccess('branch-commission-payments', 'delete'), AdminController.deleteBranchCommissionPayment);

//Manage Branch Expenses
router.post('/getExpenses', jwt.verifyAdminJwtTokenWithAccess('expenses', 'view'), AdminController.getExpenses);
router.post('/addExpenses', jwt.verifyAdminJwtTokenWithAccess('expenses', 'view'), AdminController.addExpenses);
router.post('/updateExpenses', jwt.verifyAdminJwtTokenWithAccess('expenses', 'edit'), AdminController.updateExpenses);
router.post('/deleteExpenses', jwt.verifyAdminJwtTokenWithAccess('expenses', 'delete'), AdminController.deleteExpenses);

//Manage Stock Purchases
router.post('/getStockPurchases', jwt.verifyAdminJwtTokenWithAccess('stock-purchases', 'view'), StockController.getStockPurchases);
router.post('/addStockPurchases', jwt.verifyAdminJwtTokenWithAccess('stock-purchases', 'edit'), StockController.addStockPurchases);
router.post('/updateStockPurchases', jwt.verifyAdminJwtTokenWithAccess('stock-purchases', 'edit'), StockController.updateStockPurchases);
router.post('/deleteStockPurchases', jwt.verifyAdminJwtTokenWithAccess('stock-purchases', 'delete'), StockController.deleteStockPurchases);

//Manage Stock Requests
router.post('/getStockRequests', jwt.verifyAdminJwtTokenWithAccess('stock-requests', 'view'), StockController.getStockRequests);
router.post('/getStockRequestsCount', jwt.verifyAdminJwtToken, StockController.getStockRequestsCount);
router.post('/addStockRequests', jwt.verifyAdminJwtTokenWithAccess('stock-requests', 'edit'), StockController.addStockRequests);
router.post('/updateStockRequests', jwt.verifyAdminJwtTokenWithAccess('stock-requests', 'edit'), StockController.updateStockRequests);
router.post('/deleteStockRequests', jwt.verifyAdminJwtTokenWithAccess('stock-requests', 'delete'), StockController.deleteStockRequests);

//Manage Used Stock Records
router.post('/getUsedStockList', jwt.verifyAdminJwtTokenWithAccess('used-stock', 'view'), StockController.getUsedStockList);
router.post('/addUsedStock', jwt.verifyAdminJwtTokenWithAccess('used-stock', 'edit'), StockController.addUsedStockRecords);
router.post('/updateUsedStock', jwt.verifyAdminJwtTokenWithAccess('used-stock', 'edit'), StockController.updateUsedStockRecords);
router.post('/deleteUsedStock', jwt.verifyAdminJwtTokenWithAccess('used-stock', 'delete'), StockController.deleteUsedStockRecords);

//Manage Salaries
router.post('/getSalaries', jwt.verifyAdminJwtTokenWithAccess('salaries', 'view'), AdminController.getSalaries);
router.post('/addSalaries', jwt.verifyAdminJwtTokenWithAccess('salaries', 'edit'), AdminController.addSalaries);
router.post('/updateSalaries', jwt.verifyAdminJwtTokenWithAccess('salaries', 'edit'), AdminController.updateSalaries);
router.post('/deleteSalaries', jwt.verifyAdminJwtTokenWithAccess('salaries', 'delete'), AdminController.deleteSalaries);

//Manage Complaints
router.post('/getComplaints', jwt.verifyAdminJwtTokenWithAccess('complaints', 'view'), AdminController.getComplaints);
router.post('/getComplaintsCount', jwt.verifyAdminJwtToken, AdminController.getComplaintsCount);
router.post('/addComplaints', jwt.verifyAdminJwtTokenWithAccess('complaints', 'edit'), AdminController.addComplaints);
router.post('/updateComplaints', jwt.verifyAdminJwtTokenWithAccess('complaints', 'edit'), AdminController.updateComplaints);
router.post('/deleteComplaints', jwt.verifyAdminJwtTokenWithAccess('complaints', 'delete'), AdminController.deleteComplaints);

module.exports = router;