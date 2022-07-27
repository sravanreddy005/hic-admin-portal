const express = require('express');
const router = express.Router();

const AdminController = require('../controllers/AdminController');
const PricesController = require('../controllers/PricesController');
const WebController = require('../controllers/WebController');

//Manage Authentication
router.post('/addContactInfo', WebController.addContactInfo);
router.post('/addParterUsInfo', WebController.addParterUsInfo);
router.post('/addPickupRequest', WebController.addPickupRequest);
router.post('/getCountries', PricesController.getCountries);
router.post('/getPrices', WebController.getPrices);
router.post('/getTrackingInfo', WebController.getTrackingInfo);


module.exports = router;