const express = require('express');
const router = express.Router();
const jwt = require('../helpers/jwt');

const AuthController = require('../controllers/AuthController');

//Manage Authentication
router.post('/authenticateUser', AuthController.authenticateUser);
router.post('/forgotPassword', AuthController.forgotPassword);
router.post('/resetPassword', AuthController.resetPassword);
router.post('/validateResetToken', AuthController.validateResetToken);
router.post('/logoutUser', jwt.verifyJwtTokenWithoutExpiry, AuthController.logoutUser);
router.post('/refreshToken', jwt.verifyJwtTokenWithoutExpiry, AuthController.refreshToken);


module.exports = router;